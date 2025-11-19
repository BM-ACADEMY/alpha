const mongoose = require("mongoose");
const Testimonial = require("../model/testimonialModel");

// CREATE
exports.createTestimonial = async (req, res) => {
  try {
    const { user_id, rating, comments } = req.body;

    // 1. Validate user_id format
    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // 2. Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // 3. Check if user already submitted a review
    const existing = await Testimonial.findOne({ user_id });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted a review" });
    }

    // 4. Optional: Verify user exists
    const User = mongoose.model("User");
    const user = await User.findById(user_id).select("name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newTestimonial = new Testimonial({
      user_id,
      rating,
      comments: comments?.trim(),
    });

    await newTestimonial.save();

    // Populate user info in response
    await newTestimonial.populate("user_id", "name email");

    res.status(201).json({
      message: "Testimonial created successfully",
      testimonial: newTestimonial,
    });
  } catch (error) {
    // Handle specific errors
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    console.error("Create Testimonial Error:", error);
    res.status(500).json({
      message: "Server error while creating testimonial",
      error: error.message,
    });
  }
};

// READ ALL
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .populate("user_id", "name email")
      .sort({ created_at: -1 });

    res.json(testimonials);
  } catch (error) {
    console.error("Get All Testimonials Error:", error);
    res.status(500).json({ message: "Error fetching testimonials", error: error.message });
  }
};

// READ ONE
exports.getTestimonialById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findById(req.params.id).populate(
      "user_id",
      "name email"
    );

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.json(testimonial);
  } catch (error) {
    console.error("Get Testimonial Error:", error);
    res.status(500).json({ message: "Error fetching testimonial", error: error.message });
  }
};

// UPDATE
exports.updateTestimonial = async (req, res) => {
  try {
    const { rating, comments } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { rating, comments: comments?.trim() },
      { new: true, runValidators: true }
    ).populate("user_id", "name email");

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.json({ message: "Testimonial updated", testimonial });
  } catch (error) {
    console.error("Update Testimonial Error:", error);
    res.status(500).json({ message: "Error updating testimonial", error: error.message });
  }
};

// DELETE
exports.deleteTestimonial = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Delete Testimonial Error:", error);
    res.status(500).json({ message: "Error deleting testimonial", error: error.message });
  }
};

// controller/testimonialController.js
exports.getMyReview = async (req, res) => {
  try {
    // Assuming you have auth middleware that sets req.user
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const testimonial = await Testimonial.findOne({ user_id: req.user?.id })
      .populate("user_id", "name email")
      .sort({ created_at: -1 });

    if (!testimonial) {
      return res.status(404).json({ message: "No review found" });
    }

    res.json(testimonial);
  } catch (error) {
    console.error("Get My Review Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

