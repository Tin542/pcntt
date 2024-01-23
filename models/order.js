"use strict";
const mongoose = require("mongoose");

// define model schema
const Order = mongoose.Schema(
  {
    userID: { type: String },
    fullname: { type: String },
    phone: { type: String },
    address: { type: String },
    totalPrice: { type: Number },
    paymentMethod: { type: String },
    status: { type: String },
    isPaid: { type: Boolean },
  },
  { version: false, timestamps: true }
);

// define ID of object
Order.statics.objectId = function (id) {
  return mongoose.Types.objectId(id);
};

// export models
module.exports = {
  Order: mongoose.model("order", Order),
};
