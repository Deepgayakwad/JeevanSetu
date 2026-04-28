const express = require("express");
const router = express.Router();
const {
  verifyDonor,
  getHospitalDashboard,
  updateTransplantStatus,
  getUnverifiedDonors,
} = require("../controllers/hospitalController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const hospitalOrAdmin = authorizeRoles("hospital", "admin");

// GET  /api/hospital/dashboard    — Dashboard stats
router.get("/dashboard", protect, hospitalOrAdmin, getHospitalDashboard);

// GET  /api/hospital/unverified   — All unverified donor profiles
router.get("/unverified", protect, hospitalOrAdmin, getUnverifiedDonors);

// PATCH /api/hospital/verify/:donorProfileId — Verify a donor
router.patch("/verify/:donorProfileId", protect, hospitalOrAdmin, verifyDonor);

// PATCH /api/hospital/transplant/:matchId — Update transplant status
router.patch("/transplant/:matchId", protect, hospitalOrAdmin, updateTransplantStatus);

module.exports = router;
