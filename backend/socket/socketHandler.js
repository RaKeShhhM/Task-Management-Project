const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/User");
const Project = require("../models/Project");

// This function is called once, from server.js, right after Socket.io is created.
// It sets up authentication middleware and event handlers for every connection.
const initSocket = (io) => {
  // Socket.io middleware — runs before "connection" fires.
  // Reads the httpOnly auth cookie from the handshake headers and verifies the JWT.
  // Unauthenticated sockets are rejected here with an explicit error.
  io.use(async (socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(rawCookies);
      const token = cookies.token;

      if (!token) {
        return next(new Error("Authentication error: no token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Authentication error: user not found"));
      }

      // Attach the user to the socket so we can reference them in event handlers
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.user.email})`);

    // Frontend calls socket.emit("joinProject", projectId) when opening a board.
    // "Rooms" let us broadcast task updates only to people viewing that same project,
    // instead of blasting every event to every connected user.
    // We verify the user is actually a member/owner before letting them join.
    socket.on("joinProject", async (projectId) => {
      try {
        const project = await Project.findById(projectId);
        if (!project) return;

        const userId = socket.user._id.toString();
        const isOwner = project.owner.toString() === userId;
        const isMember = project.members.some((m) => m.user.toString() === userId);

        if (!isOwner && !isMember) {
          // Silently ignore — don't leak project existence to non-members
          return;
        }

        socket.join(projectId);
        console.log(`Socket ${socket.id} joined project room: ${projectId}`);
      } catch (err) {
        console.error("joinProject error:", err.message);
      }
    });

    socket.on("leaveProject", (projectId) => {
      socket.leave(projectId);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;