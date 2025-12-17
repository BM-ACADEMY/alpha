const mongoose = require("mongoose");

const PercentageSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      // enum: ["basic", "advanced", "premium", "elite"], <--- REMOVE THIS LINE
      lowercase: true, // Keeps data consistent
      trim: true       // Removes accidental spaces
    },
    amount_type: {
      type: String,
      required: true,
      enum: ["INR", "USDT"] // You can keep this if amount types rarely change
    },
    profit_percentage: {
      type: mongoose.Types.Decimal128,
    },
    withdrawal_percentage: {
      type: mongoose.Types.Decimal128,
    },
    platform_percentage: {
      type: mongoose.Types.Decimal128,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Percentage", PercentageSchema);