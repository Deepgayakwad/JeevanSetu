const Message = require("../models/Message");

// @route POST /api/chat/send
// @desc  Send a message (saved to DB + emitted via socket)
// @access Protected
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res
        .status(400)
        .json({ message: "receiverId and message are required" });
    }

    const room = Message.getRoomId(req.user._id, receiverId);

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      message,
      room,
    });

    const populated = await newMessage.populate("sender", "name profilePic role");

    // Emit real-time message via Socket.io (io is attached to app in server.js)
    const io = req.app.get("io");
    if (io) {
      io.to(room).emit("chat:message", populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/chat/:userId
// @desc  Get chat history between logged-in user and another user
// @access Protected
const getChatHistory = async (req, res) => {
  try {
    const room = Message.getRoomId(req.user._id, req.params.userId);

    const messages = await Message.find({ room })
      .populate("sender", "name profilePic role")
      .populate("receiver", "name profilePic role")
      .sort({ createdAt: 1 });

    // Mark all messages sent to the logged-in user as read
    await Message.updateMany(
      { room, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/chat/conversations
// @desc  Get all conversations (unique users chatted with)
// @access Protected
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name profilePic role")
      .populate("receiver", "name profilePic role")
      .sort({ createdAt: -1 });

    // Get unique conversation partners
    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const partner =
        msg.sender._id.toString() === userId.toString()
          ? msg.receiver
          : msg.sender;

      const partnerId = partner._id.toString();
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        const unreadCount = await Message.countDocuments({
          room: msg.room,
          receiver: userId,
          isRead: false,
        });
        conversations.push({
          partner,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          room: msg.room,
          unreadCount,
        });
      }
    }

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getChatHistory, getConversations };
