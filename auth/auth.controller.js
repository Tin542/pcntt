"use strict";
const jwt = require("jsonwebtoken");
const LocalStorage = require("node-localstorage").LocalStorage;

const User = require("../models/user").User;
const Cart = require("../models/cart").Cart;
const emailService = require("../services/emailService");
const localStorage = new LocalStorage("./localStorage");
const sha256 = require("js-sha256");

function AuthController() {
  const db = (req) => req.app.locals.db.pcntt;
  const pathname = (req) => (req.app.locals.pathname = req.path);
  return {
    login: async (req, res) => {
      try {
        let data = req.body;
        const enCryptedPassword = sha256(data?.password);
        const query = `SELECT id, perid, username, fullname status FROM USERS WHERE username = @Username and password = @Password `;
        const inputs = [
          { name: "Username", value: data.username },
          { name: "Password", value: enCryptedPassword },
        ];
        const result = (await db(req).query(query, inputs)).recordset;
        if (result.length < 1) {
          return res.render("pages/auth/login.ejs", {
            s: 400,
            msg: `Tài khoản hoặc mật khẩu Không đúng`,
          });
        }
        if (!result[0].status) {
          return res.render("pages/auth/login.ejs", {
            s: 400,
            msg: `Tài khoản ${data?.username} đã bị khóa`,
          });
        }
        let session = req.session;

        session.user = {
          id: result[0].id,
          perid: result[0].perid,
          username: result[0].username,
          fullname: result[0].fullname,
        };
        return res.redirect("/home/dashboard");
      } catch (error) {
        console.log("login error: " + error);
      }
    },
    checkLogin: async (req, res, next) => {
      try {
        let session = req.session;
        if (session.user) {
          return next();
        } else {
          return res.redirect("/auth/login");
        }
      } catch (error) {
        Logger.error(`checkLogin - fail: ${error}`);
      }
    },
    logout: async (req, res, next) => {
      try {
        // If the user is loggedin
        if (req.session.user) {
          req.session.user = undefined;
          res.redirect("/auth/login");
        } else {
          // Not logged in
          res.redirect("/auth/login");
        }
      } catch (error) {
        console.log(error);
      }
    },
  };
}

module.exports = new AuthController();
