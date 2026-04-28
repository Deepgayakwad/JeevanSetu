const express = require("express");
const router = express.Router();
const {
  getPlatformStats,
  getAllUsers,
  banUser,
  deleteUser,
  getUserById,
} = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const adminOnly = authorizeRoles("admin");

// GET    /api/admin/stats           — Platform statistics
router.get("/stats", protect, adminOnly, getPlatformStats);

// GET    /api/admin/users           — All users (paginated, filterable)
router.get("/users", protect, adminOnly, getAllUsers);

// GET    /api/admin/user/:userId    — Single user full profile
router.get("/user/:userId", protect, adminOnly, getUserById);

// PATCH  /api/admin/ban/:userId     — Toggle ban
router.patch("/ban/:userId", protect, adminOnly, banUser);

// DELETE /api/admin/user/:userId    — Delete user + cascade
router.delete("/user/:userId", protect, adminOnly, deleteUser);

module.exports = router;
