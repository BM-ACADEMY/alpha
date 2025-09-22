const Redeem = require("../model/redeemModel");
const Wallet = require("../model/walletModel");
const User = require("../model/usersModel");
const transporter = require("../utils/nodemailer");
const Role = require("../model/rolesModel");

exports.createRedeemRequest = async (req, res) => {
  try {
    const { user_id, redeem_amount, accountType } = req.body;

    // Validate input
    if (!user_id || !redeem_amount || !accountType) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!["INR", "USDT"].includes(accountType)) {
      return res.status(400).json({ message: "Invalid account type" });
    }
    if (redeem_amount <= 0) {
      return res.status(400).json({ message: "Redeem amount must be greater than 0" });
    }

    // Check wallet
    const wallet = await Wallet.findOne({ user_id });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    const availableProfit = wallet.totalWalletPoint - wallet.userPlanCapitalAmount;
    if (availableProfit < redeem_amount) {
      return res.status(400).json({ message: `Insufficient accumulated profit (${availableProfit.toFixed(2)} INR)` });
    }
    if (availableProfit < 1000) {
      return res.status(400).json({ message: "Accumulated profit must be at least 1000 INR to redeem" });
    }

    // Create redeem request
    const redeem = new Redeem({
      user_id,
      redeem_amount,
      account_type: accountType,
      status: "pending",
      email_send: false,
      amount_send: false,
    });
    await redeem.save();

    // Fetch user for email
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send email to admin
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1e293b; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Alpha R - Trading Platform</h2>
        </div>
        <div style="padding: 20px; color: #333;">
          <h3 style="color: #1e40af;">New Redeem Request</h3>
          <p>Dear Admin,</p>
          <p>A new redeem request has been submitted with the following details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f9fafb;">
              <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>User</strong></td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${user.username} (${user.email})</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Redeem Amount</strong></td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${redeem_amount} ${accountType}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Status</strong></td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Pending</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Submitted At</strong></td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date(redeem.created_at).toLocaleString()}</td>
            </tr>
          </table>
          <p>Please review the request in the admin panel.</p>
          <p>Best Regards,<br/><strong>Alpha R System</strong></p>
        </div>
        <div style="background: #f3f4f6; text-align: center; padding: 15px; font-size: 12px; color: #555;">
          &copy; ${new Date().getFullYear()} Alpha R. All rights reserved.<br/>
          This is an automated message, please do not reply directly.
        </div>
      </div>
    `;

    const adminRole = await Role.findOne({ role_name: "admin" });
    const adminUsers = await User.find({ role_id: adminRole._id });
    const adminEmails = adminUsers.map((u) => u.email);

    if (adminEmails.length === 0) {
      console.warn("No admin users found to send email");
    } else {
      await transporter.sendMail({
        from: `"Alpha R Support" <${process.env.EMAIL_USER}>`,
        to: adminEmails.join(","),
        subject: "New Redeem Request - Alpha R",
        html: htmlContent,
      });
    }

    redeem.email_send = true;
    await redeem.save();

    res.status(201).json({ message: "Redeem request submitted successfully", redeem });
  } catch (err) {
    console.error("Error creating redeem request:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get Wallet by User ID
exports.getWalletByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const wallet = await Wallet.findOne({ user_id }).populate(
      "user_id",
      "username email"
    );
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    res.json(wallet);
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};


// Get All Redeem Requests
exports.getAllRedeemRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const redeemRequests = await Redeem.find()
      .populate('user_id', 'username email')
      .sort({ created_at: -1 }) 
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Redeem.countDocuments();

    res.json({ redeemRequests, total, page, limit });
  } catch (err) {
    console.error('Error fetching redeem requests:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


exports.updateRedeemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const redeem = await Redeem.findById(id);
    if (!redeem) {
      return res.status(404).json({ message: 'Redeem request not found' });
    }

    // Update wallet if approved
    if (status === 'approved') {
      const wallet = await Wallet.findOne({ user_id: redeem.user_id });
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      // Subtract redeem_amount from totalWalletPoint
      const availableProfit = wallet.totalWalletPoint - wallet.userPlanCapitalAmount;
      if (availableProfit < redeem.redeem_amount) {
        return res.status(400).json({ message: `Insufficient accumulated profit (${availableProfit.toFixed(2)} INR)` });
      }

      // Update wallet
      wallet.totalWalletPoint -= redeem.redeem_amount;
      wallet.dailyProfitAmount = 0; // Reset dailyProfitAmount or adjust based on cron logic
      await wallet.save();
    }

    // Update redeem status and amount_send
    redeem.status = status;
    redeem.amount_send = status === 'approved';
    await redeem.save();

    // Notify user via email
    const user = await User.findById(redeem.user_id);
    if (user) {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: #1e293b; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0;">Alpha R - Trading Platform</h2>
          </div>
          <div style="padding: 20px; color: #333;">
            <h3 style="color: #1e40af;">Redeem Request Update</h3>
            <p>Dear ${user.username},</p>
            <p>Your redeem request has been updated with the following details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Redeem Amount</strong></td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${redeem.redeem_amount} ${redeem.account_type}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Status</strong></td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${status.charAt(0).toUpperCase() + status.slice(1)}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Updated At</strong></td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
            <p>${
              status === 'approved'
                ? 'The amount has been sent to your account.'
                : 'We regret to inform you that your request was rejected. Please contact support for more details.'
            }</p>
            <p>Best Regards,<br/><strong>Alpha R Support Team</strong></p>
          </div>
          <div style="background: #f3f4f6; text-align: center; padding: 15px; font-size: 12px; color: #555;">
            &copy; ${new Date().getFullYear()} Alpha R. All rights reserved.<br/>
            This is an automated message, please do not reply directly.
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Alpha R Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Redeem Request ${status.charAt(0).toUpperCase() + status.slice(1)} - Alpha R`,
        html: htmlContent,
      });
    }

    res.json({ message: `Redeem request ${status} successfully`, redeem });
  } catch (err) {
    console.error('Error updating redeem status:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


// Get Redeem Requests by User ID
exports.getUserRedeemRequests = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const redeemRequests = await Redeem.find({ user_id })
      .populate('user_id', 'username email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Redeem.countDocuments({ user_id });

    res.json({ redeemRequests, total, page, limit });
  } catch (err) {
    console.error('Error fetching user redeem requests:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};