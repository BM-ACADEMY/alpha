// complaintModel.js
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
});

const ComplaintSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  complaint_type: {
    type: String,
    required: true,
    enum: ['Billing', 'Deposit', 'Withdrawal', 'Others'],
  },
  description: {
    type: String,
    required: true,
  },
  image_urls: [{
    type: String,
  }],
  is_read: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved', 'Rejected'],
    default: 'Pending',
  },
  replies: [ReplySchema],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Complaint', ComplaintSchema);