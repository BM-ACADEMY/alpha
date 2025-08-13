const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bank_name: {
      type: String,
      maxlength: 100,
    },
    ifsc_code: {
      type: String,
      maxlength: 20,
    },
    account_holder_name: {
      type: String,
      maxlength: 100,
    },
    account_number: {
      type: String,
      maxlength: 30,
    },
    linked_phone_number: {
      type: String,
      maxlength: 15,
    },
    upi_id: {
      type: String,
      maxlength: 100,
    },
    upi_number: {
      type: String,
      maxlength: 15,
    },
    qrcode: {
      type: String, // storing base64 or URL
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

module.exports = mongoose.model("Account", AccountSchema);
