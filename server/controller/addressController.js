const Address = require("../model/addressModel");

// Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find().populate("user_id", "username email");
    res.status(200).json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get address by ID
exports.getAddressById = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id).populate("user_id", "username email");
    if (!address) return res.status(404).json({ message: "Address not found" });
    res.status(200).json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const address = new Address(req.body);
    const savedAddress = await address.save();
    res.status(201).json(savedAddress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update an address
exports.updateAddress = async (req, res) => {
  try {
    const updatedAddress = await Address.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("user_id", "username email");

    if (!updatedAddress)
      return res.status(404).json({ message: "Address not found" });

    res.status(200).json(updatedAddress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const deletedAddress = await Address.findByIdAndDelete(req.params.id);
    if (!deletedAddress)
      return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
