require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Load SERVER_URL from .env
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";
console.log(`Server URL: ${SERVER_URL}`);

// Ensure dynamic folder creation
const createEntityFolder = (entity_type, user_id) => {
  if (!entity_type || !user_id) throw new Error("Missing entity_type or user_id");

  const sanitizedEntityType = String(entity_type).replace(/\s+/g, "_");
  const sanitizedUserId = String(user_id).replace(/\s+/g, "_"); // Convert ObjectId to string

  const uploadDir = path.join(__dirname, "../Uploads", sanitizedEntityType, sanitizedUserId);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  return uploadDir;
};

// Allowed file types
const allowedMimeTypes = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/avi", "video/mov", "video/mkv"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/webm"],
};

// Multer storage configuration
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allTypes = [
    ...allowedMimeTypes.image,
    ...allowedMimeTypes.video,
    ...allowedMimeTypes.audio,
  ];
  if (allTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images, videos, and audio files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // Max 200MB
});

// Compress and Save Image
const compressImage = async (buffer, outputPath) => {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (metadata.width > 2000) {
      await image.resize({ width: 2000 });
    }

    const outputFilePath = outputPath.replace(/\.\w+$/, ".webp");
    await image.toFormat("webp", { quality: 90 }).toFile(outputFilePath);
    return path.basename(outputFilePath); // Return the new filename with .webp
  } catch (error) {
    throw new Error("Image compression failed: " + error.message);
  }
};

// Compress and Save Video
const compressVideo = async (buffer, outputPath) => {
  return new Promise((resolve, reject) => {
    const tempFilePath = path.join(__dirname, "../Uploads/temp_" + Date.now() + ".mp4");
    fs.writeFileSync(tempFilePath, buffer);

    ffmpeg(tempFilePath)
      .videoCodec("libx264")
      .outputOptions(["-preset fast", "-crf 28"])
      .on("end", () => {
        fs.unlinkSync(tempFilePath);
        resolve(path.basename(outputPath));
      })
      .on("error", (err) => {
        fs.unlinkSync(tempFilePath);
        reject(new Error("Video compression failed: " + err.message));
      })
      .save(outputPath.replace(/\.\w+$/, ".mp4"));
  });
};

// Compress and Save Audio
const compressAudio = async (buffer, outputPath) => {
  return new Promise((resolve, reject) => {
    const tempFilePath = path.join(__dirname, "../Uploads/temp_" + Date.now() + ".webm");
    const outputFilePath = outputPath.replace(/\.\w+$/, ".mp3");

    fs.writeFileSync(tempFilePath, buffer);

    ffmpeg(tempFilePath)
      .inputFormat("webm")
      .audioCodec("libmp3lame")
      .audioBitrate("192k")
      .on("end", () => {
        fs.unlinkSync(tempFilePath);
        resolve(path.basename(outputFilePath));
      })
      .on("error", (err) => {
        fs.unlinkSync(tempFilePath);
        reject(new Error("Audio compression failed: " + err.message));
      })
      .save(outputFilePath);
  });
};

// Process File and Return Public URL
const processFile = async (buffer, mimetype, entityType, userId, fileName) => {
  const uploadPath = createEntityFolder(entityType, userId);
  const filePath = path.join(uploadPath, fileName);
  let finalFileName = fileName;

  if (allowedMimeTypes.image.includes(mimetype)) {
    finalFileName = await compressImage(buffer, filePath);
  } else if (allowedMimeTypes.video.includes(mimetype)) {
    finalFileName = await compressVideo(buffer, filePath);
  } else if (allowedMimeTypes.audio.includes(mimetype)) {
    finalFileName = await compressAudio(buffer, filePath);
  } else {
    throw new Error("Unsupported file type");
  }

  // Return the public file URL
  const sanitizedEntityType = entityType.replace(/\s+/g, "_");
  const sanitizedUserId = userId.replace(/\s+/g, "_");
  const publicUrl = `${SERVER_URL}/Uploads/${sanitizedEntityType}/${sanitizedUserId}/${finalFileName}`;
  return publicUrl;
};

module.exports = { upload, createEntityFolder, compressAudio, processFile };