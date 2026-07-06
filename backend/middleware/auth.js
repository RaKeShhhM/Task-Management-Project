const jwt = require("jsonwebtoken");
const User = require("../models/User");

// This runs BEFORE any protected route handler.
// It checks for a valid JWT and attaches the logged-in user to req.user
const protect = async (req, res, next) => {
  let token;

  // We'll send the token as an httpOnly cookie (safer than localStorage)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user (minus password) to the request object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next(); // token valid — move on to the actual route handler
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };