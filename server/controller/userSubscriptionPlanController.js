const mongoose = require("mongoose");
const UserPlanSubscription = require("../model/userSubscriptionPlanModel");
const User = require("../model/usersModel");
const Plan = require("../model/planModel");
const Percentage = require("../model/percentageModel");
const Account = require("../model/accountModel");
const Role = require("../model/rolesModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { processFile } = require("../utils/FileUpload");

const uploadScreenshot = (req, res, next) => {
  console.log("Multer middleware start:", {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
  const upload = require("../utils/FileUpload").upload;
  upload.single("payment_screenshot")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err.message, { code: err.code });
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      console.error("File upload error:", err.message);
      return res.status(400).json({ message: err.message });
    }
    console.log("Multer middleware passed:", {
      file: req.file
        ? { filename: req.file.originalname, size: req.file.size }
        : "No file",
      body: req.body,
    });
    next();
  });
};

const handleUploadScreenshot = async (req, res) => {
  console.log("Reached handleUploadScreenshot:", {
    body: req.body,
    file: req.file
      ? { originalname: req.file.originalname, size: req.file.size }
      : "No file",
  });

  const { subscription_id, username, amount, transaction_id } = req.body;

  try {
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({ message: "Please select a payment screenshot" });
    }

    if (!subscription_id || !username || !amount || !transaction_id) {
      return res.status(400).json({
        message: "Missing required fields: screenshot, subscription_id, amount, or transaction_id",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subscription_id)) {
      return res.status(400).json({ message: "Invalid subscription ID format" });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    if (!transaction_id.trim()) {
      return res.status(400).json({ message: "Please enter Transaction ID / UTR / TxID" });
    }

    // Find the subscription
    const subscription = await UserPlanSubscription.findById(subscription_id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Process and save the uploaded screenshot
    const filePath = await processFile(
      req.file.buffer,
      req.file.originalname,
      subscription.user_id.toString(),
      username,
      "payments"
    );

    // Update subscription with proof
    subscription.payment_screenshot = filePath;
    subscription.transaction_id = transaction_id.trim();
    subscription.status = "pending";
    subscription.amount = Number(amount);

    await subscription.save();

    console.log("Payment proof saved successfully:", {
      subscription_id,
      transaction_id: subscription.transaction_id,
      screenshot_path: filePath,
      status: "pending",
    });

    res.status(200).json({
      message:
        "Payment proof uploaded successfully! Awaiting admin verification (24-48 hours).",
    });
  } catch (error) {
    console.error("Upload screenshot error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      hasFile: !!req.file,
    });
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const searchUser = async (req, res) => {
  const { query } = req.query;
  try {
    const user = await User.findOne({
      $or: [{ email: query }, { phone_number: query }],
    }).select("username email phone_number");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Search user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Example backend route for purchased-plans
const getPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const subscriptions = await Subscription.find({})
      .populate("user_id", "username email phone_number")
      .populate("plan_id")
      .select("transaction_id") // <-- Ensure this is included
      .skip(skip)
      .limit(limit)
      .sort({ purchased_at: -1 });

    const total = await Subscription.countDocuments({});

    res.json({
      subscriptions: subscriptions.map(sub => ({
        ...sub._doc,
        transaction_id: sub.transaction_id || "N/A", // fallback if missing
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get purchased plans error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getAdminAccount = async (req, res) => {
  try {
    const { role_id } = req.params;
    console.log("Received role_id:", role_id);

    if (!mongoose.Types.ObjectId.isValid(role_id)) {
      console.log("Invalid role_id format:", role_id);
      return res.status(400).json({ message: "Invalid role_id format" });
    }

    const roleExists = await Role.findById(role_id);
    if (!roleExists) {
      console.log("Role not found for role_id:", role_id);
      return res.status(404).json({ message: "Role not found" });
    }

    const admin = await User.findOne({
      role_id: new mongoose.Types.ObjectId(role_id),
    });
    if (!admin) {
      console.log("Admin not found for role_id:", role_id);
      return res.status(404).json({ message: "Admin not found" });
    }
    console.log("Admin found:", admin);

    const account = await Account.findOne({
      user_id: new mongoose.Types.ObjectId(admin._id),
    });
    if (!account) {
      console.log("Account not found for user_id:", admin._id);
      return res.status(404).json({ message: "Admin account not found" });
    }

    res.json(account);
  } catch (error) {
    console.error("Get admin account error:", error);
    res.status(500).json({ message: error.message });
  }
};

const createSubscription = async (req, res) => {
  const { user_id, plan_id, username, amount } = req.body;

  console.log("Received subscription request:", { user_id, plan_id, username, amount });

  try {
    if (!user_id || !plan_id) {
      return res.status(400).json({ message: "user_id and plan_id are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(plan_id)) {
      return res.status(400).json({ message: "Invalid user_id or plan_id format" });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const userExists = await User.findById(user_id);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const planExists = await Plan.findById(plan_id);
    if (!planExists) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const inrAccount = await Account.findOne({ user_id, account_type: "INR" });
    if (!inrAccount) {
      return res.status(400).json({
        message: "User must add INR account details before purchasing a plan",
      });
    }

    const percentage = await Percentage.findOne({
      category: planExists.plan_name.toLowerCase(),
      amount_type: planExists.amount_type,
    });

    if (!percentage) {
      return res.status(404).json({
        message: "Profit percentage not found for this plan, please contact admin",
      });
    }

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + (planExists.capital_lockin || 30));

    const subscription = new UserPlanSubscription({
      user_id,
      plan_id,
      amount: Number(amount),
      profit_percentage: percentage.profit_percentage,
      expires_at,
    });

    await subscription.save();
    console.log("Subscription created:", { subscription_id: subscription._id });

    res.status(201).json({ message: "Subscription initiated", subscription });
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getPurchasedPlans = async (req, res) => {
  const { page = 1, limit = 10, user_id } = req.query;
  try {
    const query = user_id ? { user_id, planStatus: "Active", expires_at: { $gt: new Date() } } : {};
    const subscriptions = await UserPlanSubscription.find(query)
      .populate("user_id", "username email phone_number")
      .populate(
        "plan_id",
        "plan_name amount_type min_investment capital_lockin profit_withdrawal"
      )
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await UserPlanSubscription.countDocuments(query);
    res.json({
      subscriptions,
      totalPages: Math.ceil(count / limit),
      currentPage: page * 1,
    });
  } catch (error) {
    console.error("Get purchased plans error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const verifySubscription = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subscription_id format" });
    }
    const subscription = await UserPlanSubscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    subscription.status = "verified";
    subscription.planStatus = "Active";
    subscription.verified_at = Date.now();
    await subscription.save();
    res.json({ message: "Subscription verified" });
  } catch (error) {
    console.error("Verify subscription error:", error);
    res.status(500).json({ message: error.message });
  }
};

const rejectSubscription = async (req, res) => {
  const { id } = req.params;
  const { rejected_reason } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid subscription_id format" });
    }
    const subscription = await UserPlanSubscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    subscription.status = "rejected";
    subscription.rejected_reason = rejected_reason;
    await subscription.save();
    res.json({ message: "Subscription rejected" });
  } catch (error) {
    console.error("Reject subscription error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getImage = async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    const filePath = path.join(
      __dirname,
      "..",
      "Uploads",
      folderName,
      fileName
    );
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Image not found" });
    }
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error loading image:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  searchUser,
  getPlans,
  getAdminAccount,
  createSubscription,
  uploadScreenshot: [uploadScreenshot, handleUploadScreenshot],
  getPurchasedPlans,
  verifySubscription,
  rejectSubscription,
  getImage,
};
