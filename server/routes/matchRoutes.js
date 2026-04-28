const express = require("express");
const router = express.Router();
const {
  getMatchSuggestions,
  confirmMatch,
  getMatchHistory,
  getMyMatches,
  updateMatchStatus,
} = require("../controllers/matchController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// GET /api/match/suggestions/:recipientRequestId — Admin or Hospital
router.get(
  "/suggestions/:recipientRequestId",
  protect,
  authorizeRoles("admin", "hospital"),
  getMatchSuggestions
);

// POST /api/match/confirm — Admin or Hospital
router.post(
  "/confirm",
  protect,
  authorizeRoles("admin", "hospital"),
  confirmMatch
);

// GET /api/match/history — Admin only
router.get(
  "/history",
  protect,
  authorizeRoles("admin"),
  getMatchHistory
);

// GET /api/match/mymatches — Any authenticated user
router.get("/mymatches", protect, getMyMatches);

// PATCH /api/match/:id/status — Admin or Hospital
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "hospital"),
  updateMatchStatus
);

module.exports = router;
