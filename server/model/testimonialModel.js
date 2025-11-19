const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Prevent duplicate reviews from same user
  },
  rating: {
    type: Number,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"],
    required: [true, "Rating is required"],
  },
  comments: {
    type: String,
    trim: true,
  },
  verified_by_admin: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for performance
testimonialSchema.index({ user_id: 1 });

module.exports = mongoose.model("Testimonial", testimonialSchema);