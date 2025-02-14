require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const socketHandler = require("./socketHandler");
const documentRoutes = require("./routes/documentRoutes");
const userRoutes = require("./routes/userRoutes");
const fileRoutes = require("./routes/fileRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app = express();
const server = http.createServer(app);

// ✅ Connect to Database
connectDB();

// ✅ Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow frontend requests
    credentials: true, // ✅ Allow WebSocket credentials
  })
);
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/comments", commentRoutes);

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ API Base Route
app.get("/api", (req, res) => {
  res.status(200).json({ message: "API is ready for feature development!" });
});

// ✅ Initialize Socket.io WebSockets
socketHandler(server);

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// ✅ Graceful Shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("🛑 Process terminated");
  });
});
