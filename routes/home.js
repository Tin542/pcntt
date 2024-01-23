const express = require("express");
const homeController = require("../controllers/homeController");
const authController = require("../controllers/authController");
const cartController = require("../controllers/cartController");
const orderControlelr = require("../controllers/orderController");
const paypalService = require("../services/paypal");
const router = express.Router({});

router.get("/list-user", homeController.user);
router.post('/create-user', homeController.createUser);
router.get("/dashboard", homeController.dashboard);
router.get('/detail-user/:id', homeController.getDetailUser);
router.post('/edit-user', homeController.editUser);
router.post('/reset-password', homeController.resetPassword);

router.get('/list-documentCome', homeController.documentCome);
module.exports = router;
