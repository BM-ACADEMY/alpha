const Percentage = require("../model/percentageModel");

// Get all percentages
exports.getPercentages = async (req, res) => {
  try {
    const percentages = await Percentage.find();
    res.status(200).json(percentages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get percentage by ID
exports.getPercentageById = async (req, res) => {
  try {
    const percentage = await Percentage.findById(req.params.id);
    if (!percentage) return res.status(404).json({ message: "Percentage not found" });
    res.status(200).json(percentage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new percentage
exports.createPercentage = async (req, res) => {
  try {
    const percentage = new Percentage(req.body);
    const saved = await percentage.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a percentage
exports.updatePercentage = async (req, res) => {
  try {
    const updated = await Percentage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Percentage not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a percentage
exports.deletePercentage = async (req, res) => {
  try {
    const deleted = await Percentage.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Percentage not found" });
    res.status(200).json({ message: "Percentage deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
