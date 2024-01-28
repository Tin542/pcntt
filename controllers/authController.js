"use strict";
const jwt = require("jsonwebtoken");
const LocalStorage = require("node-localstorage").LocalStorage;

const User = require("../models/user").User;
const Cart = require("../models/cart").Cart;
const emailService = require("../services/emailService");
const localStorage = new LocalStorage("./localStorage");
const sha256 = require('js-sha256');

function AuthController() {
  const db = (req) => req.app.locals.db.pcntt;
  const pathname = (req) => (req.app.locals.pathname = req.path);
  return {
    register: async (req, res) => {
      try {
        let data = req.body; // data register
        // check validate
        if (
          !data?.fullname ||
          !data?.username ||
          !data?.email ||
          !data?.password
        ) {
          return res.render("pages/auth/register.ejs", {
            s: 400,
            msg: "Vui lòng điền đầy đủ thông tin",
          });
        }
        if (data?.password !== data?.rePassword) {
          return res.render("pages/auth/register.ejs", {
            s: 400,
            msg: "Mật khẩu chưa trùng khớp",
          });
        }
        // check if user is already registered
        const userInfo = await User.findOne({
          $or: [{ email: data?.email }, { username: data?.username }], // find user by email or username
        }).lean(); // lean() => tăng hiệu suất truy vấn
        if (userInfo) {
          return res.render("pages/auth/register.ejs", {
            s: 400,
            msg: "Tài khoản hoặc email đã tồn tại",
          });
        }
        // register user
        return SELF.enCodePass(data?.password).then(async (hash) => {
          let otp = await (Math.random() + 1).toString(36).substring(6); // create random OTP
          try {
            const rs = await User.create({
              fullname: data?.fullname,
              username: data?.username,
              password: hash,
              email: data?.email,
              otp: otp,
              role: "customer",
            });
            await localStorage.setItem("email", data?.email);
            return await res.redirect("/auth/verifyEmail");
          } catch (err) {
            console.log("register user error: ", err);
          }
          // await emailService.SendMailSG(otp, data?.email).then(async () => {
           
          // });
        });
      } catch (error) {
        console.log("register error: ", error);
      }
    },
    verify: async (req, res) => {
      try {
        let data = req.body;
        if (!data?.otp) {
          return res.render("pages/auth/verifyEmail.ejs", {
            s: 400,
            msg: "Vui lòng nhập OTP",
          });
        }
        const emailLocalStorage = await localStorage.getItem("email");
        return User.findOne({ otp: data?.otp, email: emailLocalStorage })
          .lean()
          .then(async (userInfo) => {
            if (userInfo) {
              userInfo.active = true;
              userInfo.otp = "";
              await User.updateOne({ _id: userInfo._id }, userInfo);
              res.redirect("/auth/login");
            } else {
              return res.render("pages/auth/verifyEmail.ejs", {
                s: 400,
                msg: "OTP chưa chính xác",
              });
            }
          })
          .catch((e) => {
            Logger.error(`Find one user fail: ${e}`);
          });
      } catch (error) {
        Logger.error(`verify - fail: ${error}`);
      }
    },
    login: async (req, res) => {
      try {
        let data = req.body;
        const enCryptedPassword = sha256(data?.password);
        const query = `SELECT id, perid, status FROM USERS WHERE username = @Username and password = @Password and status = 'True'`;
        const inputs = [
          {name: 'Username', value: data.username},
          {name: 'Password', value: enCryptedPassword}
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
        session.uid = result[0].id;
        session.username = result[0].username;
        session.fullname = result[0].fullname;
        session.perid = result[0].perid;
        return res.redirect("/home/dashboard");
      } catch (error) {
        console.log("login error: " + error);
      }
    },
    sendOTP: async (req, res) => {
      try {
        let data = req.body;
        let otp = (Math.random() + 1).toString(36).substring(6);
        let userInfo = await User.findOne({ email: data?.email.trim() }).lean();
        if (!userInfo) {
          return res.send("pages/auth/verifyEmailForReset.ejs", {
            s: 404,
            msg: `Email ${data?.email} Không tồn tại`,
          });
        }
        await localStorage.setItem("email", data?.email);
        return User.findByIdAndUpdate(userInfo._id, { otp: otp })
          .then(async (rs) => {
            if (rs) {
              res.render("pages/auth/verifyEmailForReset.ejs", {
                isShowed: true,
              });
              // await emailService
              //   .SendMailSG(otp, data?.email)
              //   .then((rs) => {
                 
              //   })
              //   .catch((err) => {
              //     console.log(err);
              //   });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        console.log("error sen otp: " + error);
      }
    },
    verifyEmailForReset: async (req, res) => {
      try {
        let data = req.body;
        if (!data?.otp) {
          return res.render("pages/auth/verifyEmailForReset.ejs", {
            s: 400,
            isShowed: true,
            msg: "Vui lòng nhập OTP",
          });
        }
        const emailLocalStorage = await localStorage.getItem("email");
        return User.findOne({ otp: data?.otp, email: emailLocalStorage })
          .lean()
          .then(async (userInfo) => {
            if (userInfo) {
              userInfo.active = true;
              userInfo.otp = "";
              await User.updateOne({ _id: userInfo._id }, userInfo);
              res.redirect("/auth/reset");
            } else {
              return res.render("pages/auth/verifyEmailForReset.ejs", {
                s: 400,
                isShowed: true,
                msg: "OTP chưa chính xác",
              });
            }
          })
          .catch((e) => {
            Logger.error(`Find one user fail: ${e}`);
          });
      } catch (error) {
        Logger.error(`verify - fail: ${error}`);
      }
    },
    reset: async (req, res) => {
      try {
        let data = req.body; // data reset

        // check validate
        if (data?.password !== data?.rePassword) {
          return res.render("pages/auth/resetPassword.ejs", {
            s: 400,
            msg: "Mật khẩu chưa trùng khớp",
          });
        }

        const emailLocalStorage = await localStorage.getItem("email");
        // check if user is already registered
        const userInfo = await User.findOne({
          email: emailLocalStorage,
        }).lean(); // lean() => tăng hiệu suất truy vấn
        if (!userInfo) {
          return res.render("pages/auth/resetPassword.ejs", {
            s: 400,
            msg: "Người dùng không tồn tại",
          });
        }

        // reset password
        return SELF.enCodePass(data?.password).then(async (hash) => {
          try {
            const rs = await User.findByIdAndUpdate(userInfo._id, {
              password: hash,
            });
            return await res.redirect("/auth/login");
          } catch (err) {
            console.log("reset password error: ", err);
          }
        });
      } catch (error) {
        console.log("reset error: ", error);
      }
    },
    checkLoginAdmin: async (req, res, next) => {
      try {
        let session = req.session;
        if (session.userId) {
          if (session.role === "admin") {
            return next();
          } else {
            return res.redirect("/auth/403");
          }
        } else {
          return res.redirect("/auth/login");
        }
      } catch (error) {
        Logger.error(`checkLogin - fail: ${error}`);
      }
    },
    checkLogin: async (req, res, next) => {
      try {
        let session = req.session;
        if (session.uid) {
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
        if (req.session.uid) {
          req.session.uid = undefined;
          res.redirect("/");
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
