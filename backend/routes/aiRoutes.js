const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { generateProjectSummary } = require("../controllers/aiController");
const { protect } = require("../middleware/auth");
const { requireProjectAccess } = require("../middleware/projectAccess");

// AI calls cost money + tokens. Reuse the same shape as your auth limiter
// (5 requests / 15 min per IP) so a single user can't rack up a Mistral bill.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many AI requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.use(aiLimiter);

router.post(
  "/projects/:id/summary",
  requireProjectAccess((req) => req.params.id),
  generateProjectSummary
);

module.exports = router;
