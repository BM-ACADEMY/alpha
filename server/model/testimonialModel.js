// model/testimonialModel.js
const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // One review per user
  },
  rating: {
    type: Number,
    min: [0.5, "Rating must be at least 0.5"],
    max: [5, "Rating cannot exceed 5"],
    required: [true, "Rating is required"],
  },
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, "Comments cannot exceed 1000 characters"],
  },
  verified_by_admin: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update `updated_at` on save
testimonialSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

testimonialSchema.index({ user_id: 1 });

module.exports = mongoose.model("Testimonial", testimonialSchema);