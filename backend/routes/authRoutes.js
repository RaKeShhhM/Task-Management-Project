const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validators/authValidators");

// Brute-force protection: 5 attempts per 15 minutes on sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Looser limit on registration: 10 accounts per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many registration attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", registerLimiter, registerValidation, validate, registerUser);
router.post("/login", authLimiter, loginValidation, validate, loginUser);
router.post("/forgot-password", authLimiter, forgotPasswordValidation, validate, forgotPassword);
router.put("/reset-password/:token", authLimiter, resetPasswordValidation, validate, resetPassword);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, getProfile); // protect runs first, THEN getProfile

module.exports = router;
