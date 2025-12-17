const express = require("express");
const router = express.Router();
const {
  createSocialMedia,
  getAllSocialMedia,
  getSocialMediaById,
  updateSocialMedia,
  deleteSocialMedia,
  addCommunity,
  deleteCommunity
} = require("../controller/socialMediaController");

// Standard Routes
router.post("/", createSocialMedia);
router.get("/", getAllSocialMedia);
router.get("/:id", getSocialMediaById);
router.put("/:id", updateSocialMedia);
router.delete("/:id", deleteSocialMedia);

// 🟢 Community Routes
router.post("/community", addCommunity);
router.delete("/community/:communityId", deleteCommunity);

module.exports = router;