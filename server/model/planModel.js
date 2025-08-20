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
      enum: ["INR", "USDT"],
    },
    min_investment: {
      type: mongoose.Types.Decimal128,
    },
    capital_lockin: {
      type: Number,
    },
    profit_withdrawal: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
    profit_percentage: {
      type: mongoose.Types.Decimal128,
    },
    profit_percentage_day_week_month: {
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