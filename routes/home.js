const express = require("express");
const homeController = require("../controllers/homeController");
const authController = require("../controllers/authController");
const router = express.Router({});

// router.use(authController.checkLogin);

router.get("/dashboard", homeController.dashboard);

router.get("/list-user", homeController.user);
router.post('/create-user', homeController.createUser);
router.get('/detail-user/:id', homeController.getDetailUser);
router.post('/edit-user', homeController.editUser);
router.post('/delete-user', homeController.deleteUser);
router.post('/restore-user', homeController.restoreUser);
router.post('/reset-password', homeController.resetPassword);

router.get('/list-documentCome', homeController.documentCome);
router.get('/list-documentGo', homeController.documentGo);
router.get('/detail-document/:id', homeController.detailDocument);

module.exports = router;
