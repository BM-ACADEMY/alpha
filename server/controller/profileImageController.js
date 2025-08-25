const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { createEntityFolder, processFile } = require('../utils/profileUpload');

// 📌 Upload Profile Image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { entity_type, user_id } = req.body;

    if (!entity_type || !user_id) {
      return res.status(400).json({ message: 'Missing entity type or user ID' });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      user_id,
      fileName
    );

    res.status(200).json({
      success: true,
      error: false,
      message: 'Profile image uploaded successfully',
      fileUrl,
    });
  } catch (error) {
    console.error('Profile Image Upload Error:', error);
    res.status(500).json({
      error: true,
      success: false,
      message: error.message,
    });
  }
};

// 📌 Upload PAN Image
const uploadPanImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { entity_type, user_id } = req.body;

    if (!entity_type || !user_id) {
      return res.status(400).json({ message: 'Missing entity type or user ID' });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      user_id,
      fileName
    );

    res.status(200).json({
      success: true,
      error: false,
      message: 'PAN image uploaded successfully',
      fileUrl,
    });
  } catch (error) {
    console.error('PAN Image Upload Error:', error);
    res.status(500).json({
      error: true,
      success: false,
      message: error.message,
    });
  }
};

// 📌 Upload Aadhar Image
const uploadAadharImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { entity_type, user_id } = req.body;

    if (!entity_type || !user_id) {
      return res.status(400).json({ message: 'Missing entity type or user ID' });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      user_id,
      fileName
    );

    res.status(200).json({
      success: true,
      error: false,
      message: 'Aadhar image uploaded successfully',
      fileUrl,
    });
  } catch (error) {
    console.error('Aadhar Image Upload Error:', error);
    res.status(500).json({
      error: true,
      success: false,
      message: error.message,
    });
  }
};

// 📌 Upload QR Code Image
const uploadQrcodeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { entity_type, user_id } = req.body;

    if (!entity_type || !user_id) {
      return res.status(400).json({ message: 'Missing entity type or user ID' });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      user_id,
      fileName
    );

    res.status(200).json({
      success: true,
      error: false,
      message: 'QR code image uploaded successfully',
      fileUrl,
    });
  } catch (error) {
    console.error('QR Code Image Upload Error:', error);
    res.status(500).json({
      error: true,
      success: false,
      message: error.message,
    });
  }
};

// 📌 Update Profile Image
const updateProfileImage = async (req, res) => {
  try {
    const { entity_type, user_id, old_filename } = req.body;

    if (!entity_type || !user_id || !old_filename) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No new file uploaded' });
    }

    const uploadPath = createEntityFolder(entity_type, user_id);
    const oldFilePath = path.join(uploadPath, old_filename);

    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      user_id,
      fileName
    );

    res.status(200).json({
      message: 'Profile image updated successfully',
      fileUrl,
    });
  } catch (error) {
    console.error('Profile Image Update Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 📌 Update PAN Image
const updatePanImage = async (req, res) => {
  try {
    const { entity_type, user_id, old_filename } = req.body;

    if (!entity_type || !user_id || !old_filename) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No new file uploaded' });
    }

    const uploadPath = createEntityFolder(entity_type, user_id);
    const oldFilePath = path.join(uploadPath, old_filename);

    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      user_id,
      fileName
    );

    res.status(200).json({
      message: 'PAN image updated successfully',
      fileUrl,
    });
  } catch (error) {
    console.error('PAN Image Update Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 📌 Update Aadhar Image
const updateAadharImage = async (req, res) => {
  try {
    const { entity_type, user_id, old_filename } = req.body;

    if (!entity_type || !user_id || !old_filename) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No new file uploaded' });
    }

    const uploadPath = createEntityFolder(entity_type, user_id);
    const oldFilePath = path.join(uploadPath, old_filename);

    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      user_id,
      fileName
    );

    res.status(200).json({
      message: 'Aadhar image updated successfully',
      fileUrl,
    });
  } catch (error) {
    console.error('Aadhar Image Update Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 📌 Update QR Code Image
const updateQrcodeImage = async (req, res) => {
  try {
    const { entity_type, user_id, old_filename } = req.body;

    if (!entity_type || !user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // if (!req.file) {
    //   return res.status(400).json({ message: "No new file uploaded" });
    // }

    const uploadPath = createEntityFolder(entity_type, user_id);

    // Only try deleting if old_filename exists
  if (old_filename) {
  const oldFilePath = path.join(uploadPath, old_filename);
  if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
}

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const fileUrl = await processFile(
      req.file.buffer,
      req.file.mimetype,
      entity_type,
      user_id,
      fileName
    );

    res.status(200).json({
      message: "QR code image updated successfully",
      fileUrl,
    });
  } catch (error) {
    console.error("QR Code Image Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📌 Delete Image (Common for all image types)
const deleteImage = (req, res) => {
  try {
    const { entity_type, user_id, filename } = req.body;

    if (!entity_type || !user_id || !filename) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const filePath = path.join(__dirname, '../Uploads', entity_type, user_id, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error('Image Delete Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get Image (Common for all image types)
const getImage = (req, res) => {
  const { entity_type, user_id, filename } = req.params;
  const filePath = path.join(__dirname, '../Uploads', entity_type, user_id, filename);

  console.log('getImage called:', { entity_type, user_id, filename, filePath });

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('Image not found:', filePath);
    return res.status(404).json({ message: 'Image not found' });
  }

  // Verify authentication (assuming authMiddleware sets req.user)
  if (!req.user || req.user.id !== user_id) {
    console.error('Unauthorized access:', { user: req.user, user_id });
    return res.status(403).json({ message: 'Unauthorized' });
  }

  // Get MIME type based on file extension
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

  // Serve the file directly
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).json({ message: 'Error serving file' });
    }
  });
};

module.exports = {
  uploadProfileImage,
  uploadPanImage,
  uploadAadharImage,
  uploadQrcodeImage,
  updateProfileImage,
  updatePanImage,
  updateAadharImage,
  updateQrcodeImage,
  deleteImage,
  getImage,
};