const express = require("express");
const path = require("path");
const { body } = require("express-validator");
const router = express.Router();
const postController = require("../controllers/post");

// /admin/create-post
router.get("/create-post", postController.renderCreatePage);

router.post(
  "/",
  [
    body("title")
      .isLength({ min: 10 })
      .withMessage("Title must be at least 10 characters."),
    body("description")
      .isLength({ min: 30 })
      .withMessage("Description must be at least 30 characters."),
  ],
  postController.createPost
);

router.get("/edit/:postId", postController.getEditPost);

router.post(
  "/edit-post",
  [
    body("title")
      .isLength({ min: 10 })
      .withMessage("Title must be at least 10 characters."),
    body("description")
      .isLength({ min: 30 })
      .withMessage("Description must be at least 30 characters."),
  ],
  postController.editPost
);

router.post("/delete-post/:postId", postController.deletePost);

module.exports = router;
