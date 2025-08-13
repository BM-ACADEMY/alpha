const mongoose = require("mongoose");

const PercentageSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["basic", "standard", "premium"], // <-- Replace with actual values from percentages_category_enum
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
