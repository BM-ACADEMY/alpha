const express = require("express");
const router = express.Router();
const {
  createSocialMedia,
  getAllSocialMedia,
  getSocialMediaById,
  updateSocialMedia,
  deleteSocialMedia,
} = require("../controller/socialMediaController");

router.post("/", createSocialMedia);

router.get("/", getAllSocialMedia);

router.get("/:id", getSocialMediaById);

router.put("/:id", updateSocialMedia);

router.delete("/:id", deleteSocialMedia);

module.exports = router;
