// Updated backend controller: controller/accountController.js
const Account = require("../model/accountModel");
const User = require("../model/usersModel"); // Assuming User model exists
const path = require('path');
const fs = require('fs');

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
      const random = Math.floor(100000 + Math.random() * 900000);
      const ext = path.extname(req.file.originalname);
      const filename = `${user.username}${random}${ext}`;
      const dir = path.join(__dirname, '..', 'Uploads', 'qr_code');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      qrcodePath = `/Uploads/qr_code/${filename}`;
    }

    const account = new Account({
      ...req.body,
      qrcode: qrcodePath,
    });
    const saved = await account.save();
    res.status(201).json(saved);
  } catch (err) {
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
      // Delete old QR code if exists
      if (qrcodePath) {
        const oldPath = path.join(__dirname, '..', qrcodePath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      const random = Math.floor(100000 + Math.random() * 900000);
      const ext = path.extname(req.file.originalname);
      const filename = `${user.username}${random}${ext}`;
      const dir = path.join(__dirname, '..', 'Uploads', 'qr_code');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      qrcodePath = `/Uploads/qr_code/${filename}`;
    }

    const updatedData = {
      ...req.body,
      qrcode: qrcodePath,
    };
    const updated = await Account.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json(updated);
  } catch (err) {
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
      const qrPath = path.join(__dirname, '..', account.qrcode);
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }
    }

    await Account.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};