const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// Use memory storage — we pipe the buffer directly to Cloudinary
const memoryStorage = multer.memoryStorage();

// Helper: upload buffer to Cloudinary and return secure_url
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });
};

// Multer middleware for images (profile pics etc.)
const uploadImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
  },
});

// Multer middleware for documents (PDFs, medical reports)
const uploadDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and image files are allowed"));
  },
});

module.exports = { uploadImage, uploadDocument, uploadToCloudinary };
