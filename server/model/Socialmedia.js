const mongoose = require("mongoose");

const socialMediaSchema = new mongoose.Schema({
  whatsapp: {
    type: String,
    trim: true,
    default: "",
  },
  instagram: {
    type: String,
    trim: true,
    default: "",
  },
  telegram: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SocialMedia", socialMediaSchema);
