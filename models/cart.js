"use strict";
const mongoose = require("mongoose");

// define model schema
const Cart = mongoose.Schema(
  {
    productID: { type: String},
    userID: { type: String },
    productName: {type: String},
    productImg: {type: String},
    productPrice: { type: Number},
    quantity: {type: Number},
    
  },
  { version: false, timestamps: true }
);

// define ID of object
Cart.statics.objectId = function (id) {
  return mongoose.Types.objectId(id);
};

// export models
module.exports = {
  Cart: mongoose.model("cart", Cart),
};
