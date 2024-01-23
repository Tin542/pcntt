const express = require("express");
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");
const router = express.Router({});
const fileService = require("../services/fileService");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

router.use(authController.checkLoginAdmin);
// product
router.get("/products/list", adminController.getList);
router.post("/products/add", adminController.addProduct);
router.get("/products/detail/:id", adminController.getProductDetail);
router.post("/products/edit", adminController.editProduct);
router.delete("/products/delete/:id", adminController.deleteProduct);
// promotion
router.get("/promotion/list", adminController.getPromotionList);
router.post("/promotion/add", adminController.addPromotion);
router.get("/promotion/detail/:id", adminController.getPromotionDetail);
router.post("/promotion/edit", adminController.editPromotion);
router.delete("/promotion/delete/:id", adminController.deletePromotion);
// user
router.get("/user/list", adminController.users);
router.post("/user/active", adminController.activeUser);
router.post("/user/block", adminController.blockUser);
// staff
router.get("/staffs/list", adminController.staffs);
router.post("/staffs/add", adminController.addStaff);
router.get("/staffs/export", adminController.exportStaff);
// Category
router.get("/category/list", adminController.categories);
router.post("/category/add", adminController.addcategory);
router.get("/category/detail/:id", adminController.getcategorydetail);
router.post("/category/edit", adminController.editcategory);
router.delete("/category/delete/:id", adminController.deletecategory);
// Order
router.get("/order/list", adminController.orders);
router.get("/order/detail/:id", adminController.getDetailOrder);
router.post("/order/cancel", adminController.cancelOrder);
router.post("/order/update-status", adminController.updateStatusOrder);
// Dashboard
router.get("/dashboard", adminController.dashboard);
router.get("/dashboard/chart", adminController.getRevernueChart);
router.get("/dashboard/summary", adminController.getAllSummary);
// upload hinh anh
router.post(
  "/products/upload-image",
  upload.single("file"),
  fileService.uploadFile
);

module.exports = router;
