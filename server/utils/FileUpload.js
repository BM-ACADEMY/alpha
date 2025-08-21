const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

dotenv.config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";
console.log(`Server URL: ${SERVER_URL}`);

// Create upload folder
const createUploadFolder = (username) => {
  const sanitizedUsername = username ? username.replace(/\s+/g, "_") : "default";
  const uploadDir = path.join(__dirname, "../Uploads", sanitizedUsername);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
};

// Multer configuration
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  console.log("File filter:", { mimetype: file.mimetype, originalname: file.originalname });
  // Allow all file types
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
});

// Compress image if it's an image
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
      .toFile(outputPath.replace(/\.\w+$/, ".webp"));
    console.log("Image compressed successfully:", outputPath);
    return outputPath.replace(/\.\w+$/, ".webp");
  } catch (error) {
    console.error("Image compression failed:", error.message);
    throw new Error("Image compression failed: " + error.message);
  }
};

// Process file and return public URL
const processFile = async (buffer, mimetype, username, fileName) => {
  const uploadPath = createUploadFolder(username);
  const fileExt = path.extname(fileName).toLowerCase();
  const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(fileExt);
  let finalFileName = fileName;

  if (isImage) {
    finalFileName = fileName.replace(/\.\w+$/, ".webp");
  }

  const filePath = path.join(uploadPath, finalFileName);

  if (isImage) {
    await compressImage(buffer, filePath);
  } else {
    // For non-image files, write the buffer directly
    await fs.promises.writeFile(filePath, buffer);
    console.log("Non-image file saved:", filePath);
  }

  const publicUrl = `${SERVER_URL}/Uploads/${username}/${finalFileName}`;
  console.log("File processed:", publicUrl);
  return publicUrl;
};

module.exports = { upload, createUploadFolder, processFile };