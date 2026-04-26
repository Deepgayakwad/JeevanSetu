const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createDonorProfile,
  getMyProfile,
  updateDonorProfile,
  searchDonors,
  getAllDonors,
} = require("../controllers/donorController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// @route POST /api/donor/profile
router.post(
  "/profile",
  protect,
  authorizeRoles("donor"),
  upload.single("medicalReport"),
  createDonorProfile
);

// @route GET /api/donor/profile
router.get("/profile", protect, authorizeRoles("donor"), getMyProfile);

// @route PUT /api/donor/profile
router.put(
  "/profile",
  protect,
  authorizeRoles("donor"),
  upload.single("medicalReport"),
  updateDonorProfile
);

// @route GET /api/donor/search
router.get("/search", protect, searchDonors);

// @route GET /api/donor/all
router.get("/all", protect, authorizeRoles("admin"), getAllDonors);

module.exports = router;