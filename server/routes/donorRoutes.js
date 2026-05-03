const express = require("express");
const router = express.Router();
const {
  createDonorProfile,
  getMyProfile,
  updateDonorProfile,
  searchDonors,
  getAllDonors,
  getDonorCard,
  getDonorCardById,
  deleteDonorProfile,
  requestVerification,
} = require("../controllers/donorController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadDocument } = require("../middleware/uploadMiddleware");

// POST   /api/donor/profile  — Create donor profile (with optional medical report)
router.post(
  "/profile",
  protect,
  authorizeRoles("donor"),
  uploadDocument.single("medicalReport"),
  createDonorProfile
);

// GET    /api/donor/card     — Generate / fetch donor card PDF (must be before /profile)
router.get("/card", protect, authorizeRoles("donor"), getDonorCard);

// GET    /api/donor/:id/card — Get donor card for a specific donor profile ID
router.get("/:id/card", protect, getDonorCardById);

// GET    /api/donor/profile  — Get my profile
router.get("/profile", protect, authorizeRoles("donor"), getMyProfile);

// PUT    /api/donor/profile  — Update my profile
router.put(
  "/profile",
  protect,
  authorizeRoles("donor"),
  uploadDocument.single("medicalReport"),
  updateDonorProfile
);

// DELETE /api/donor/profile  — Delete my profile
router.delete("/profile", protect, authorizeRoles("donor"), deleteDonorProfile);

// PATCH  /api/donor/request-verification/:hospitalId
router.patch("/request-verification/:hospitalId", protect, authorizeRoles("donor"), requestVerification);

// GET    /api/donor/search   — Search donors
router.get("/search", protect, searchDonors);

// GET    /api/donor/all      — All donors (admin only)
router.get("/all", protect, authorizeRoles("admin"), getAllDonors);

module.exports = router;