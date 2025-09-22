// complaintModel.js
const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  complaint_type: {
    type: String,
    required: true,
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
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Complaint', ComplaintSchema);