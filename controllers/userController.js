"use strict";
const User = require("../models/user").User;

function userController() {
  const SELF = {};
  return {
    getCurrentUser: (req, res) => {
      res.render("pages/user/profilePage.ejs", {});
    },
  };
}

module.exports = new userController();
