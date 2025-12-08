const express = require("express");
const router = express.Router();
const {
  createTestimonial,
  getMyReview,
  updateTestimonial,
  deleteTestimonial,
  getApprovedTestimonials,
  getAllTestimonialsAdmin,
  getPendingTestimonials,
  updateTestimonialStatus,
} = require("../controller/testimonialController");
const authMiddleware = require("../middleware/authMiddleware");

// PUBLIC: Only approved testimonials (visible to everyone)
router.get("/", getApprovedTestimonials);

// AUTHENTICATED USER ROUTES
router.post("/", authMiddleware, createTestimonial);
router.get("/my-review", authMiddleware, getMyReview);
router.put("/:id", authMiddleware, updateTestimonial);
router.delete("/:id", authMiddleware, deleteTestimonial);

// ADMIN ROUTES
router.get("/all", authMiddleware, getAllTestimonialsAdmin);           // Admin sees everything
router.get("/pending", authMiddleware, getPendingTestimonials);        // Only pending
router.patch("/:id/status", authMiddleware, updateTestimonialStatus);   // Approve/Reject

module.exports = router;