const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { registerValidation, loginValidation } = require("../validators/authValidators");

router.post("/register", registerValidation, validate, registerUser);
router.post("/login", loginValidation, validate, loginUser);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, getProfile); // protect runs first, THEN getProfile

module.exports = router;