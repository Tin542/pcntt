const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router({});
const fileService = require("../services/fileService");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

// render UI
router.get("/register", (req, res) => {
  res.render("pages/auth/register.ejs");
});
router.get("/verifyEmail", (req, res) => {
  res.render("pages/auth/verifyEmail.ejs");
});
router.get("/login", (req, res) => {
  res.render("pages/auth/login.ejs");
});
router.get("/reset", (req, res) => {
  res.render("pages/auth/resetPassword.ejs");
});
router.get("/verify-email", (req, res) => {
  res.render("pages/auth/verifyEmailForReset.ejs", { isShowed: false });
});
router.get('/logout', authController.logout);
router.get("/403", (req, res) => {
  res.render("pages/403Page.ejs");
});

// Controllers Routes
router.post("/register", authController.register);
router.post("/verify", authController.verify);
router.post("/login", authController.login);
router.post("/reset", authController.reset);
router.post("/sendOTP", authController.sendOTP);
router.post("/verify-otp", authController.verifyEmailForReset);

module.exports = router;
