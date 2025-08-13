const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    plan_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    amount_type: {
      type: String,
      required: true,
      enum: ["INR", "USDT"], // <-- Replace with actual enum values from `plans_amount_type_enum`
    },
    min_investment: {
      type: mongoose.Types.Decimal128,
    },
    capital_lockin: {
      type: Number, // assuming in days or months (integer)
    },
    profit_withdrawal: {
      type: String,
      enum: ["daily", "weekly", "monthly"], // <-- Replace with actual enum from `plans_profit_withdrawal_enum`
      default: "daily",
    },
    profit_percentage: {
      type: mongoose.Types.Decimal128,
    },
    total_return_percentage: {
      type: mongoose.Types.Decimal128,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
