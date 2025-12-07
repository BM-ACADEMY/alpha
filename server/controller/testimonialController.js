const mongoose = require("mongoose");
const Testimonial = require("../model/testimonialModel");

// Validate rating: must be 0.5 to 5.0 in 0.5 increments
const validateRating = (rating) => {
  return (
    typeof rating === "number" &&
    rating >= 0.5 &&
    rating <= 5 &&
    Math.abs((rating * 10) % 5) < 0.01 // Ensures it's a multiple of 0.5
  );
};

// CREATE - User submits a testimonial (pending approval)
exports.createTestimonial = async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    if (!validateRating(rating)) {
      return res.status(400).json({
        message: "Rating must be between 0.5 and 5.0 in 0.5 increments",
      });
    }

    const existing = await Testimonial.findOne({ user_id });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted a review" });
    }

    const testimonial = new Testimonial({
      user_id,
      rating,
      comments: comments?.trim() || null,
      verified_by_admin: null, // Pending by default
    });

    await testimonial.save();
    await testimonial.populate("user_id", "name email");

    res.status(201).json({
      message: "Review submitted successfully! Awaiting admin approval.",
      testimonial,
    });
  } catch (error) {
    console.error("Create Testimonial Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET MY REVIEW
exports.getMyReview = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const testimonial = await Testimonial.findOne({ user_id }).populate(
      "user_id",
      "name email"
    );

    if (!testimonial) {
      return res.status(404).json({ message: "No review found" });
    }

    res.json(testimonial);
  } catch (error) {
    console.error("Get My Review Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE OWN REVIEW (only before approval or if rejected)
exports.updateTestimonial = async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const user_id = req.user?.id;
    const testimonialId = req.params.id;

    if (!user_id) return res.status(401).json({ message: "Unauthorized" });
    if (!mongoose.Types.ObjectId.isValid(testimonialId)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    if (rating !== undefined && !validateRating(rating)) {
      return res.status(400).json({
        message: "Rating must be between 0.5 and 5.0 in 0.5 steps",
      });
    }

    const updateData = {
      ...(rating !== undefined && { rating }),
      ...(comments !== undefined && { comments: comments?.trim() || null }),
      updated_at: Date.now(),
    };

    const testimonial = await Testimonial.findOneAndUpdate(
      { _id: testimonialId, user_id },
      updateData,
      { new: true, runValidators: true }
    ).populate("user_id", "name email");

    if (!testimonial) {
      return res.status(404).json({ message: "Review not found or not yours" });
    }

    res.json({ message: "Review updated successfully", testimonial });
  } catch (error) {
    console.error("Update Testimonial Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE OWN REVIEW
exports.deleteTestimonial = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const testimonialId = req.params.id;

    if (!user_id) return res.status(401).json({ message: "Unauthorized" });
    if (!mongoose.Types.ObjectId.isValid(testimonialId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const testimonial = await Testimonial.findOneAndDelete({
      _id: testimonialId,
      user_id,
    });

    if (!testimonial) {
      return res.status(404).json({ message: "Review not found or not yours" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete Testimonial Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUBLIC: Get only APPROVED testimonials
// exports.getApprovedTestimonials = async (req, res) => {
//   try {
//     const testimonials = await Testimonial.find({
//       verified_by_admin: true,
//     })
//       .populate("user_id", "name email")
//       .sort({ created_at: -1 });

//     res.json(testimonials);
//   } catch (error) {
//     console.error("Error fetching approved testimonials:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// In testimonialController.js → getApprovedTestimonials
exports.getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      verified_by_admin: true,
    })
      .populate({
        path: "user_id",
        select: "username profile_image", // Changed to username
      })
      .sort({ created_at: -1 });

    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching approved testimonials:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: Get ALL testimonials (including pending/rejected)
exports.getAllTestimonialsAdmin = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const testimonials = await Testimonial.find({})
      .populate("user_id", "name email")
      .sort({ created_at: -1 });

    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching all testimonials:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: Get only PENDING testimonials
exports.getPendingTestimonials = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const testimonials = await Testimonial.find({
      verified_by_admin: null,
    })
      .populate("user_id", "name email")
      .sort({ created_at: -1 });

    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching pending testimonials:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: Approve or Reject a testimonial
exports.updateTestimonialStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    const { id } = req.params;
    const { verified_by_admin } = req.body;

    if (typeof verified_by_admin !== "boolean") {
      return res.status(400).json({
        message: "verified_by_admin must be true (approve) or false (reject)",
      });
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      {
        verified_by_admin,
        updated_at: Date.now(),
      },
      { new: true, runValidators: true }
    ).populate("user_id", "name email");

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.json({
      message: `Testimonial ${verified_by_admin ? "approved" : "rejected"} successfully`,
      testimonial,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
