const Testimonial = require("../model/testimonialModel");

// Create
exports.createTestimonial = async (req, res) => {
  try {
    const { user_id, rating, comments } = req.body;

    const newTestimonial = new Testimonial({
      user_id,
      rating,
      comments,
    });

    await newTestimonial.save();
    res.status(201).json({ message: "Testimonial created", testimonial: newTestimonial });
  } catch (error) {
    res.status(500).json({ message: "Error creating testimonial", error: error.message });
  }
};

// Read all
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().populate("user_id", "name email");
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: "Error fetching testimonials", error: error.message });
  }
};

// Read one
exports.getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: "Error fetching testimonial", error: error.message });
  }
};

// Update
exports.updateTestimonial = async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { rating, comments },
      { new: true }
    );

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.json({ message: "Testimonial updated", testimonial });
  } catch (error) {
    res.status(500).json({ message: "Error updating testimonial", error: error.message });
  }
};

// Delete
exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    res.json({ message: "Testimonial deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting testimonial", error: error.message });
  }
};
