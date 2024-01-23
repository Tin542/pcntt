"use strict";
const xlsx = require("xlsx");
const fs = require("fs");
const moment = require("moment");
const ObjectID = require("mongodb").ObjectId;
const Chart = require("chart.js/auto");

const Product = require("../models/product").Product;
const Promotion = require("../models/promotion").Promotion;
const User = require("../models/user").User;
const Staff = require("../models/staff").Staff;
const Category = require("../models/category").category;
const Order = require("../models/order").Order;
const OrderDetail = require("../models/orderDetail").OrderDetail;

function AdminController() {
  // chua global var
  const SELF = {
    SIZE: 10,
    ORDER_STATUS: {
      PENDING: "pending", // đang xử lý
      APPROVED: "approved", // đã xác nhận
      REJECTED: "rejected", // đã hủy
      DELIVERING: "delivering", // đang giao hàng
      SUCCESS: "success", // đã hoàn thành
    },
    mapStaffToExportData: (staff) => {
      return {
        fullname: staff.fullname,
        username: staff.username,
        phone: staff.phone,
        email: staff.email,
        active: staff.active,
      };
    },
    formatDateToString: (date) => {
      return moment(date).format("DD/MM/YYYY, h:mm:ss a");
    },
    getAllCategories: () => {
      return Category.find()
        .then()
        .catch((error) => {
          console.error(error);
        });
    },
    // Dashboard
    getRevenueInMonth: async (month, year) => {
      // let totalPriceInDay = 0;
      let totalDayinMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth(); // get total date in 1 month

      let startDateOfMonth = `${year}-${month}-01`;
      let endDateOfMonth = `${year}-${month}-${totalDayinMonth}`;

      let listOrderInDay = await Order.find({
        createdAt: {
          $gte: new Date(`${startDateOfMonth}T00:00:00`),
          $lte: new Date(`${endDateOfMonth}T23:59:59`),
        },
        isPaid: true,
        status: SELF.ORDER_STATUS.SUCCESS,
      });
      const totalPriceInMonth = listOrderInDay.reduce(
        (accumulator, currentValue) => accumulator + currentValue.totalPrice,
        0
      );
      return totalPriceInMonth.toFixed(2);
    },
    getPopularProduct: async () => {
      try {
        let listOrder = await Order.find({
          status: SELF.ORDER_STATUS.SUCCESS,
          isPaid: true,
        });
        let listOid = listOrder.map((obj) => obj._id.toString());
        const data = await OrderDetail.aggregate([
          {
            $match: {
              orderID: {
                $in: listOid,
              },
            },
          },
          {
            $group: {
              _id: "$productID",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]);
        return data.slice(0, 10); // lấy 10 pid đầu tiên
      } catch (error) {
        console.log("error: " + error);
      }
    },
    getPopularCategories: async () => {
      try {
        let listCateId = []; // list category id
        let arrResult = []; // list result
        let listOrder = await Order.find({
          status: SELF.ORDER_STATUS.SUCCESS,
          isPaid: true,
        });
        let listTmp = [];
        for (let i = 0; i < listOrder.length; i++) {
          let orderDetails = await OrderDetail.find({
            orderID: new ObjectID(listOrder[i]._id),
          });
          if (orderDetails.length > 0) {
            listTmp = listTmp.concat(orderDetails);
          }
        }
        // lấy list category id dựa trên productID trong orderDetail
        for (let i = 0; i < listTmp.length; i++) {
          let pDetail = await Product.findById(listTmp[i].productID);
          listCateId.push(pDetail.categoryId);
        }
        // đếm số lần category xuất hiện
        for (let i = 0; i < listCateId.length; i++) {
          let idx = arrResult.findIndex((el) => el.cid === listCateId[i]);
          if (idx > -1) {
            arrResult[idx]["count"] += 1;
          } else {
            arrResult.push({
              cid: listCateId[i],
              count: 1,
            });
          }
        }
        arrResult.sort((a, b) => b.count - a.count); // sort list theo thứ tự giảm dần count
        return arrResult.slice(0, 3); // lấy 3 cid đầu tiên
      } catch (error) {
        console.log("error: " + error);
      }
    },
  };
  return {
    // Product
    getList: async (req, res) => {
      try {
        let page = req.query.page;
        let keySearch = req.query.pName || "";
        let rateStar = req.query.star || "";
        let categorySearch = req.query.category || "";
        let filter = {};
        if (keySearch) {
          filter["name"] = new RegExp(keySearch, "i");
        }
        // filter by category
        if (categorySearch) {
          filter["categoryId"] = categorySearch;
        }
        // filter by rate
        if (rateStar) {
          filter["rate"] = parseInt(rateStar);
        }
        if (!page || parseInt(page) <= 0) {
          page = 1;
        }
        let skip = (parseInt(page) - 1) * SELF.SIZE;
        //get all categories
        let category = await SELF.getAllCategories();
        // pagination
        Promise.all([
          // 2 hàm bên trong sẽ thực thi đồng thời ==> giảm thời gian thực thi ==> improve performance
          Product.countDocuments(filter).lean(), // Lấy tổng số product
          Product.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip) // số trang bỏ qua ==> skip = (số trang hiện tại - 1) * số item ở mỗi trang
            .limit(SELF.SIZE)
            .lean(), // số item ở mỗi trang
        ])
          .then(async (rs) => {
            // rs trả ra 1 array [kết quả của function 1, kết quả của function 2, ..]
            let productCount = rs[0]; // tổng số product
            let pageCount = 0; // tổng số trang
            if (productCount % SELF.SIZE !== 0) {
              // nếu tổng số product chia SIZE có dư
              pageCount = Math.floor(productCount / SELF.SIZE) + 1; // làm tròn số xuống cận dưới rồi + 1
            } else {
              pageCount = productCount / SELF.SIZE; // nếu ko dư thì chia bth
            }
            for (let i = 0; i < rs[1].length; i++) {
              let catInfo = await Category.findById(rs[1][i].categoryId).lean();
              rs[1][i]["catName"] = catInfo.name;
            }
       
            res.render("pages/admin/adminPage", {
              products: rs[1],
              listCategories: category,
              pages: pageCount, // tổng số trang
              currentPage: parseInt(page),
              filters: {
                name: keySearch,
                category: categorySearch,
                star: rateStar,
              },
              promotion: null,
              category: null,
              users: null,
              urlUploaded: null,
              staffs: null,
              orders: null,
              dashboard: null,
              orderDetail: null,
            });
          })
          .catch((error) => {
            console.log("error: " + error);
          });
      } catch (error) {
        console.log(error);
      }
    },
    addProduct: (req, res) => {
      try {
        let data = req.body;
        data.rate = 0;
        return Product.create(data)
          .then((rs) => {
            return res.redirect("list");
          })
          .catch((err) => {
            res.send({ s: 400, msg: err });
          });
      } catch (error) {
        console.log(error);
      }
    },
    getProductDetail: async (req, res) => {
      try {
        let productId = req.params?.id;
        let result = await Product.findById(productId);
        if (!result) {
          return res.json({ s: 404, msg: "Product not found" });
        }
        return res.json({ s: 200, data: result });
      } catch (error) {
        console.log("Get Detail error: " + error);
      }
    },
    editProduct: async (req, res) => {
      try {
        let editData = req.body;
        let detailProduct = await Product.findById(editData._id);
        if (!detailProduct) {
          res.json({ s: 404, msg: "Product not found" });
        }
        delete editData._id; // xoa field id trong editData
        return Product.findByIdAndUpdate(detailProduct._id, editData)
          .then((rs) => {
            if (rs) {
              res.redirect("/admin/products/list");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log("edit product error: ", error);
      }
    },
    deleteProduct: async (req, res) => {
      try {
        const pId = req.params?.id;
        const product = await Product.findById(pId);
        if (!product) {
          return res.json({ s: 404, msg: "Product not found" });
        }
        Product.deleteOne({ _id: pId })
          .then((rs) => {
            return res.json({ s: 200, msg: "Delete product success!!" });
          })
          .catch((e) => {
            console.log(`deleteProduct - fail: ${e}`);
            return rs.json({ s: 400, msg: "deleteProduct fail" });
          });
      } catch (error) {
        console.log(error);
      }
    },
    // Category
    categories: async (req, res) => {
      try {
        let page = req.query.page;
        let keySearch = req.query.searchValue || "";
        if (!page || parseInt(page) <= 0) {
          page = 1;
        }
        let skip = (parseInt(page) - 1) * SELF.SIZE;
        let regex = new RegExp(keySearch);
        // pagination
        let categoryCount = await Category
          .find({ name: regex })
          .countDocuments(); // lấy tổng số pategory hiện có
        let pageCount = 0; // tổng số trang
        if (categoryCount % SELF.SIZE !== 0) {
          // nếu tổng số category chia SIZE có dư
          pageCount = Math.floor(categoryCount / SELF.SIZE) + 1; // làm tròn số xuống cận dưới rồi + 1
        } else {
          pageCount = categoryCount / SELF.SIZE; // nếu ko dư thì chia bth
        }
        return Category
          .find({ name: regex }).sort({updatedAt: -1})
          .skip(skip) // số item bỏ qua ==> skip = (số trang hiện tại - 1) * số item ở mỗi trang
          .limit(SELF.SIZE) // số item ở mỗi trang
          .then((rs) => {
            res.render("pages/admin/adminPage", {
              category: rs,
              pages: pageCount,
              promotion: null,
              staffs: null,
              users: null,
              urlUploaded: null,
              products: null,
              orders: null,
              dashboard: null,
              orderDetail: null,
              currentPage: parseInt(page),
              name: keySearch,
            });
          })
          .catch((error) => {
            res.send({ s: 400, msg: error });
          });
      } catch (error) {
        console.log(error);
      }
    },
    addcategory: async (req, res) => {
      try {
        let data = req.body;
        data.addDate = SELF.formatDateToString(new Date());
        data.editDate = SELF.formatDateToString(new Date());
        return Category
          .create(data)
          .then((rs) => {
            return res.redirect("list");
          })
          .catch((err) => {
            res.send({ s: 400, msg: err });
          });
      } catch (error) {
        console.log(error);
      }
    },
    getcategorydetail: async (req, res) => {
      try {
        let categoryId = req.params?.id;
        let result = await Category.findById(categoryId);

        if (!result) {
          return res.json({ s: 404, msg: "Category not found" });
        }
        return res.json({ s: 200, data: result });
      } catch (error) {
        console.log("Get Detail error: " + error);
      }
    },
    editcategory: async (req, res) => {
      try {
        let editData = req.body;
        let detailcategory = await Category.findById(editData._id);
        if (!detailcategory) {
          res.json({ s: 404, msg: "category not found" });
        }
        delete editData._id; // xoa field id trong editData
        editData.editDate = SELF.formatDateToString(new Date());
        return Category
          .findByIdAndUpdate(detailcategory._id, editData)
          .then((rs) => {
            if (rs) {
              res.redirect("/admin/category/list");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log("edit category error: ", error);
      }
    },
    deletecategory: async (req, res) => {
      try {
        const pId = req.params?.id;
      
        const categoryDetail = await Category.findById(pId);
        if (!categoryDetail) {
          return res.json({ s: 404, msg: "category not found" });
        }
        Category
          .deleteOne({ _id: pId })
          .then((rs) => {
            return res.json({ s: 200, msg: "Delete category success!!" });
          })
          .catch((e) => {
            console.log(`deletecategory - fail: ${e}`);
            return rs.json({ s: 400, msg: "deletecategory fail" });
          });
      } catch (error) {
        console.log(error);
      }
    },
    // Promotion
    getPromotionList: async (req, res) => {
      try {
        let page = req.query.page;
        let code = req.query.code || "";
        let name = req.query.name || "";
        let status = req.query.status || "";
        let currentDate = new Date();

        let filter = {};
        if (code) {
          filter["code"] = new RegExp(code, "i");
        }
        if (name) {
          filter["name"] = new RegExp(name, "i");
        }
        if (status) {
          if (status === "coming") {
            // status sắp diễn ra => startDate > currentDate
            filter["startDate"] = { $gt: currentDate };
          } else if (status === "out") {
            // status hết hạn => endDate < currentDate
            filter["endDate"] = { $lt: currentDate };
          } else if (status === "active") {
            // status đang hoạt động => startDate < currentDate < endDate
            filter["startDate"] = { $lte: currentDate };
            filter["endDate"] = { $gte: currentDate };
          }
        }
        if (!page || parseInt(page) <= 0) {
          page = 1;
        }
        let skip = (parseInt(page) - 1) * SELF.SIZE;
        // pagination
        let promotionCount = await Promotion.find(filter).countDocuments(); // lấy tổng số promotion hiện có
        let pageCount = 0; // tổng số trang
        if (promotionCount % SELF.SIZE !== 0) {
          // nếu tổng số promotion chia SIZE có dư
          pageCount = Math.floor(promotionCount / SELF.SIZE) + 1; // làm tròn số xuống cận dưới rồi + 1
        } else {
          pageCount = promotionCount / SELF.SIZE; // nếu ko dư thì chia bth
        }
        return Promotion.find(filter)
          .skip(skip) // số trang bỏ qua ==> skip = (số trang hiện tại - 1) * số item ở mỗi trang
          .limit(SELF.SIZE) // số item ở mỗi trang
          .then((rs) => {
            for (let i = 0; i < rs.length; i++) {
              rs[i]["start_date"] = SELF.formatDateToString(rs[i].startDate);
              rs[i]["end_date"] = SELF.formatDateToString(rs[i].endDate);
              // Check status theo ngày
              if (currentDate < rs[i].startDate) {
                rs[i]["status"] = "coming"; // Sắp diện ra
              } else if (currentDate > rs[i].endDate) {
                rs[i]["status"] = "out"; // hết hạn
              } else {
                rs[i]["status"] = "active"; // đang hoạt động
              }
            }
            res.render("pages/admin/adminPage", {
              promotion: rs,
              products: null,
              category: null,
              pages: pageCount, // tổng số trang
              users: null,
              urlUploaded: null,
              staffs: null,
              orders: null,
              dashboard: null,
              orderDetail: null,
              currentPage: parseInt(page),
              filters: {
                code: code,
                name: name,
                status: status,
              },
            });
          })
          .catch((error) => {
            res.send({ s: 400, msg: error });
          });
      } catch (error) {
        console.log(error);
      }
    },
    addPromotion: async (req, res) => {
      try {
        let data = req.body;
        let checkPromotionExist = await Promotion.findOne({
          code: data.code,
        }).lean();
        if (checkPromotionExist) {
          return res.send({ s: 400, msg: "Mã giảm giá đã tồn tại" });
        }
        return Promotion.create(data)
          .then((rs) => {
            return res.redirect("list");
          })
          .catch((err) => {
            res.send({ s: 400, msg: err });
          });
      } catch (error) {
        console.log(error);
      }
    },
    getPromotionDetail: async (req, res) => {
      try {
        let promotionId = req.params?.id;
        let result = await Promotion.findById(promotionId);
        if (!result) {
          return res.json({ s: 404, msg: "Promotion not found" });
        }
        return res.json({ s: 200, data: result });
      } catch (error) {
        console.log("Get Detail error: " + error);
      }
    },
    editPromotion: async (req, res) => {
      try {
        let editData = req.body;
        console.log("editData: ", editData);
        let detailPromotion = await Promotion.findById(editData._id);
        if (!detailPromotion) {
          res.json({ s: 404, msg: "Promotion not found" });
        }
        delete editData._id; // xoa field id trong editData
        return Promotion.findByIdAndUpdate(detailPromotion._id, editData)
          .then((rs) => {
            if (rs) {
              res.redirect("/admin/promotion/list");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log("edit promotion error: ", error);
      }
    },
    deletePromotion: async (req, res) => {
      try {
        const pId = req.params?.id;
        const promotion = await Promotion.findById(pId);
        if (!promotion) {
          return res.json({ s: 404, msg: "Promotion not found" });
        }
        Promotion.deleteOne({ _id: pId })
          .then((rs) => {
            return res.json({ s: 200, msg: "Delete promotion success!!" });
          })
          .catch((e) => {
            console.log(`deletePromotion - fail: ${e}`);
            return rs.json({ s: 400, msg: "deletePromotion fail" });
          });
      } catch (error) {
        console.log(error);
      }
    },
    // user
    users: async (req, res) => {
      try {
        let page = req.query.page;
        let email = req.query.email || "";
        let username = req.query.username || "";
        let status = req.query.status || "";
        if (!page || parseInt(page) <= 0) {
          page = 1;
        }
        let skip = (parseInt(page) - 1) * SELF.SIZE;

        let filter = {};
        if (email) {
          filter["email"] = new RegExp(email, "i");
        }
        if (username) {
          filter["username"] = new RegExp(username, "i");
        }
        if (status) {
          filter["active"] = /^true$/i.test(status);
        }
        filter["role"] = "customer";

        // pagination
        Promise.all([
          // 2 hàm bên trong sẽ thực thi đồng thời ==> giảm thời gian thực thi ==> improve performance
          User.countDocuments(filter).lean(), // Lấy tổng số product
          User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip) // số trang bỏ qua ==> skip = (số trang hiện tại - 1) * số item ở mỗi trang
            .limit(SELF.SIZE)
            .lean(), // số item ở mỗi trang
        ])
          .then(async (rs) => {
            // rs trả ra 1 array [kết quả của function 1, kết quả của function 2, ..]
            let productCount = rs[0]; // tổng số product
            let pageCount = 0; // tổng số trang
            if (productCount % SELF.SIZE !== 0) {
              // nếu tổng số product chia SIZE có dư
              pageCount = Math.floor(productCount / SELF.SIZE) + 1; // làm tròn số xuống cận dưới rồi + 1
            } else {
              pageCount = productCount / SELF.SIZE; // nếu ko dư thì chia bth
            }

            for (let i = 0; i < rs[1].length; i++) {
              let total = await Order.find({ userID: rs[1][i]._id }).lean();
              if (total) {
                rs[1][i]["orders"] = total.length;
              }
            }
            res.render("pages/admin/adminPage", {
              products: null,
              promotion: null,
              category: null,
              pages: pageCount, // tổng số trang
              users: rs[1],
              urlUploaded: null,
              staffs: null,
              orders: null,
              dashboard: null,
              orderDetail: null,
              currentPage: parseInt(page),
              filters: {
                email: email,
                username: username,
                status: status,
              },
            });
          })
          .catch((error) => {
            res.send({ s: 400, msg: error });
          });
      } catch (error) {
        console.log(error);
      }
    },
    activeUser: async (req, res) => {
      try {
        let uid = req.body.uid;
        return User.findByIdAndUpdate(uid, { active: true })
          .then((rs) => {
            if (rs) {
              res.redirect("/admin/user/list");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log(error);
      }
    },
    blockUser: async (req, res) => {
      try {
        let uid = req.body.uid;
        return User.findByIdAndUpdate(uid, { active: false })
          .then((rs) => {
            if (rs) {
              res.redirect("/admin/user/list");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log(error);
      }
    },
    // Staff
    staffs: async (req, res) => {
      try {
        let page = req.query.page;
        let keySearch = req.query.searchValue || "";
        if (!page || parseInt(page) <= 0) {
          page = 1;
        }
        let skip = (parseInt(page) - 1) * SELF.SIZE;
        let regex = new RegExp(keySearch);

        // pagination
        let userCount = await Staff.find({
          $or: [{ fullname: regex }, { username: regex }],
        }).countDocuments(); // lấy tổng số product hiện có
        let pageCount = 0; // tổng số trang
        if (userCount % SELF.SIZE !== 0) {
          // nếu tổng số product chia SIZE có dư
          pageCount = Math.floor(userCount / SELF.SIZE) + 1; // làm tròn số xuống cận dưới rồi + 1
        } else {
          pageCount = userCount / SELF.SIZE; // nếu ko dư thì chia bth
        }

        return Staff.find({ $or: [{ fullname: regex }, { username: regex }] })
          .skip(skip) // số item bỏ qua ==> skip = (số trang hiện tại - 1) * số item ở mỗi trang
          .limit(SELF.SIZE) // số item ở mỗi trang
          .then((rs) => {
            res.render("pages/admin/adminPage", {
              products: null,
              category: null,
              pages: pageCount, // tổng số trang
              users: null,
              urlUploaded: null,
              staffs: rs,
              promotion: null,
              orders: null,
              dashboard: null,
              orderDetail: null,
              currentPage: parseInt(page),
            });
          })
          .catch((error) => {
            res.send({ s: 400, msg: error });
          });
      } catch (error) {
        console.log(error);
      }
    },
    addStaff: async (req, res) => {
      const file = req.files;
      if (!file) {
        return res.json({ s: 400, msg: "No files" });
      }

      //Lưu file vào thư mục tạm
      const excelFile = file.file;
      excelFile.mv(__dirname + "/uploads/" + excelFile.name, (err) => {
        if (err) {
          return res.json({ s: 400, msg: err });
        }
        //__dirname: C://Desktop//work//Neshctech/NESHTECH-EC/services
        const workbook = xlsx.readFile(
          __dirname + "/uploads/" + excelFile.name
        );
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 2 });

        data.forEach(async (item, index) => {
          let result = await Staff.create(item);
          if (!result) {
            return res.json({ s: 400, msg: result });
          }
        });
        return res.redirect("list");
      });
    },
    exportStaff: async (req, res) => {
      try {
        await Staff.find()
          .then(async (rs) => {
            let staffArray = [];
            if (rs.length > 0) {
              await rs.forEach(async (item, index) => {
                staffArray.push(SELF.mapStaffToExportData(item));
              });
            }

            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(staffArray);
            xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet 1");

            // Tạo file Excel tạm thời
            const tempFilePath = "temp.xlsx";
            xlsx.writeFile(workbook, tempFilePath);

            // Gửi file Excel về cho người dùng tải xuống
            res.download(tempFilePath, "data.xlsx", (err) => {
              // Xóa file Excel tạm thời sau khi đã gửi
              fs.unlink(tempFilePath, (err) => {
                if (err) {
                  console.error(err);
                }
              });
            });
          })
          .catch((err) => {
            console.log("error get list at export", err);
          });
      } catch (error) {
        console.log("error at export: ", error);
      }
    },
    // Orders
    orders: async (req, res) => {
      try {
        let page = req.query.page;
        let idSearch = req.query.id || "";
        let statusSearch = req.query.status || "";
        let isPaidSearch = req.query.isPaid || "";
        let filter = {};
        if (idSearch) {
          filter["_id"] = new ObjectID(idSearch);
        }
        if (statusSearch) {
          filter["status"] = statusSearch;
        }
        if (isPaidSearch) {
          filter["isPaid"] = /^true$/i.test(isPaidSearch);
        }
        if (!page || parseInt(page) <= 0) {
          page = 1;
        }
        let skip = (parseInt(page) - 1) * SELF.SIZE;
        // pagination
        Promise.all([
          // 2 hàm bên trong sẽ thực thi đồng thời ==> giảm thời gian thực thi ==> improve performance
          Order.countDocuments(filter).lean(), // Lấy tổng số product
          Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip) // số trang bỏ qua ==> skip = (số trang hiện tại - 1) * số item ở mỗi trang
            .limit(SELF.SIZE)
            .lean(), // số item ở mỗi trang
        ])
          .then(async (rs) => {
            // rs trả ra 1 array [kết quả của function 1, kết quả của function 2, ..]
            let productCount = rs[0]; // tổng số product
            let pageCount = 0; // tổng số trang
            if (productCount % SELF.SIZE !== 0) {
              // nếu tổng số product chia SIZE có dư
              pageCount = Math.floor(productCount / SELF.SIZE) + 1; // làm tròn số xuống cận dưới rồi + 1
            } else {
              pageCount = productCount / SELF.SIZE; // nếu ko dư thì chia bth
            }
            res.render("pages/admin/adminPage", {
              products: null,
              promotion: null,
              category: null,
              pages: pageCount, // tổng số trang
              users: null,
              urlUploaded: null,
              staffs: null,
              orders: rs[1],
              dashboard: null,
              orderDetail: null,
              currentPage: parseInt(page),
              filters: {
                idInput: idSearch || "",
                statusSelectd: statusSearch || "",
                paidSelectd: isPaidSearch || "",
              },
            });
          })
          .catch((error) => {
            res.send({ s: 400, msg: error });
          });
      } catch (error) {
        console.log(error);
      }
    },
    cancelOrder: async (req, res) => {
      try {
        let oid = req.body.orderId;
        let order = await Order.findById(oid);
        if (order) {
          return await Order.findByIdAndUpdate(order._id, {
            status: SELF.ORDER_STATUS.REJECTED,
          })
            .then((rs) => {
              if (rs) {
                return res.json({ s: 200, msg: "Hủy đơn hàng thành công" });
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
      } catch (error) {
        console.log("error", error);
      }
    },
    getDetailOrder: async (req, res) => {
      try {
        let oid = req.params.id;
        let order = await Order.findById(oid);
        if (order) {
          await OrderDetail.find({ orderID: order._id })
            .then((rs) => {
              return res.render("pages/admin/adminPage", {
                products: null,
                promotion: null,
                category: null,
                users: null,
                staffs: null,
                orders: null,
                dashboard: null,
                orderDetail: order,
                listProduct: rs,
              });
            })
            .catch((error) => console.log(error));
        } else {
          return res.json({ s: 404, msg: "Order not found" });
        }
      } catch (error) {
        console.log("error", error);
      }
    },
    updateStatusOrder: async (req, res) => {
      try {
        let oid = req.body.oid;
        let statusOrder = req.body.status;
        let statusPayment = req.body.isPaid;
        let order = await Order.findById(oid);
        if (!order) {
          return res.json({ s: 404, msg: "order not found" });
        }
        return await Order.findByIdAndUpdate(order._id, {
          status: statusOrder,
          isPaid: statusPayment,
        })
          .then(() => {
            res.redirect(`/admin/order/detail/${order._id}`);
          })
          .catch((error) => connsole.log(error));
      } catch (error) {
        console.log("error", error);
      }
    },
    // Dashboard
    dashboard: async (req, res) => {
      let listPid = await SELF.getPopularProduct();
      
      let listProduct = [];
      for (let i = 0; i < listPid.length; i++) {
        let product = await Product.findById(listPid[i]._id);
        listProduct.push({ product: product, count: listPid[i].count });
      }

      let listCid = await SELF.getPopularCategories();
      let listCategories = [];
      for (let i = 0; i < listCid.length; i++) {
        let category = await Category.findById(listCid[i].cid);
        listCategories.push({ category: category, count: listCid[i].count });
      }
      return res.render("pages/admin/adminPage", {
        products: null,
        category: null,
        users: null,
        urlUploaded: null,
        staffs: null,
        promotion: null,
        orders: null,
        dashboard: {
          listProduct: listProduct,
          listCategory: listCategories,
        },
        orderDetail: null,
      });
    },
    getRevernueChart: async (req, res) => {
      let listData = [];
      let currentDate = new Date();
      let year = String(currentDate.getFullYear());
      for (let i = 1; i <= 12; i++) {
        let month = String(i).padStart(2, "0");
        listData.push({
          time: `${i}/${year}`,
          revenue: await SELF.getRevenueInMonth(month, year),
        });
      }
      return res.json({ s: 200, data: listData });
    },
    getAllSummary: async (req, res) => {
      try {
        // Get revenue
        let currentDate = new Date();
        let month = String(currentDate.getMonth() + 1).padStart(2, "0");
        let year = String(currentDate.getFullYear());
        let totalRevernue = await SELF.getRevenueInMonth(month, year);
        // Get total order
        let totalOrder = await Order.find({
          status: SELF.ORDER_STATUS.SUCCESS,
          isPaid: true,
        }).count();
        // Get total User
        let totalUser = await User.find({
          role: "customer",
          active: true,
        }).count();
        // Get total Product
        let totalProduct = await Product.find().count();
        return res.json({
          s: 200,
          data: {
            revenue: totalRevernue,
            order: totalOrder,
            user: totalUser,
            product: totalProduct,
          },
        });
      } catch (error) {
        console.log(error);
      }
    },
  };
}

module.exports = new AdminController();
