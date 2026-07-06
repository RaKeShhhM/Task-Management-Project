import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: true, // CRITICAL: sends the httpOnly JWT cookie with every request
});

export default api;