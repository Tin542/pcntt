"use strict";
const mongoose = require("mongoose");

// define model schema
const User = mongoose.Schema(
  {
    fullname: { type: String },
    username: { type: String },
    password: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String, unique: true },
    active: { type: Boolean, default: false },
    otp: { type: String },
    token: { type: String },
    role: { type: String },
  },
  { version: false, timestamps: true }
);

// define ID of object
User.statics.objectId = function (id) {
  return mongoose.Types.objectId(id);
};

// export models
module.exports = {
  User: mongoose.model("user", User),
};
