"use strict";
const Cart = require("../models/cart").Cart;
const Order = require("../models/order").Order;
const OrderDetail = require("../models/orderDetail").OrderDetail;

function orderController() {
  const SELF = {
    mappingCreateItem: (item, oid, uid) => {
      return {
        productID: item.productID,
        orderID: oid,
        userID: uid,
        productName: item.productName,
        productImg: item.productImg,
        productPrice: item.productPrice,
        quantity: item.quantity,
      };
    },
  };

  return {
    createOrder: async (req, res) => {
      try {
        let createData = req.body;
        let uid = res.locals.user; // get current user id
        // response json
        let method = createData.paymentMethod;
        // additional data
        createData.userID = uid;
        createData.status = "pending";
        createData.isPaid = false;
        // Create order
        let resultOrder = await Order.create(createData);
        let listCart = await Cart.find({ userID: uid });
        // Move cart to orderDetail
        listCart.forEach(async (item) => {
          let orderDetailCreate = SELF.mappingCreateItem(
            item,
            resultOrder._id,
            uid
          );
          // create orderDetail
          await OrderDetail.create(orderDetailCreate);
          await Cart.deleteMany({ userID: uid }); // delete item from cart
        });

        return res.json({
          s: 200,
          method: method,
          msg: "Đặt hàng thành công",
        });
      } catch (error) {
        console.log("error at create order", error);
      }
    },
  };
}

module.exports = new orderController();
