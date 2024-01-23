"use strict";
const mongoose = require("mongoose");

// define model schema
const category = mongoose.Schema(
  {
    name: { type: String },
    addDate: { type: String },
    editDate: { type: String },
  },
  { version: false, timestamps: true }
);

// define ID of object
category.statics.objectId = function (id) {
  return mongoose.Types.objectId(id);
};

// export models
module.exports = {
  category: mongoose.model("category", category),
};
