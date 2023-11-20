const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth");

router.get("/login", authController.renderLoginPage);

router.post("/login", authController.postLoginData);

router.get("/register", authController.renderRegisterPage);

router.post("/register", authController.postRegisterData);

router.post("/logout", authController.logout);

router.get("/reset-password", authController.renderResetPage);

router.post("/reset-password", authController.sendResetLink);

router.get("/reset-password/:token", authController.renderChangePassword);

module.exports = router;
