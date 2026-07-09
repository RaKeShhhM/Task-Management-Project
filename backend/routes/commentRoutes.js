const express = require("express");
const router = express.Router();
const {
  getCommentsForTask,
  createComment,
  deleteComment,
} = require("../controllers/commentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/task/:taskId", getCommentsForTask);
router.post("/", createComment);
router.delete("/:id", deleteComment);

module.exports = router;