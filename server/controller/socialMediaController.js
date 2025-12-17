const SocialMedia = require("../model/Socialmedia");

// 1. Create Social Media (Standard)
exports.createSocialMedia = async (req, res) => {
  try {
    const { whatsapp, instagram, telegram } = req.body;
    
    // Validate that only one standard platform is provided
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
      existing[platform] = value;
      await existing.save();
      
      res.status(200).json({
        success: true,
        message: `${platform} updated successfully`,
        data: existing,
      });
    } else {
      const socialMedia = new SocialMedia({ [platform]: value });
      await socialMedia.save();

      res.status(201).json({
        success: true,
        message: `${platform} created successfully`,
        data: socialMedia,
      });
    }
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 2. Get All
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

// 3. Get By ID
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

// 4. Update Standard Platform
exports.updateSocialMedia = async (req, res) => {
  try {
    const { whatsapp, instagram, telegram } = req.body;
    const fields = { whatsapp, instagram, telegram };
    const providedFields = Object.keys(fields).filter(key => fields[key] !== undefined && fields[key] !== null);
    
    if (providedFields.length === 0) {
      return res.status(400).json({ success: false, message: "No data provided to update" });
    }

    const socialMedia = await SocialMedia.findById(req.params.id);
    if (!socialMedia) {
      return res.status(404).json({ message: "Social media entry not found" });
    }

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
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// 5. Delete Standard Platform
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

// 🟢 6. Add Community
exports.addCommunity = async (req, res) => {
  try {
    const { name, link } = req.body;

    if (!name || !link) {
      return res.status(400).json({ success: false, message: "Name and Link are required" });
    }

    // Find first document or create new one
    let socialMedia = await SocialMedia.findOne();
    if (!socialMedia) {
      socialMedia = new SocialMedia({ communities: [] });
    }

    // Initialize array if it doesn't exist
    if (!socialMedia.communities) {
      socialMedia.communities = [];
    }

    socialMedia.communities.push({ name, link });
    await socialMedia.save();

    res.status(200).json({
      success: true,
      message: "Community added successfully",
      data: socialMedia.communities,
    });
  } catch (error) {
    console.error("Add community error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 🔴 7. Delete Community
exports.deleteCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;

    const result = await SocialMedia.findOneAndUpdate(
      {}, // Match any document
      { $pull: { communities: { _id: communityId } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Social media record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Community deleted successfully",
      data: result.communities,
    });
  } catch (error) {
    console.error("Delete community error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};