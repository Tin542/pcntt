"use strict";
const mongoose = require("mongoose");

// define model schema
const Comment = mongoose.Schema(
  {
    productID: { type: String },
    userID: { type: String },
    username: { type: String },
    rate: { type: Number },
    content: { type: String },
    createDate: { type: String },
  },
  { version: false, timestamps: true }
);

// define ID of object
Comment.statics.objectId = function (id) {
  return mongoose.Types.objectId(id);
};

// export models
module.exports = {
  Comment: mongoose.model("comments", Comment),
};
