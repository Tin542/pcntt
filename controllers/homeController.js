"use strict";
const moment = require("moment");
const sha256 = require('js-sha256');
require("dotenv").config();

function HomeController() {
  const db = (req) => req.app.locals.db.pcntt;
  const pathname = (req) => (req.app.locals.pathname = req.path);
  return {
    dashboard: async (req, res) => {
      try {
        return res.render("pages/admin/adminPage", {
          users: null,
          documentCome: null,
          totalPage: 1,
          currentPage: 1,
          dashboard: {
            listProduct: [],
            listCategory: [],
          },
          path: pathname(req),
        });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    user: async (req, res) => {
      try {
        let params = req.query;
        let username = params.username ? params.username : "";
        let email = params.email ? params.email : "";
        let phone = params.phone ? params.phone : "";

        let ItemsPerPage = 10;
        let currentPage = params.page ? parseInt(params.page) : 1;

        const query = `SELECT * FROM USERS WHERE username like '%${username}%' and email like '%${email}%' and phonenumber like '%${phone}%' ORDER BY createdate DESC OFFSET ${
          (currentPage - 1) * 5
        } ROWS FETCH NEXT ${ItemsPerPage} ROWS ONLY`;
        const queryForPagination = `SELECT * FROM USERS WHERE username like '%${username}%' and email like '%${email}%' and phonenumber like '%${phone}%' ORDER BY createdate DESC`;

        const result = (await db(req).query(query)).recordset;
        const pagination = (await db(req).query(queryForPagination)).recordset;
        let totalPage =
          pagination.length % ItemsPerPage !== 0
            ? Math.floor(pagination.length / ItemsPerPage) + 1
            : pagination.length / ItemsPerPage;

        db(req).close();

        return res.render("pages/admin/adminPage", {
          users: result,
          documentCome: null,
          totalPage: totalPage,
          currentPage: currentPage,
          filters: {
            email: email,
            username: username,
            phone: phone,
          },
          path: pathname(req),
        });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    createUser: async (req, res) => {
      try {
        let createValue = req.body;
        const enCryptedPassword = sha256(createValue?.password);
        const query = `INSERT INTO USERS (fullname, username, email, phonenumber, password, perid, status, createdate) VALUES (@Fullname, @Username, @Email, @Phonenumber, @Password, @Perid, @Status, @CreateDate)`;
          const inputs = [
            { name: "Fullname", value: createValue.fullname },
            { name: "Username", value: createValue.username },
            { name: "Email", value: createValue.email },
            { name: "Phonenumber", value: createValue.phonenumber },
            { name: "Password", value: enCryptedPassword },
            { name: "Perid", value: 1 },
            { name: "Status", value: true },
            { name: "CreateDate", value: new Date() },
          ];
          const result = (await db(req).query(query, inputs)).rowsAffected;
          if (result) {
            res.redirect("/list-user");
          }
          db(req).close();
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    getDetailUser: async (req, res) => {
      try {
        let uid = req.params.id;
        const query = "SELECT * FROM USERS WHERE id = @Id";
        const inputs = [{ name: "Id", value: parseInt(uid) }];
        const result = (await db(req).query(query, inputs)).recordset;
        if (!result) {
          return res.json({ s: 404, data: "User not found" });
        }
        return res.json({ s: 200, data: result });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    editUser: async (req, res) => {
      try {
        let editData = req.body;
        const query = `UPDATE USERS SET fullname = @Fullname, username = @Username, email = @Email, phonenumber = @phonenumber WHERE id = @Id`;
        const inputs = [
          { name: "Fullname", value: editData.fullnameEdit },
          { name: "Username", value: editData.usernameEdit },
          { name: "Email", value: editData.emailEdit },
          { name: "Phonenumber", value: editData.phonenumberEdit },
          { name: "Id", value: parseInt(editData.idEdit) },
        ];
        const result = (await db(req).query(query, inputs)).rowsAffected;
        if (result) {
          return res.redirect("/list-user");
        }
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    resetPassword: async (req, res) => {
      try {
        let uid = parseInt(req.body.userId);
        const password = sha256(process.env.DEFAULT_PASSWORD);
        const query = `UPDATE USERS SET password = @Password WHERE id = @Id`;
        const inputs = [
          {name: 'Password', value: password},
          {name: 'Id', value: uid}
        ];
        const result = (await db(req).query(query, inputs)).rowsAffected;
        if (result) {
          return res.redirect("/list-user");
        }
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    documentCome: async (req, res) => {
      try {
        let params = req.query;
        let username = params.username ? params.username : "";
        let email = params.email ? params.email : "";
        let phone = params.phone ? params.phone : "";

        let ItemsPerPage = 10;
        let currentPage = params.page ? parseInt(params.page) : 1;

        const query = `SELECT id, so_vb, ngay_tao, ma_dvb, nguoi_lh, dv_phat_hanh, nguoi_nhan, trang_thai FROM VAN_BAN WHERE loai_vb='CVDEN' ORDER BY createdate DESC OFFSET ${
          (currentPage - 1) * 5
        } ROWS FETCH NEXT ${ItemsPerPage} ROWS ONLY`;
        const queryForPagination = `SELECT id, so_vb, ngay_tao, ma_dvb, nguoi_lh, dv_phat_hanh, nguoi_nhan, trang_thai FROM VAN_BAN WHERE loai_vb='CVDEN' ORDER BY createdate DESC`;

        const result = (await db(req).query(query)).recordset;
        const pagination = (await db(req).query(queryForPagination)).recordset;
        let totalPage =
          pagination.length % ItemsPerPage !== 0
            ? Math.floor(pagination.length / ItemsPerPage) + 1
            : pagination.length / ItemsPerPage;

        db(req).close();

        let listDocumentsCome = result.map((item) => {
          item
        })


        return res.render("pages/admin/adminPage", {
          users: null,
          documentCome: listDocumentsCome,
          totalPage: totalPage,
          currentPage: currentPage,
          filters: {
            email: email,
            username: username,
            phone: phone,
          },
          path: pathname(req),
        });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    }
  };
}

module.exports = new HomeController();
