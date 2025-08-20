const User = require("../model/usersModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../utils/nodemailer");
const Role = require("../model/rolesModel");

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude passwords
    res.status(200).json(users);
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
exports.registerUser = async (req, res) => {
  const { username, email, phone_number, password, confirmPassword } = req.body;

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
    const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP

    // Get default role (e.g., "User")
    const defaultRole = await Role.findOne({ role_name: "user" });
    if (!defaultRole) {
      return res
        .status(500)
        .json({ message: "Default role not found in database" });
    }
    console.log(defaultRole, "default r");

    // Create new user
    const user = new User({
      username,
      email,
      phone_number,
      password: hashedPassword,
      email_otp: otp,
      role_id: defaultRole._id,
    });

    await user.save();

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      text: `Your OTP for email verification is: ${otp}`,
    });

    res.status(201).json({
      message: "User registered. Please verify your email with the OTP sent.",
    });
  } catch (error) {
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
        path: 'role_id',
        select: 'role_id role_name',
      })
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.role_id) {
      return res.status(500).json({ message: 'Role not found for user' });
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
    console.error('getUserInfo - Unexpected error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.loginUser = async (req, res) => {
  const { email, password, access } = req.body;
  console.log(req.body, 'login body');

  if (!email || !password || !access) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).populate({
      path: 'role_id',
      select: 'role_id role_name',
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.email_verified) {
      const otp = crypto.randomInt(100000, 999999).toString();
      user.email_otp = otp;
      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Verify Your Email',
        text: `Your OTP for email verification is: ${otp}`,
      });

      return res.status(401).json({
        message: 'Please verify your email. A new OTP has been sent.',
        email: user.email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const userRole = user.role_id.role_name;
    if (access === 'admin' && userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    if (access === 'user' && userRole !== 'user') {
      return res.status(403).json({ message: 'Unauthorized: User access only' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (error) {
    console.error('loginUser - Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
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
