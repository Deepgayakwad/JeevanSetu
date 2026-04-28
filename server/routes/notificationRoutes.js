const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// GET    /api/notifications          — get all my notifications
router.get("/", protect, getNotifications);

// PATCH  /api/notifications/readall  — mark ALL as read
router.patch("/readall", protect, markAllRead);

// PATCH  /api/notifications/:id/read — mark ONE as read
router.patch("/:id/read", protect, markAsRead);

// DELETE /api/notifications/:id      — delete a notification
router.delete("/:id", protect, deleteNotification);

module.exports = router;
