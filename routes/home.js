const express = require("express");
const homeController = require("../controllers/homeController");
const authController = require("../controllers/authController");
const authMiddleware = require("../auth/auth.middleware");
const router = express.Router({});

const isAdmin = authMiddleware.isAdmin;
const isLogin = authMiddleware.isLogin;

//Dashboard
router.get("/dashboard", isLogin, homeController.dashboard);
//User
router.get("/list-user", isLogin, homeController.user);
router.post("/list-user", isLogin, homeController.user); // search / filter
router.post("/create-user", isAdmin, homeController.createUser);
router.get("/detail-user/:id", isAdmin, homeController.getDetailUser);
router.post("/edit-user", isAdmin, homeController.editUser);
router.post("/delete-user", isAdmin, homeController.deleteUser);
router.post("/restore-user", isAdmin, homeController.restoreUser);
router.post("/reset-password", isAdmin, homeController.resetPassword);
//Document
router.get("/list-documentCome", isLogin, homeController.documentCome);
router.get("/list-documentGo", isLogin, homeController.documentGo);
router.post("/list-documentCome", isLogin, homeController.documentCome); // search / filer
router.post("/list-documentGo", isLogin, homeController.documentGo); // search / filer
router.get("/detail-document/:id", isLogin, homeController.detailDocument);
router.post("/create-documentCome", isLogin, homeController.createDocumentCome);
router.post("/create-documentGo", isLogin, homeController.createDocumentGo);
router.post("/edit-documentCome", isLogin, homeController.editDocumentCome);
router.post("/edit-documentGo", isLogin, homeController.editDocumentGo);
router.delete("/delete-document/:id", isLogin, homeController.deleteDocument);
router.get(
  "/detail-document-edit/:id",
  isLogin,
  homeController.getDetailDocumentForUpdate
);

module.exports = router;
