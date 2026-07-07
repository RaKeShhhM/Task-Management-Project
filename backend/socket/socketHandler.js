// This function is called once, from server.js, right after Socket.io is created.
// It sets up what happens whenever a browser connects/disconnects.
const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Frontend calls socket.emit("joinProject", projectId) when opening a board.
    // "Rooms" let us broadcast task updates only to people viewing that same project,
    // instead of blasting every event to every connected user.
    socket.on("joinProject", (projectId) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined project room: ${projectId}`);
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