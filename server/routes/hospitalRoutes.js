const express = require("express");
const router = express.Router();
const {
  verifyDonor,
  rejectDonor,
  getHospitalDashboard,
  updateTransplantStatus,
  getUnverifiedDonors,
  getAllHospitals,
} = require("../controllers/hospitalController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const hospitalOrAdmin = authorizeRoles("hospital", "admin");

// GET  /api/hospital/list         — List all hospitals (for donors)
router.get("/list", protect, getAllHospitals);

// GET  /api/hospital/dashboard    — Dashboard stats
router.get("/dashboard", protect, hospitalOrAdmin, getHospitalDashboard);

// GET  /api/hospital/unverified   — All unverified donor profiles
router.get("/unverified", protect, hospitalOrAdmin, getUnverifiedDonors);

// PATCH /api/hospital/verify/:donorProfileId — Verify a donor
router.patch("/verify/:donorProfileId", protect, hospitalOrAdmin, verifyDonor);

// PATCH /api/hospital/reject/:donorProfileId — Reject a donor
router.patch("/reject/:donorProfileId", protect, hospitalOrAdmin, rejectDonor);

// PATCH /api/hospital/transplant/:matchId — Update transplant status
router.patch("/transplant/:matchId", protect, hospitalOrAdmin, updateTransplantStatus);

module.exports = router;
