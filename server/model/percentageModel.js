const mongoose = require("mongoose");

const PercentageSchema = new mongoose.Schema(
  {
      category: {
    type: String,
    required: true,
    enum: ["basic", "advanced", "premium", "elite"],
    lowercase: true, // 👈 automatically converts to lowercase before saving
  },
    amount_type: {
      type: String,
      required: true,
      enum:["INR","USDT"]
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
