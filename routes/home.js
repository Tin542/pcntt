const express = require("express");
const homeController = require("../controllers/homeController");
const authController = require("../auth/auth.controller");
const router = express.Router({});

router.use(authController.checkLogin);
//Dashboard
router.get("/dashboard", homeController.dashboard);
//User
router.get("/list-user", homeController.user);
router.post("/list-user", homeController.user); // search / filter
router.post("/create-user", homeController.createUser);
router.get("/detail-user/:id", homeController.getDetailUser);
router.post("/edit-user", homeController.editUser);
router.post("/delete-user", homeController.deleteUser);
router.post("/reset-password", homeController.resetPassword);
//Document
router.get("/list-documentCome", homeController.documentCome);
router.get("/list-documentGo", homeController.documentGo);
router.post("/list-documentCome", homeController.documentCome); // search / filer
router.post("/list-documentGo", homeController.documentGo); // search / filer
router.get("/detail-document/:id", homeController.detailDocument);
router.post("/create-documentCome", homeController.createDocumentCome);
router.post("/create-documentGo", homeController.createDocumentGo);
router.post("/edit-documentCome", homeController.editDocumentCome);
router.post("/edit-documentGo", homeController.editDocumentGo);
router.delete("/delete-document/:id", homeController.deleteDocument);
router.get(
  "/detail-document-edit/:id",
  homeController.getDetailDocumentForUpdate
);

module.exports = router;
