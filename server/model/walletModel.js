const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
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
  amount_type: {
    type: [String],
    enum: ['INR', 'USDT'],
   
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Wallet', WalletSchema);