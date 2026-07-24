import axios from "axios";

// VITE_API_URL is set in .env (local) or in Render's dashboard (production).
// Falls back to localhost so local development keeps working with no setup.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api`,
  withCredentials: true, // CRITICAL: sends the httpOnly JWT cookie with every request
});

// Requests where a 401 is EXPECTED and already handled by the calling code
// (e.g. AuthContext's initial "am I logged in?" check, or a failed login
// attempt showing its own error message) — don't redirect for these, or
// we'd create a loop / stomp on a more specific error message.
const SILENT_401_PATHS = ["/users/profile", "/users/login", "/users/register"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isSilent = SILENT_401_PATHS.some((path) => url.includes(path));

    // Any OTHER request failing with 401 means the session expired or the
    // cookie was invalidated mid-use — send the user back to login instead
    // of leaving them looking at a confusing "Could not load X" error.
    if (status === 401 && !isSilent) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;