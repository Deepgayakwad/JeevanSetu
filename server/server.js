const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Attach io to app so controllers can access it via req.app.get("io")
app.set("io", io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/donor",         require("./routes/donorRoutes"));
app.use("/api/recipient",     require("./routes/recipientRoutes"));
app.use("/api/match",         require("./routes/matchRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chat",          require("./routes/chatRoutes"));
app.use("/api/hospital",      require("./routes/hospitalRoutes"));
app.use("/api/admin",         require("./routes/adminRoutes"));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "JeevanSetu API is running! 💙",
    version: "2.0.0",
    routes: [
      "/api/auth",
      "/api/donor",
      "/api/recipient",
      "/api/match",
      "/api/notifications",
      "/api/chat",
      "/api/hospital",
      "/api/admin",
    ],
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ── Socket.io events ──────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // User joins their personal room (for notifications)
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  // User joins a chat room
  socket.on("chat:join", (room) => {
    socket.join(room);
    console.log(`💬 Socket ${socket.id} joined chat room: ${room}`);
  });

  // Typing indicator
  socket.on("chat:typing", ({ room, userName }) => {
    socket.to(room).emit("chat:typing", { userName });
  });

  // Stop typing indicator
  socket.on("chat:stopTyping", ({ room }) => {
    socket.to(room).emit("chat:stopTyping");
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 JeevanSetu server running on port ${PORT}`);
});