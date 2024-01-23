"use strict";
const mongoose = require("mongoose");

// define model schema
const OrderDetail = mongoose.Schema(
  {
    productID: { type: String},
    orderID: {type: String},
    userID: { type: String },
    productName: {type: String},
    productImg: {type: String},
    productPrice: { type: Number},
    quantity: {type: Number},
  },
  { version: false, timestamps: true }
);

// define ID of object
OrderDetail.statics.objectId = function (id) {
  return mongoose.Types.objectId(id);
};

// export models
module.exports = {
    OrderDetail: mongoose.model("orderDetail", OrderDetail),
};
