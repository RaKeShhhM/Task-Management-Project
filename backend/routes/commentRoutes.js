const express = require("express");
const router = express.Router();
const {
  getCommentsForTask,
  createComment,
  deleteComment,
} = require("../controllers/commentController");
const { protect } = require("../middleware/auth");
const {
  requireTaskProjectAccess,
  requireCommentProjectAccess,
} = require("../middleware/projectAccess");
const validate = require("../middleware/validate");
const { createCommentValidation } = require("../validators/commentValidators");

router.use(protect);

router.get("/task/:taskId", requireTaskProjectAccess((req) => req.params.taskId), getCommentsForTask);
router.post("/", createCommentValidation, validate, requireTaskProjectAccess((req) => req.body.taskId), createComment);
router.delete("/:id", requireCommentProjectAccess((req) => req.params.id), deleteComment);

module.exports = router;
