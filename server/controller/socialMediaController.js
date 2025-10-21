const SocialMedia = require("../model/Socialmedia");

// 🟢 CREATE - Create or update single platform
exports.createSocialMedia = async (req, res) => {
  try {
    const { whatsapp, instagram, telegram } = req.body;
    
    // Validate that only one field is provided
    const fields = { whatsapp, instagram, telegram };
    const providedFields = Object.keys(fields).filter(key => fields[key] && fields[key].trim());
    
    if (providedFields.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "Please provide exactly one social media platform"
      });
    }

    const platform = providedFields[0];
    const value = fields[platform];

    // Check if platform already exists
    let existing = await SocialMedia.findOne({ [platform]: { $exists: true, $ne: "" } });
    
    if (existing) {
      // Update existing record
      existing[platform] = value;
      await existing.save();
      
      res.status(200).json({
        success: true,
        message: `${platform} updated successfully`,
        data: existing,
      });
    } else {
      // Create new record
      const socialMedia = new SocialMedia({ [platform]: value });
      await socialMedia.save();

      res.status(201).json({
        success: true,
        message: `${platform} created successfully`,
        data: socialMedia,
      });
    }
  } catch (error) {
    console.error('Create social media error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// 🔵 READ - Get all social media entries
exports.getAllSocialMedia = async (req, res) => {
  try {
    const socialMedia = await SocialMedia.find();
    res.status(200).json({
      success: true,
      count: socialMedia.length,
      data: socialMedia,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// 🟣 READ - Get single social media entry by ID
exports.getSocialMediaById = async (req, res) => {
  try {
    const socialMedia = await SocialMedia.findById(req.params.id);
    if (!socialMedia) {
      return res.status(404).json({ message: "Social media entry not found" });
    }
    res.status(200).json({ success: true, data: socialMedia });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// 🟡 UPDATE - Update specific platform
exports.updateSocialMedia = async (req, res) => {
  try {
    const { whatsapp, instagram, telegram } = req.body;
    const fields = { whatsapp, instagram, telegram };
    const providedFields = Object.keys(fields).filter(key => fields[key] !== undefined && fields[key] !== null);
    
    if (providedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided to update"
      });
    }

    const socialMedia = await SocialMedia.findById(req.params.id);
    if (!socialMedia) {
      return res.status(404).json({ message: "Social media entry not found" });
    }

    // Update only provided fields
    providedFields.forEach(field => {
      socialMedia[field] = fields[field];
    });

    await socialMedia.save();

    res.status(200).json({
      success: true,
      message: "Social media updated successfully",
      data: socialMedia,
    });
  } catch (error) {
    console.error('Update social media error:', error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// 🔴 DELETE social media entry
exports.deleteSocialMedia = async (req, res) => {
  try {
    const deleted = await SocialMedia.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Social media entry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Social media entry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};