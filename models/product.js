"use strict";
const mongoose = require("mongoose");

// define model schema
const Product = mongoose.Schema(
  {
    name: { type: String },
    price: { type: Number },
    rate: { type: Number },
    description: { type: String },
    imageUrl: { type: String },
    author: { type: String },
    categoryId: { type: String },
  },
  { version: false, timestamps: true }
);

// define ID of object
Product.statics.objectId = function (id) {
  return mongoose.Types.objectId(id);
};

// export models
module.exports = {
  Product: mongoose.model("product", Product),
};
