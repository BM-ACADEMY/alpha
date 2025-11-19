const express = require("express");
const router = express.Router();
const testimonialController = require("../controller/testimonialController");
const authMiddleware = require("../middleware/authMiddleware"); // Adjust path if needed
// POST /api/testimonials
router.post("/", testimonialController.createTestimonial);

// GET /api/testimonials
router.get("/", testimonialController.getAllTestimonials);

// GET /api/testimonials/:id
router.get("/:id", testimonialController.getTestimonialById);

// PUT /api/testimonials/:id
router.put("/:id", testimonialController.updateTestimonial);

// DELETE /api/testimonials/:id
router.delete("/:id", testimonialController.deleteTestimonial);

// routes/testimonialRoutes.js
router.get("/my-review", testimonialController.getMyReview);

// GET /testimonials/my-review
router.get("/my-reviews", authMiddleware, async (req, res) => {
  const review = await Testimonial.findOne({ user_id: req.user.id })
    .populate("user_id", "name email");
  if (!review) return res.status(404).json({ message: "No review" });
  res.json(review);
});
module.exports = router;