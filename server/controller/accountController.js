const Account = require("../model/accountModel");
const User = require("../model/usersModel"); // Assuming User model exists
const { uploadQrcodeImage, updateQrcodeImage } = require("../controller/profileImageController");

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
    const accounts = await Account.find({ user_id: req.params.id }).populate("user_id", "username email");
    res.status(200).json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create account
exports.createAccount = async (req, res) => {
  try {
    const user = await User.findById(req.body.user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let qrcodePath;
    if (req.file) {
      // Use profileImageController's uploadQrcodeImage logic
      req.body.entity_type = 'qr_code'; // Set entity_type for QR code
      const uploadResponse = await new Promise((resolve, reject) => {
        uploadQrcodeImage(req, {
          status: (code) => ({
            json: (data) => resolve({ status: code, data }),
          }),
        }, (err) => reject(err));
      });

      if (uploadResponse.status !== 200) {
        return res.status(uploadResponse.status).json(uploadResponse.data);
      }
      qrcodePath = uploadResponse.data.fileUrl;
    }

    const account = new Account({
      ...req.body,
      qrcode: qrcodePath,
    });
    const saved = await account.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Create Account Error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    const user = await User.findById(account.user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let qrcodePath = account.qrcode;
    if (req.file) {
      req.body.entity_type = 'qr_code';
      req.body.old_filename = account.qrcode ? account.qrcode.split('/').pop() : null;
      const updateResponse = await new Promise((resolve, reject) => {
        updateQrcodeImage(req, {
          status: (code) => ({
            json: (data) => resolve({ status: code, data }),
          }),
        }, (err) => reject(err));
      });

      if (updateResponse.status !== 200) {
        return res.status(updateResponse.status).json(updateResponse.data);
      }
      qrcodePath = updateResponse.data.fileUrl;
    }

    const updatedData = {
      ...req.body,
      qrcode: qrcodePath,
    };
    const updated = await Account.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Update Account Error:', err);
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
      const filename = account.qrcode.split('/').pop();
      const filePath = path.join(__dirname, '..', 'Uploads', 'qr_code', account.user_id, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Account.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error('Delete Account Error:', err);
    res.status(500).json({ message: err.message });
  }
};