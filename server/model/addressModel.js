const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address_line_1: {
      type: String,
      maxlength: 255,
    },
    address_line_2: {
      type: String,
      maxlength: 255,
    },
    city: {
      type: String,
      maxlength: 100,
    },
    state: {
      type: String,
      maxlength: 100,
    },
    country: {
      type: String,
      maxlength: 100,
    },
    pincode: {
      type: String,
      maxlength: 10,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", AddressSchema);
