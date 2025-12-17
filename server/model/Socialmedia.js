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
  // 🟢 Communities Array
  communities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    link: {
      type: String,
      required: true,
      trim: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SocialMedia", socialMediaSchema);