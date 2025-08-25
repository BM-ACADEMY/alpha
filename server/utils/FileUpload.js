const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

dotenv.config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

// Create upload folder with user_id
const createUploadFolder = (user_id, folderPrefix = "complaints") => {
  const folderName = path.join(folderPrefix, user_id); // e.g., complaints/[user_id]
  const uploadDir = path.join(__dirname, "../Uploads", folderName);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return { uploadDir, folderName };
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
    throw new Error("Image compression failed: " + error.message);
  }
};

// Process file and return public URL
const processFile = async (buffer, filename, user_id, username, folderPrefix = "complaints") => {
  const { uploadDir, folderName } = createUploadFolder(user_id, folderPrefix);
  const sanitizedUsername = username ? username.replace(/\s+/g, "_") : "default";
  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  const finalFileName = filename.replace(/\.\w+$/, ".webp"); // Use provided filename, convert to .webp
  const filePath = path.join(uploadDir, finalFileName);

  await compressImage(buffer, filePath);

  const publicUrl = `${SERVER_URL}/Uploads/${folderName}/${finalFileName}`;
  console.log("File processed:", publicUrl);
  return publicUrl;
};

module.exports = { upload, createUploadFolder, processFile };