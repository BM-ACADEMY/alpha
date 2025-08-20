const mongoose = require("mongoose");

const PercentageSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["starter", "advanced", "premium", "elite"], 
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
