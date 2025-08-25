const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

dotenv.config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

// Generate 6 random digits
const generateRandomDigits = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create upload folder with random digits and username
const createUploadFolder = (username, folderPrefix = "complaint") => {
  const sanitizedUsername = username ? username.replace(/\s+/g, "_") : "default";
  const randomDigits = generateRandomDigits();
  const folderName = `${folderPrefix}/${randomDigits}${sanitizedUsername}`;
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
      .toFile(outputPath.replace(/\.\w+$/, ".webp"));
    console.log("Image compressed successfully:", outputPath);
    return outputPath.replace(/\.\w+$/, ".webp");
  } catch (error) {
    console.error("Image compression failed:", error.message);
    throw new Error("Image compression failed: " + error.message);
  }
};

// Process file and return public URL
const processFile = async (buffer, originalname, username, folderPrefix = "complaint") => {
  const { uploadDir, folderName } = createUploadFolder(username, folderPrefix);
  const fileExt = path.extname(originalname).toLowerCase();
  const finalFileName = originalname.replace(/\.\w+$/, ".webp");
  const filePath = path.join(uploadDir, finalFileName);

  await compressImage(buffer, filePath);

  const publicUrl = `${SERVER_URL}/Uploads/${folderName}/${finalFileName}`;
  console.log("File processed:", publicUrl);
  return publicUrl;
};

module.exports = { upload, createUploadFolder, processFile };