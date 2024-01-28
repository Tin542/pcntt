"use strict";
const moment = require("moment");
const sha256 = require("js-sha256");
const { elements } = require("chart.js");
require("dotenv").config();

function HomeController() {
  const db = (req) => req.app.locals.db.pcntt;
  const pathname = (req) => (req.app.locals.pathname = req.path);
  moment.locale("vi");

  // Lay tat ca don vi
  const listDepartment = async (req) => {
    const DVQuery = `SELECT ma_dv, ten_dv FROM DON_VI WHERE status = 'True'`;
    return (await db(req).query(DVQuery)).recordset;
  };

  // Lay tat ca dang van ban
  const listDocType = async (req) => {
    const LVBQuery = `SELECT ma_dvb, ten_dvb FROM DANG_VB WHERE status = 'True'`;
    return (await db(req).query(LVBQuery)).recordset;
  };

  // Lay tat ca trang thai
  const listStatus = async (req) => {
    const TTQuery = `SELECT ma_tt, ten_tt FROM TRANG_THAI WHERE status = 'True'`;
    return (await db(req).query(TTQuery)).recordset;
  };

  return {
    dashboard: async (req, res) => {
      try {
        return res.render("pages/admin/adminPage", {
          users: null,
          documentCome: null,
          documentGo: null,
          detailDocument: null,
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
        let params = req.body;
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
          documentGo: null,
          totalPage: totalPage,
          currentPage: currentPage,
          filters: {
            email: email,
            username: username,
            phone: phone,
          },
          detailDocument: null,
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
          res.redirect("/home/list-user");
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
          return res.redirect("/home/list-user");
        }
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    deleteUser: async (req, res) => {
      try {
        let uid = req.body.userId;
        const query = `UPDATE USERS SET status = 'False' WHERE id = @Id`;
        const inputs = [
          { name: "Id", value: parseInt(uid) },
        ];
        const result = (await db(req).query(query, inputs)).rowsAffected;
        if (result) {
          return res.redirect("/home/list-user");
        }
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    restoreUser: async (req, res) => {
      try {
        let uid = req.body.userId;
        const query = `UPDATE USERS SET status = 'True' WHERE id = @Id`;
        const inputs = [
          { name: "Id", value: parseInt(uid) },
        ];
        const result = (await db(req).query(query, inputs)).rowsAffected;
        if (result) {
          return res.redirect("/home/list-user");
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
        const query = `UPDATE USERS SET status = 'True', password = @Password WHERE id = @Id`;
        const inputs = [
          { name: "Password", value: password },
          { name: "Id", value: uid },
        ];
        const result = (await db(req).query(query, inputs)).rowsAffected;
        if (result) {
          return res.redirect("/home/list-user");
        }
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    documentCome: async (req, res) => {
      try {
        let params = req.body;
        let soVb = params.soVb ? params.soVb : "";
        let loaivb = params.loaivb ? params.loaivb : "";
        let donvi = params.donvi ? params.donvi : "";
        let trangthai = params.trangthai ? params.trangthai : "";

        let ItemsPerPage = 10;
        let currentPage = params.page ? parseInt(params.page) : 1;

        let resultDV = await listDepartment(req);
        let resultLVB = await listDocType(req);
        let resultTT = await listStatus(req);

        // lay Tat ca van ban den
        const query = `SELECT id, so_vb, ngay_tao, ma_dvb, nguoi_lh, dv_phat_hanh, nguoi_nhan, trang_thai FROM VAN_BAN WHERE so_vb like '%${soVb}%' and loai_vb='CVDEN' and ma_dvb like '%${loaivb}%' and dv_phat_hanh like '%${donvi}%' and trang_thai like '%${trangthai}%' ORDER BY createdate DESC OFFSET ${
          (currentPage - 1) * 5
        } ROWS FETCH NEXT ${ItemsPerPage} ROWS ONLY`;
        const queryForPagination = `SELECT id, so_vb, ngay_tao, ma_dvb, nguoi_lh, dv_phat_hanh, nguoi_nhan, trang_thai FROM VAN_BAN WHERE so_vb like '%${soVb}%' and loai_vb='CVDEN' and ma_dvb like '%${loaivb}%' and dv_phat_hanh like '%${donvi}%' and trang_thai like '%${trangthai}%' ORDER BY createdate DESC`;
        const result = (await db(req).query(query)).recordset;
        const pagination = (await db(req).query(queryForPagination)).recordset;
        let totalPage =
          pagination.length % ItemsPerPage !== 0
            ? Math.floor(pagination.length / ItemsPerPage) + 1
            : pagination.length / ItemsPerPage;

        result.forEach((e) => {
          e.ngay_tao = moment(e.ngay_tao).format("LL");
          e.donvi = resultDV.find(
            (element) => element.ma_dv === e.dv_phat_hanh
          ).ten_dv;
          e.dangVB = resultLVB.find(
            (element) => element.ma_dvb === e.ma_dvb
          ).ten_dvb;
          e.trang_thai = resultTT.find(
            (element) => element.ma_tt === e.trang_thai
          ).ten_tt;
        });

        db(req).close();

        return res.render("pages/admin/adminPage", {
          users: null,
          documentCome: result,
          documentGo: null,
          totalPage: totalPage,
          currentPage: currentPage,
          listDepartment: resultDV,
          listDocType: resultLVB,
          listStatus: resultTT,
          filters: {
            soVb: soVb,
            loaivb: loaivb,
            donvi: donvi,
            trangthai: trangthai,
          },
          detailDocument: null,
          path: pathname(req),
        });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    detailDocument: async (req, res) => {
      try {
        let did = req.params.id;

        let resultDV = await listDepartment(req);
        let resultLVB = await listDocType(req);
        let resultTT = await listStatus(req);

        const query = "SELECT * FROM VAN_BAN WHERE id = @Id";
        const inputs = [{ name: "Id", value: parseInt(did) }];
        const result = (await db(req).query(query, inputs)).recordset;

        return res.render("pages/admin/adminPage", {
          users: null,
          documentCome: null,
          documentGo: null,
          listDepartment: resultDV,
          listDocType: resultLVB,
          listStatus: resultTT,
          detailDocument: result[0],
          path: pathname(req),
        });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    documentGo: async (req, res) => {
      try {
        let params = req.body;
        let soVb = params.soVb ? params.soVb : "";
        let loaivb = params.loaivb ? params.loaivb : "";
        let donvi = params.donvi ? params.donvi : "";
        let trangthai = params.trangthai ? params.trangthai : "";

        let ItemsPerPage = 10;
        let currentPage = params.page ? parseInt(params.page) : 1;

        let resultDV = await listDepartment(req);
        let resultLVB = await listDocType(req);
        let resultTT = await listStatus(req);

        // lay Tat ca van ban den
        const query = `SELECT id, so_vb, ngay_tao, ma_dvb, nguoi_lh, dv_nhan, nguoi_nhan, trang_thai FROM VAN_BAN WHERE so_vb like '%${soVb}%' and loai_vb='CVDI' and ma_dvb like '%${loaivb}%' and dv_nhan like '%${donvi}%' and trang_thai like '%${trangthai}%' ORDER BY createdate DESC OFFSET ${
          (currentPage - 1) * 5
        } ROWS FETCH NEXT ${ItemsPerPage} ROWS ONLY`;
        const queryForPagination = `SELECT id, so_vb, ngay_tao, ma_dvb, nguoi_lh, dv_nhan, nguoi_nhan, trang_thai FROM VAN_BAN WHERE so_vb like '%${soVb}%' and loai_vb='CVDI' and ma_dvb like '%${loaivb}%' and dv_nhan like '%${donvi}%' and trang_thai like '%${trangthai}%' ORDER BY createdate DESC`;
        const result = (await db(req).query(query)).recordset;
        const pagination = (await db(req).query(queryForPagination)).recordset;
        let totalPage =
          pagination.length % ItemsPerPage !== 0
            ? Math.floor(pagination.length / ItemsPerPage) + 1
            : pagination.length / ItemsPerPage;

        result.forEach((e) => {
          e.ngay_tao = moment(e.ngay_tao).format("LL");
          e.donvi = resultDV.find(
            (element) => element.ma_dv === e.dv_nhan
          ).ten_dv;
          e.dangVB = resultLVB.find(
            (element) => element.ma_dvb === e.ma_dvb
          ).ten_dvb;
          e.trang_thai = resultTT.find(
            (element) => element.ma_tt === e.trang_thai
          ).ten_tt;
        });

        db(req).close();

        return res.render("pages/admin/adminPage", {
          users: null,
          documentCome: null,
          documentGo: result,
          totalPage: totalPage,
          currentPage: currentPage,
          listDepartment: resultDV,
          listDocType: resultLVB,
          listStatus: resultTT,
          filters: {
            soVb: soVb,
            loaivb: loaivb,
            donvi: donvi,
            trangthai: trangthai,
          },
          detailDocument: null,
          path: pathname(req),
        });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
  };
}

module.exports = new HomeController();
