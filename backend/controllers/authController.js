const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// Helper: creates a JWT and sets it as an httpOnly cookie on the response
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.cookie("token", token, {
    httpOnly: true, // JS on the client can't access this cookie — blocks XSS token theft
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    // "none" is required when frontend/backend live on different domains (e.g. two
    // separate Render services) — the browser won't send "strict"/"lax" cookies
    // cross-site at all. "none" requires secure:true, which we already set above.
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  });

  return token;
};

// @route   POST /api/users/register
// @access  Public
// Field-level checks (name/email format/password length) are already handled
// by registerValidation + validate middleware before this ever runs.
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, "User already exists");
  }

  // Password gets hashed automatically by the pre-save hook in User.js
  const user = await User.create({ name, email, password });

  generateTokenAndSetCookie(res, user._id);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
  });
});

// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select password since schema has select:false on it
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  generateTokenAndSetCookie(res, user._id);

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
  });
});

// @route   GET /api/users/profile
// @access  Private (needs valid token — protect middleware runs first)
const getProfile = asyncHandler(async (req, res) => {
  // req.user was attached by the `protect` middleware
  res.status(200).json(req.user);
});

// @route   POST /api/users/logout
// @access  Private
const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { registerUser, loginUser, getProfile, logoutUser };