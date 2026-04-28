const Notification = require("../models/Notification");

// @route GET /api/notifications
// @desc  Get all notifications for logged-in user
// @access Protected
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/notifications/:id/read
// @desc  Mark a single notification as read
// @access Protected
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/notifications/readall
// @desc  Mark all notifications as read
// @access Protected
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/notifications/:id
// @desc  Delete a notification
// @access Protected
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: create + emit a notification (used internally by other controllers)
const createAndEmitNotification = async (io, { userId, type, title, message, relatedId }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedId: relatedId || null,
    });

    // Emit real-time notification to user's socket room
    if (io) {
      io.to(userId.toString()).emit("notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  createAndEmitNotification,
};
