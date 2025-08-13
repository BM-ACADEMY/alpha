const express = require("express");
const router = express.Router();
const testimonialController = require("../controller/testimonialController");

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

module.exports = router;
