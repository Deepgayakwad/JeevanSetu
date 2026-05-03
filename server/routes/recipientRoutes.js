const express = require("express");
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  getMatchingDonors,
} = require("../controllers/recipientController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// @route POST /api/recipient/request
router.post(
  "/request",
  protect,
  authorizeRoles("recipient"),
  createRequest
);

// @route GET /api/recipient/requests
router.get("/requests", protect, getAllRequests);

// @route GET /api/recipient/myrequests
router.get("/myrequests", protect, authorizeRoles("recipient"), getMyRequests);

// @route GET /api/recipient/matching-donors
router.get("/matching-donors", protect, authorizeRoles("recipient"), getMatchingDonors);

// @route GET /api/recipient/request/:id
router.get("/request/:id", protect, getRequestById);

// @route PUT /api/recipient/request/:id
router.put("/request/:id", protect, updateRequest);

// @route DELETE /api/recipient/request/:id
router.delete("/request/:id", protect, deleteRequest);

module.exports = router;