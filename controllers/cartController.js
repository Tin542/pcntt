"use strict";
const Cart = require("../models/cart").Cart;
const Product = require("../models/product").Product;
const User = require("../models/user").User;
const Promotion = require("../models/promotion").Promotion;

function CartController() {
  // chua global var
  const SELF = {
    listItem: [],
    price: 0,
    user: {},
    createCart: async (uid, product) => {
      try {
        return Cart.create({
          productID: product._id,
          userID: uid,
          productName: product.name,
          productImg: product.imageUrl,
          productPrice: product.price,
          quantity: 1,
        })
          .then((rs) => {
            return "Đã thêm vào giỏ hàng";
          })
          .catch((err) => {
            console.log("cart error", err);
          });
      } catch (error) {
        console.log("error creating cart: ", error);
      }
    },
    updateCart: async (cartId, quantity) => {
      try {
        let detailCart = await Cart.findById(cartId);
        if (!detailCart) {
          return console.log("cart not found");
        }
        return Cart.findByIdAndUpdate(cartId, { quantity: quantity })
          .then((rs) => {
            return "Đã cập nhật giỏ hàng";
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log("error updating cart: ", error);
      }
    },
    getTotalPrice: (listCart) => {
      let total = 0;
      listCart.forEach((item) => {
        total = total + item.productPrice * item.quantity;
      });
      return total;
    },
  };
  return {
    checkCart: async (req, res) => {
      try {
        let uid = res.locals.user; // get current user id
        let pid = req.params?.id; // get current product id
        let product = await Product.findById(pid);
        if (!product) {
          return res.json({ s: 404, msg: "Product not found" });
        }

        const result = await Cart.findOne({
          $and: [{ productID: pid }, { userID: uid }],
        }).lean();
        if (!result) {
          let msg = await SELF.createCart(uid, product, res);
          let session = req.session;
          session.cart = parseInt(res.locals.cart) + 1;
          return res.json({ s: 200, msg: msg });
        }
        let quantity = (await result.quantity) + 1;
        let msg = await SELF.updateCart(result._id, quantity, res);
        return res.json({ s: 200, msg: msg });
      } catch (error) {
        console.log("get cart error", error);
      }
    },
    code: async (req, res) => {
      try {
        let c = req.body;

        let discountPer = undefined; // % giảm giá
        let price = undefined; // Thành tiền (số tiền sau khi giảm giá)
        let errorMsg = undefined; // msg lỗi (Mã chưa sử dụng đc - Mã hết hạn - Mã ko hợp lệ)
        let successMsg = undefined;
        let currentDate = new Date(); // ngày hiện tại
        // Lấy Promotion theo mã giảm giá
        let promotion = await Promotion.findOne({
          code: c.code,
          // startDate: { $lte: new Date() },
          // endDate: { $gte: new Date() },
        });
        //

        if (promotion) {
          if (currentDate < promotion.startDate) {
            // Mã chưa sử dụng đc
            errorMsg = "Mã chưa sử dụng được";
          } else if (currentDate > promotion.endDate) {
            // Mã hết hạn
            errorMsg = "Mã hết hạn";
          } else {
            price = (SELF.price * (100 - promotion.GiamGia)) / 100;
            discountPer = promotion.GiamGia;
            successMsg = "Áp dụng mã thành công"
          }
        } else {
          errorMsg = "Mã không hợp lệ";
        }
        return res.render("pages/cart.ejs", {
          cartitems: SELF.listItem,
          totalPrice: SELF.price,
          userInfo: SELF.user,
          discount: discountPer,
          price: price,
          msg: errorMsg,
          successMsg: successMsg,
          code: c.code,
        });
      } catch (error) {
        console.log("code error", error);
      }
    },
    getCurrentCart: async (req, res) => {
      try {
        let uid = res.locals.user; // get current user id;
        let currentUser = await User.findById(uid);
        if (!currentUser) {
          res.json({ s: 404, msg: "User not found" });
        }

        return Cart.find({ userID: uid })
          .then((rs) => {
            if (rs) {
              let totalPrice = SELF.getTotalPrice(rs);
              let session = req.session;
              session.cart = parseInt(rs.length);
              SELF.listItem = rs;
              SELF.price = totalPrice;
              SELF.user = currentUser;
              res.render("pages/cart.ejs", {
                cartitems: rs,
                totalPrice: totalPrice,
                userInfo: currentUser,
                code: ''
              });
            }
          })
          .catch((err) => {
            console.log("getListCart error", err);
          });
      } catch (error) {
        console.log("getListCart error", error);
      }
    },
    addItem: async (req, res) => {
      try {
        let cid = req.params?.id;
        let cartDetail = await Cart.findById(cid);
        if (!cartDetail) return res.json({ s: 404, msg: "Cart not found" });
        let upQuantity = await Number.parseInt(cartDetail.quantity + 1);

        return Cart.findByIdAndUpdate(cartDetail._id, { quantity: upQuantity })
          .then(() => {
            return res.json({ s: 200, msg: "Cập nhật giỏ hàng thành công!!" });
          })
          .catch((error) => {
            console.log(error);
          });
      } catch (error) {
        console.log("addItem error", error);
      }
    },
    removeItem: async (req, res) => {
      try {
        let cid = req.params?.id;
        let cartDetail = await Cart.findById(cid);
        if (!cartDetail) return res.json({ s: 404, msg: "Cart not found" });
        let upQuantity = await Number.parseInt(cartDetail.quantity - 1);

        return Cart.findByIdAndUpdate(cartDetail._id, { quantity: upQuantity })
          .then(() => {
            return res.json({ s: 200, msg: "Cập nhật giỏ hàng thành công!!" });
          })
          .catch((error) => {
            console.log(error);
          });
      } catch (error) {
        console.log("removeItem error", error);
      }
    },
    deleteItem: async (req, res) => {
      try {
        const cid = req.params?.id;
        const detailCart = await Cart.findById(cid);
        if (!detailCart) {
          return res.json({ s: 404, msg: "Cart not found" });
        }
        detailCart
          .deleteOne({ _id: cid })
          .then((rs) => {
            let session = req.session;
            session.cart = parseInt(res.locals.cart) - 1;
            return res.json({ s: 200, msg: "Xóa thành công!!" });
          })
          .catch((e) => {
            console.log(`delete item from cart- fail: ${e}`);
            return rs.json({ s: 400, msg: "delete item from cart-" });
          });
      } catch (error) {
        console.log(error);
      }
    },
    updateUserInfo: async (req, res) => {
      try {
        let uid = res.locals.user; // get current user id;
        let updateInfo = req.body;

        return await User.findByIdAndUpdate(uid, {
          phone: updateInfo.phone,
          address: updateInfo.address,
        })
          .then((rs) => {
            if (rs) {
              console.log("update user info success");
              res.redirect("/cart");
            }
          })
          .catch((err) => {
            console.log("update user info in cart", err);
          });
      } catch (error) {
        console.log("update user info in cart", error);
      }
    },
  };
}

module.exports = new CartController();
