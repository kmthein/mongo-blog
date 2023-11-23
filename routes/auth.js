const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth");

const { body } = require("express-validator");

const User = require("../models/user");

const bcrypt = require("bcrypt");

router.get("/login", authController.renderLoginPage);

router.post(
  "/login",
  body("email").isEmail().withMessage("Please enter a valid email address."),
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must have at least 4 characters."),
  authController.postLoginData
);

router.get("/register", authController.renderRegisterPage);

router.post(
  "/register",
  body("username").custom((value, { req }) => {
    return User.findOne({ username: value }).then((user) => {
      if (user) {
        return Promise.reject("Username is already taken, please use another.");
      }
    });
  }),
  body("email")
    .isEmail()
    .withMessage("Plese enter a valid email address.")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((user) => {
        if (user) {
          return Promise.reject("Email is already existed, try with another.");
        }
      });
    }),
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must have at least 4 characters."),
  authController.postRegisterData
);

router.post("/logout", authController.logout);

router.get("/reset-password", authController.renderResetPage);

router.post(
  "/reset-password",
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((user) => {
        if (!user) {
          return Promise.reject("Email not found.");
        }
      });
    }),
  authController.sendResetLink
);

router.get("/reset-password/:token", authController.renderChangePassword);

router.post(
  "/change-password",
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must have at least 4 characters."),
  body("cpassword").trim().custom((value, { req }) => {
    if(value !== req.body.password) {
        throw new Error("Password must be match.");
    }
    return true;
  }),
  authController.changeNewPassword
);

module.exports = router;
