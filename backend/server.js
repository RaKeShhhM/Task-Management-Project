const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json()); // parse JSON request bodies
app.use(cookieParser()); // parse cookies (needed to read our JWT cookie)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Vite default port
    credentials: true, // allow cookies to be sent cross-origin
  })
);

// Routes
app.use("/api/users", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

// Simple health check route
app.get("/", (req, res) => {
  res.send("Task Manager API is running...");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});