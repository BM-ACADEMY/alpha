const Account = require("../model/accountModel");
const User = require("../model/usersModel"); // Assuming User model exists
const {
  uploadQrcodeImage,
  updateQrcodeImage,
} = require("../controller/profileImageController");

// Get all accounts
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().populate("user_id", "username email");
    res.status(200).json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get account by ID

exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).populate(
      "user_id",
      "username email"
    );
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.status(200).json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.getAccountById = async (req, res) => {
//   try {
//     const account = await Account.findById(req.params.id).populate("user_id", "username email");
//     if (!account) return res.status(404).json({ message: "Account not found" });
//     res.status(200).json(account);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


// Get accounts by user ID
exports.getAccountsByUserId = async (req, res) => {
  try {
    const accounts = await Account.find({ user_id: req.params.id }).populate(
      "user_id",
      "username email"
    );
    res.status(200).json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Create account
exports.createAccount = async (req, res) => {
  try {
    // Validate user existence
    const user = await User.findById(req.body.user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate account type
    const { account_type } = req.body;
    if (!account_type || !['INR', 'USDT'].includes(account_type)) {
      return res.status(400).json({ message: 'Valid account type (INR or USDT) is required' });
    }

    // Validate required fields based on account type
    if (account_type === 'INR') {
      const requiredFields = ['bank_name', 'ifsc_code', 'account_holder_name', 'account_number', 'linked_phone_number'];
      for (const field of requiredFields) {
        if (!req.body[field]?.trim()) {
          return res.status(400).json({ message: `${field} is required for INR accounts` });
        }
      }
      // Validate UPI ID format (optional field)
      if (req.body.upi_id && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(req.body.upi_id)) {
        return res.status(400).json({ message: 'Invalid UPI ID format' });
      }
      // Validate UPI number format (optional field)
      if (req.body.upi_number && !/^\d{10}$/.test(req.body.upi_number)) {
        return res.status(400).json({ message: 'UPI Number must be 10 digits' });
      }
    } else if (account_type === 'USDT') {
      if (!req.body.usdt_account_number?.trim()) {
        return res.status(400).json({ message: 'USDT account number is required for USDT accounts' });
      }
    }

    // Handle QR code (common for both INR and USDT)
    let qrcodePath = null; // Initialize as null
    if (req.file) {
      // Process file upload
      req.body.entity_type = 'qr_code';
      req.body.user_id = user._id;

      const uploadResponse = await new Promise((resolve, reject) => {
        uploadQrcodeImage(
          req,
          {
            status: (code) => ({
              json: (data) => resolve({ status: code, data }),
            }),
          },
          (err) => reject(err)
        );
      });

      if (uploadResponse.status !== 200) {
        return res.status(uploadResponse.status).json(uploadResponse.data);
      }

      qrcodePath = uploadResponse.data.fileUrl;
      if (!qrcodePath) {
        return res.status(500).json({ message: 'QR code upload succeeded but no file URL was returned' });
      }
    } else if (req.body.qrcode) {
      // Use provided QR code URL
      qrcodePath = req.body.qrcode;
      // Optional: Validate URL format
      try {
        new URL(qrcodePath);
      } catch {
        return res.status(400).json({ message: 'Invalid QR code URL format' });
      }
    }

    // Check account limits (one INR and one USDT account per user)
    const existingAccounts = await Account.find({ user_id: user._id });
    if (existingAccounts.some((acc) => acc.account_type === account_type)) {
      return res.status(400).json({ message: `You already have a ${account_type} account` });
    }

    // Create new account
    const account = new Account({
      user_id: user._id,
      account_type: req.body.account_type,
      bank_name: req.body.bank_name || undefined,
      ifsc_code: req.body.ifsc_code || undefined,
      account_holder_name: req.body.account_holder_name || undefined,
      account_number: req.body.account_number || undefined,
      linked_phone_number: req.body.linked_phone_number || undefined,
      upi_id: req.body.upi_id || undefined,
      upi_number: req.body.upi_number || undefined,
      usdt_account_number: req.body.usdt_account_number || undefined,
      qrcode: qrcodePath, // Common QR code field for both account types
    });

    const saved = await account.save();
    res.status(201).json({
      ...saved.toObject(),
      qrcodeUrl: saved.qrcode ? await getImageUrl(saved.qrcode, user._id, 'qr_code') : null,
    });
  } catch (err) {
    console.error('Create Account Error:', err);
    res.status(400).json({ message: err.message || 'Failed to create account' });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const user = await User.findById(account.user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let qrcodePath = account.qrcode; // default: existing path

    // If a new file is uploaded, process it
    if (req.file) {
      req.body.entity_type = "qr_code";
      req.body.user_id = account.user_id;
      req.body.old_filename = account.qrcode ? account.qrcode.split("/").pop() : null;

      const updateResponse = await new Promise((resolve, reject) => {
        updateQrcodeImage(
          req,
          {
            status: (code) => ({
              json: (data) => resolve({ status: code, data }),
            }),
          },
          (err) => reject(err)
        );
      });

      if (updateResponse.status !== 200) {
        return res.status(updateResponse.status).json(updateResponse.data);
      }

      qrcodePath = updateResponse.data.fileUrl;
    }
    // If no file uploaded, but frontend sent a URL, use it
    else if (req.body.qrcode) {
      qrcodePath = req.body.qrcode;
    }

    // Merge updated data
    const updatedData = {
      ...req.body,
      qrcode: qrcodePath,
    };

    const updated = await Account.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error("Update Account Error:", err);
    res.status(400).json({ message: err.message });
  }
};


// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    // Delete QR code if exists
    if (account.qrcode) {
      const filename = account.qrcode.split("/").pop();
      const filePath = path.join(
        __dirname,
        "..",
        "Uploads",
        "qr_code",
        account.user_id,
        filename
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Account.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete Account Error:", err);
    res.status(500).json({ message: err.message });
  }
};
