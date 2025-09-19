const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

dotenv.config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

// Create upload folder
const createUploadFolder = (folderPrefix = "complaints") => {
  const uploadDir = path.join(__dirname, "../Uploads", folderPrefix); // e.g., Uploads/payments

  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }
    // Verify write permissions
    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log(`Directory ${uploadDir} is writable`);
    return { uploadDir, folderName: folderPrefix };
  } catch (error) {
    console.error(`Failed to create or access directory ${uploadDir}:`, error.message);
    throw new Error(`Directory creation failed: ${error.message}`);
  }
};

// Multer configuration
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  console.log("File filter:", { mimetype: file.mimetype, originalname: file.originalname });
  // Allow only images
  const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(file.originalname);
  if (!isImage) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
});

// Compress image
const compressImage = async (buffer, outputPath) => {
  try {
    console.log("Compressing image:", outputPath);
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (metadata.width > 2000) {
      await image.resize({ width: 2000 });
    }

    await image
      .toFormat("webp", { quality: 90 })
      .toFile(outputPath);
    console.log("Image compressed successfully:", outputPath);
    return outputPath;
  } catch (error) {
    console.error("Image compression failed:", error.message);
    throw new Error(`Image compression failed: ${error.message}`);
  }
};

// Process file and return public URL
const processFile = async (buffer, filename, user_id, username, folderPrefix = "complaints") => {
  const { uploadDir, folderName } = createUploadFolder(folderPrefix);
  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Ensure proper file extension handling
  const ext = path.extname(filename).toLowerCase();
  const baseName = path.basename(filename, ext);
  const finalFileName = `${baseName}_${randomDigits}.webp`; // Removed sanitizedUsername
  const filePath = path.join(uploadDir, finalFileName);

  try {
    await compressImage(buffer, filePath);
    const publicUrl = `${SERVER_URL}/Uploads/${folderName}/${finalFileName}`;
    console.log("File processed:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Process file error:", error.message);
    throw error;
  }
};

module.exports = { upload, createUploadFolder, processFile };