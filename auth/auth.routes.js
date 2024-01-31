const express = require("express");
const authController = require("./auth.controller");
const router = express.Router({});
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

router.get("/403", (req, res) => {
  res.render("pages/403Page.ejs");
});

// Controllers Routes
router.post("/login", authController.login);
router.get('/logout', authController.logout);

module.exports = router;
