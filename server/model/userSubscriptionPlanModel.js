const mongoose = require('mongoose');

const UserPlanSubscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  profit_percentage: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  planStatus: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Inactive',
  },
  payment_screenshot: {
    type: String,
  },
  purchased_at: {
    type: Date,
    default: Date.now,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  verified_at: {
    type: Date,
  },
  rejected_reason: {
    type: String,
  },
    pointsAdded: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('UserPlanSubscription', UserPlanSubscriptionSchema);