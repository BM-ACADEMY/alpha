const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPlanSubscription',
    required: true,
  },
  plan_name: {
    type: String,
    required: true,
  },
  amount_type: {
    type: String,
    enum: ['INR', 'USDT'],
    required: true,
  },
  userPlanCapitalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  dailyProfitAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  totalWalletPoint: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  referral_amount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Wallet', WalletSchema);