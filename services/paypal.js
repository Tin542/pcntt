const paypal = require("paypal-rest-sdk");
const Cart = require("../models/cart").Cart;
const User = require("../models/user").User;
const Order = require("../models/order").Order;
const OrderDetail = require("../models/orderDetail").OrderDetail;

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AY7HuuNKIVwTn3U9I9lhib0uFd3z4qkfxvz9SO8r3x_l__pvS5O76BRzj06DL9wBahLGpAnstVETQQxz",
  client_secret:
    "ENUeZbBgfeq8nab0wEdfUTBCzy8HONrGormPtIkzZJZjL6vXYPmGwP9RyM32B3Y0EQvdEr0sbyAUXZRq",
});

function PayPalService() {
  const SELF = {
    totalPrice: 0,
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
    getTotalPrice: (listCart) => {
      let total = 0;
      listCart.forEach((item) => {
        total = total + item.productPrice * item.quantity;
      });
      return total;
    },
  };
  return {
    pay: async (req, res) => {
      let getprice = req.body.totalPrice;
      let uid = res.locals.user; // get current user id;
      let listCart = await Cart.find({ userID: uid }); // Get current user's cart
      let listItem = []; // list items for paypal
      // convert list item in cart to list items for paypal
      if (listCart.length > 0) {
        for (let i = 0; i < listCart.length; i++) {
          listItem.push({
            name: listCart[i].productName,
            sku: "item",
            price: listCart[i].productPrice * listCart[i].quantity,
            currency: "USD",
            quantity: listCart[i].quantity,
          });
        }
        SELF.totalPrice = SELF.getTotalPrice(listCart); // get total price
      }
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:3000/success",
          cancel_url: "http://localhost:3000/cancel",
        },
        transactions: [
          {
            item_list: {
              items: listItem,
            },
            amount: {
              currency: "USD",
              total: SELF.totalPrice.toString(),
            },
            description: "This is the payment description.",
          },
        ],
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          console.log("payment:");
          console.log(payment);
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              console.log("paypal", payment.links[i].href);
              return res.json({ s: 200, link: payment.links[i].href });
            }
          }
        }
      });
    },
    success: (req, res) => {
      const payerId = req.query.PayerID;
      const paymentId = req.query.paymentId;
      const execute_payment_json = {
        payer_id: payerId,
        transactions: [
          {
            amount: {
              currency: "USD",
              total: SELF.totalPrice.toString(),
            },
          },
        ],
      };
      paypal.payment.execute(
        paymentId,
        execute_payment_json,
        async function (error, payment) {
          if (error) {
            console.log(error.response);
            throw error;
          } else {
            // Create order => create order details
            let uid = res.locals.user;
            let user = await User.findById(uid);
            let listCart = await Cart.find({ userID: uid });
            // data for create order
            let orderCreate = {
              userID: uid,
              fullname: user.fullname,
              phone: user.phone,
              address: user.address,
              totalPrice: SELF.totalPrice,
              paymentMethod: "Paypal",
              status: "pending",
              isPaid: true,
            };
            let order = await Order.create(orderCreate); // create order
            listCart.forEach(async (item) => {
              let orderDetailCreate = SELF.mappingCreateItem(
                item,
                order._id,
                uid
              );
              // create orderDetail
              await OrderDetail.create(orderDetailCreate); // create order detail
              await Cart.deleteMany({ userID: uid }); // delete item from cart
            });
            console.log(JSON.stringify(payment));
            res.render("pages/paypal-success.ejs", {});
          }
        }
      );
    },
  };
}

module.exports = new PayPalService();
