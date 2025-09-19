const User = require("../model/usersModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../utils/nodemailer");
const Role = require("../model/rolesModel");
const Address = require("../model/addressModel");
const Account = require("../model/accountModel");
const UserPlanSubscription = require("../model/userSubscriptionPlanModel");
const Wallet = require("../model/walletModel");
const Plan = require("../model/planModel");

// Get all users
// Get all users with role = "user"
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate({
        path: "role_id",
        match: { role_name: "user" },
        select: "role_name",
      });

    // filter out users with null role_id (non-user roles)
    const filteredUsers = users.filter((u) => u.role_id !== null);

    res.status(200).json(filteredUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Register User
// exports.registerUser = async (req, res) => {
//   const { username, email, phone_number, password, confirmPassword } = req.body;

//   if (password !== confirmPassword) {
//     return res.status(400).json({ message: "Passwords do not match" });
//   }

//   try {
//     // Check if email or phone number already exists
//     const existingUser = await User.findOne({
//       $or: [{ email }, { phone_number }],
//     });

//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ message: "Email or phone number already exists" });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP

//     // Get default role (e.g., "User")
//     const defaultRole = await Role.findOne({ role_name: "user" });
//     if (!defaultRole) {
//       return res
//         .status(500)
//         .json({ message: "Default role not found in database" });
//     }
//     console.log(defaultRole, "default r");

//     // Create new user
//     const user = new User({
//       username,
//       email,
//       phone_number,
//       password: hashedPassword,
//       email_otp: otp,
//       role_id: defaultRole._id,
//     });

//     await user.save();

//     // Send OTP email
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Verify Your Email",
//       text: `Your OTP for email verification is: ${otp}`,
//     });

//     res.status(201).json({
//       message: "User registered. Please verify your email with the OTP sent.",
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
exports.registerUser = async (req, res) => {
  const {
    username,
    email,
    phone_number,
    password,
    confirmPassword,
    referral_code,
  } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Check if email or phone number already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone_number }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or phone number already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();

    // Get default role
    const defaultRole = await Role.findOne({ role_name: "user" });
    if (!defaultRole) {
      return res
        .status(500)
        .json({ message: "Default role not found in database" });
    }

    // Handle referral (optional)
    let referred_by = null;
    if (referral_code) {
      const referrer = await User.findOne({ referral_code });
      if (referrer) {
        referred_by = referrer._id;
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      phone_number,
      password: hashedPassword,
      email_otp: otp,
      role_id: defaultRole._id,
      referred_by,
    });

    await user.save();

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      text: `Your OTP for email verification is: ${otp}`,
    });

    // ⚡ Add initial referral profit to referrer if they exist
    if (referred_by) {
      // Check if referred user already has a subscription
      const subscription = await UserPlanSubscription.findOne({
        user_id: user._id,
        status: "verified",
      }).populate("plan_id");

      if (subscription && subscription.plan_id) {
        const plan = subscription.plan_id;
        const capitalLockin = plan.capital_lockin || 30;
        const totalProfit =
          (subscription.amount * Number(plan.profit_percentage)) / 100;
        const dailyProfit = totalProfit / capitalLockin;

        // 1% referral amount
        const referralProfit = dailyProfit * 0.01;

        // Update referrer wallet
        let referrerWallet = await Wallet.findOne({ user_id: referred_by });
        if (!referrerWallet) {
          referrerWallet = new Wallet({
            user_id: referred_by,
            userPlanCapitalAmount: 0,
            dailyProfitAmount: referralProfit,
            totalWalletPoint: referralProfit,
          });
        } else {
          referrerWallet.dailyProfitAmount += referralProfit;
          referrerWallet.totalWalletPoint += referralProfit;
        }
        await referrerWallet.save();
      }
    }

    res.status(201).json({
      message: "User registered. Please verify your email with the OTP sent.",
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify OTP
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email, email_otp: otp });
    if (!user) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    user.email_verified = true;
    user.email_otp = null; // Clear OTP
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: "role_id",
        select: "role_id role_name",
      })
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.role_id) {
      return res.status(500).json({ message: "Role not found for user" });
    }

    res.status(200).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (error) {
    console.error("getUserInfo - Unexpected error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password, access } = req.body;
  console.log(req.body, "login body");

  if (!email || !password || !access) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).populate({
      path: "role_id",
      select: "role_id role_name",
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.email_verified) {
      const otp = crypto.randomInt(100000, 999999).toString();
      user.email_otp = otp;
      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Verify Your Email",
        text: `Your OTP for email verification is: ${otp}`,
      });

      return res.status(401).json({
        message: "Please verify your email. A new OTP has been sent.",
        email: user.email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const userRole = user.role_id.role_name;
    if (access === "admin" && userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }
    if (access === "user" && userRole !== "user") {
      return res
        .status(403)
        .json({ message: "Unauthorized: User access only" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // HTTPS only
      sameSite: "None", // must be None for cross-origin
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (error) {
    console.error("loginUser - Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.email_otp = otp;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.email_otp = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add populate for role_id and referred_by in getUserById
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({ path: "role_id", select: "role_name" })
      .populate({ path: "referred_by", select: "username" })
      .select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user details (excluding password and email_otp)
    const user = await User.findById(userId)
      .select("-password -email_otp")
      .populate("role_id")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch address
    const address = await Address.findOne({ user_id: userId }).lean();

    // Fetch accounts (INR and USDT)
    const accounts = await Account.find({ user_id: userId }).lean();

    // Separate INR and USDT accounts
    const inrAccount =
      accounts.find((acc) => acc.account_type === "INR") || null;
    const usdtAccount =
      accounts.find((acc) => acc.account_type === "USDT") || null;

    res.status(200).json({
      user,
      address,
      accounts: {
        INR: inrAccount,
        USDT: usdtAccount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAdminInfo = async (req, res) => {
  try {
    // Step 1: Fetch role ObjectId for "admin"
    const adminRole = await Role.findOne({ role_name: 'admin' });
    if (!adminRole) {
      return res.status(404).json({ message: 'Admin role not found' });
    }

    // Step 2: Fetch user where role_id matches adminRole._id
    const adminUser = await User.findOne({ role_id: adminRole._id });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Step 3: Fetch accounts where user_id matches adminUser._id
    const accounts = await Account.find({ user_id: adminUser._id });

    // Step 4: Return combined data
    res.status(200).json({
      admin: adminUser,
      accounts: accounts
    });
  } catch (error) {
    console.error('Error fetching admin info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
