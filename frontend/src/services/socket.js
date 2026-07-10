import { io } from "socket.io-client";

// One shared socket connection for the whole app, created once on import.
// withCredentials matches our axios setup — keeps cookie-based auth consistent,
// though Socket.io itself doesn't require the cookie here since we aren't
// authenticating sockets yet (fine for this project's scope).
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5001", {
  withCredentials: true,
  autoConnect: true,
});

export default socket;