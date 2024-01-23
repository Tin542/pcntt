"use strict";
const mongoose = require("mongoose");

// define model schema
const Staff = mongoose.Schema(
  {
    fullname: { type: String },
    username: { type: String },
    phone: { type: String },
    email: { type: String, unique: true },
    active: { type: Boolean, default: false }
  },
  { version: false, timestamps: true }
);

// define ID of object
Staff.statics.objectId = function (id) {
  return mongoose.Types.objectId(id);
};

// export models
module.exports = {
  Staff: mongoose.model("staff", Staff),
};
