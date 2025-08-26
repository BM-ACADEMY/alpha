
const mongoose = require('mongoose');

const RedeemSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  redeem_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  account_type: {
    type: String,
    enum: ['INR', 'USDT'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  email_send: {
    type: Boolean,
    default: false,
  },
  amount_send: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Redeem', RedeemSchema);
