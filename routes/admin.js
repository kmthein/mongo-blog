const express = require("express");
const path = require("path");
const { body } = require("express-validator");
const router = express.Router();
const postController = require("../controllers/post");
const userController = require("../controllers/user");
const User = require("../models/user");

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

router.get("/profile/:id", userController.getProfile);

router.get("/edit-profile", userController.getEditProfile);

router.post("/edit-profile", [
  body("username")
    .isLength({ min: 4 })
    .withMessage("Username must be at least 4 characters.")
    .isLength({ max: 10 })
    .withMessage("Username must not more than 10 characters."),
    body("email")
    .isEmail()
    .withMessage("Plese enter a valid email address.")
], userController.updateProfile);

router.get("/premium", userController.getPremiumPage);

router.get("/subscription-success", userController.getSuccessPage);

router.get("/premium-details", userController.getPremiumDetails);

router.get("/subscription-fail", userController.getPremiumPage);

module.exports = router;
