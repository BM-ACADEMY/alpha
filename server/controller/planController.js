const Plan = require("../model/planModel");

// Get all plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.status(200).json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new plan
exports.createPlan = async (req, res) => {
  try {
    const plan = new Plan(req.body);
    const saved = await plan.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a plan
exports.updatePlan = async (req, res) => {
  try {
    const updated = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Plan not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a plan
exports.deletePlan = async (req, res) => {
  try {
    const deleted = await Plan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Plan not found" });
    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};