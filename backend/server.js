const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const initSocket = require("./socket/socketHandler");

dotenv.config();
connectDB();

const app = express();

// Socket.io needs a raw http server, not just the Express app —
// Express normally creates one implicitly under app.listen(), but we need
// direct access to attach Socket.io to the SAME server.
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

initSocket(io);

// Make `io` available inside route controllers via req.app.get("io")
app.set("io", io);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Routes
app.use("/api/users", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

app.get("/", (req, res) => {
  res.send("Task Manager API is running...");
});

const PORT = process.env.PORT || 5001;

// IMPORTANT: listen on `server`, not `app`, so Socket.io and Express share the same port
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});