const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getChatHistory,
  getConversations,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// GET  /api/chat/conversations — get all conversations
router.get("/conversations", protect, getConversations);

// POST /api/chat/send — send a message
router.post("/send", protect, sendMessage);

// GET  /api/chat/:userId — get chat history with a specific user
router.get("/:userId", protect, getChatHistory);

module.exports = router;
