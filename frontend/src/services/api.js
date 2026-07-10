import axios from "axios";

// VITE_API_URL is set in .env (local) or in Render's dashboard (production).
// Falls back to localhost so local development keeps working with no setup.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api`,
  withCredentials: true, // CRITICAL: sends the httpOnly JWT cookie with every request
});

export default api;