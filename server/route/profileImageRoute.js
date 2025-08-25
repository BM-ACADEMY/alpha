const express = require('express');
const router = express.Router();
const { upload } = require("../utils/profileUpload"); // Ensure this path points to the correct file
const {
  uploadProfileImage,
  uploadPanImage,
  uploadAadharImage,
  uploadQrcodeImage,
  updateProfileImage,
  updatePanImage,
  updateAadharImage,
  updateQrcodeImage,
  deleteImage,
  getImage
} = require("../controller/profileImageController"); // Ensure this path points to the correct controller

const authMiddleware = require("../middleware/authMiddleware");

// Upload routes
router.post("/upload-profile-image", upload.single("profile_image"), uploadProfileImage);
router.post("/upload-pan-image", upload.single("pan_image"), uploadPanImage);
router.post("/upload-aadhar-image", upload.single("aadhar_image"), uploadAadharImage);
router.post("/upload-qrcode-image", upload.single("qrcode"), uploadQrcodeImage);

// Update routes
router.put("/update-profile-image", upload.single("profile_image"), updateProfileImage);
router.put("/update-pan-image", upload.single("pan_image"), updatePanImage);
router.put("/update-aadhar-image", upload.single("aadhar_image"), updateAadharImage);
router.put("/update-qrcode-image", upload.single("qrcode"), updateQrcodeImage);

// Delete route
router.delete("/delete-image", deleteImage);

// Get image route
router.get("/get-image/:entity_type/:user_id/:filename", authMiddleware, getImage);

module.exports = router;