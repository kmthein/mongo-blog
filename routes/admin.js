const express = require("express");
const path = require("path");

const router = express.Router();
const postController = require("../controllers/post")

// /admin/create-post
router.get("/create-post", postController.renderCreatePage);

router.post("/", postController.createPost);

router.get("/edit/:postId", postController.getEditPost);

router.post("/edit-post", postController.editPost);

router.post("/delete-post/:postId", postController.deletePost);

module.exports = router;
