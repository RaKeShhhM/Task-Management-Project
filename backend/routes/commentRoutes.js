const express = require("express");
const router = express.Router();
const {
  getCommentsForTask,
  createComment,
  deleteComment,
} = require("../controllers/commentController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createCommentValidation } = require("../validators/commentValidators");

router.use(protect);

router.get("/task/:taskId", getCommentsForTask);
router.post("/", createCommentValidation, validate, createComment);
router.delete("/:id", deleteComment);

module.exports = router;