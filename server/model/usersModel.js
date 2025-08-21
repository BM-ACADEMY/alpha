const mongoose = require("mongoose");

// Function to generate referral code: 2 letters + 6 digit number = 8 chars
function generateReferralCode(username) {
  const prefix = username.substring(0, 2).toUpperCase();
  const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digit
  return `${prefix}${randomNum}`;
}

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 150,
    },
    phone_number: {
      type: String,
      required: true,
      unique: true,
      maxlength: 15,
    },
    password: {
      type: String,
      required: true,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    email_otp: {
      type: String,
      default: null,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    // New fields
    pan_number: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
    },
    pan_image: {
      type: String, // store URL or file path
      default: null,
    },
    aadhar_number: {
      type: String,
      unique: true,
      sparse: true,
    },
    aadhar_image: {
      type: String, // store URL or file path
      default: null,
    },
    referral_code: {
      type: String,
      unique: true,
      index: true,
    },
    verified_by_admin: {
      type: Boolean,
      default: false,
    },
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // self-reference
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// Pre-save hook to generate referral code if not present
UserSchema.pre("save", async function (next) {
  if (!this.referral_code && this.username) {
    let code;
    let exists = true;

    // Keep generating until unique code found
    while (exists) {
      code = generateReferralCode(this.username);
      const user = await mongoose.models.User.findOne({ referral_code: code });
      if (!user) exists = false;
    }
    this.referral_code = code;
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
