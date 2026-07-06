const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
} = require("../controllers/authController");




const { protect } = require("../middleware/auth");
console.log("logoutUser:", logoutUser);
console.log("protect:", protect);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, getProfile); // protect runs first, THEN getProfile

module.exports = router;