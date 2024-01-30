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
    const DVQuery = `SELECT id, ma_dv, ten_dv FROM DON_VI WHERE status = 'True' ORDER BY id ASC`;
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

  // Ly tat ca user
  const listUser = async (req) => {
    const UQuery = `SELECT username, fullname FROM USERS WHERE status = 'True'`;
    return (await db(req).query(UQuery)).recordset;
  }

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
    //User
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
    // Document
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
    documentCome: async (req, res) => {
      try {
        let params = req.body;
        let soVb = params.soVbSearch ? params.soVbSearch : "";
        let loaivb = params.loaivbSearch ? params.loaivbSearch : "";
        let donvi = params.donviSearch ? params.donviSearch : "";
        let trangthai = params.trangthaiSearch ? params.trangthaiSearch : "";

        let ItemsPerPage = 10;
        let currentPage = params.page ? parseInt(params.page) : 1;

        let resultDV = await listDepartment(req);
        let resultLVB = await listDocType(req);
        let resultTT = await listStatus(req);
        let resultUser = await listUser(req);

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
          listUser: resultUser,
          filters: {
            soVbSearch: soVb,
            loaivbSearch: loaivb,
            donviSearch: donvi,
            trangthaiSearch: trangthai,
          },
          detailDocument: null,
          path: pathname(req),
        });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    getDetailDocumentForUpdate: async (req, res) => {
      try {
        let did = req.params.id;
        const query = "SELECT * FROM VAN_BAN WHERE id = @Id";
        const inputs = [{ name: "Id", value: parseInt(did) }];
        const result = (await db(req).query(query, inputs)).recordset;
        return res.json({ s: 200, data: result[0] });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    createDocumentCome: async (req, res) => {
      try {
        let createValue = req.body;
        const query = `INSERT INTO VAN_BAN (so_vb, ngay_tao, loai_vb, ma_dvb, noi_dung, dv_phat_hanh, nguoi_lh, dien_thoai, dv_nhan, nguoi_nhan, nguoi_ky_vb, trang_thai, status, ghi_chu, createdate, createby, modifydate, modifyby, file_name)
        VALUES ( @so_vb, @ngay_tao, @loai_vb, @ma_dvb, @noi_dung, @dv_phat_hanh, @nguoi_lh, @dien_thoai, @dv_nhan, @nguoi_nhan, @nguoi_ky_vb, @trang_thai, @status, @ghi_chu, @createdate, @createdby, @modifydate, @modifyby, @file_name)`;
        const inputs = [
          {name: 'so_vb', value: createValue.so_vb},
          {name: 'ngay_tao', value: new Date()},
          {name: 'loai_vb', value: 'CVDEN'},
          {name: 'ma_dvb', value: createValue.ma_dvb},//
          {name: 'noi_dung', value: createValue.noi_dung},
          {name: 'dv_phat_hanh', value: createValue.dv_phat_hanh},//
          {name: 'nguoi_lh', value: createValue.nguoi_lh},
          {name: 'dien_thoai', value: createValue.dien_thoai},
          {name: 'dv_nhan', value: 'DM_BP1501000000043'},// default Phòng Công nghệ Thông tin
          {name: 'nguoi_nhan', value: createValue.nguoi_nhan},//
          {name: 'nguoi_ky_vb', value: createValue.nguoi_ky_vb},
          {name: 'trang_thai', value: createValue.trang_thai},//
          {name: 'status', value: 'True'},
          {name: 'ghi_chu', value: createValue.ghi_chu},
          {name: 'createdate', value: new Date()},
          {name: 'createdby', value: 'nguyenthanhtin@pnt.edu.vn'},
          {name: 'modifydate', value: new Date()},
          {name: 'modifyby', value: 'nguyenthanhtin@pnt.edu.vn'},
          {name: 'file_name', value: 'pdf'},
        ];
        const result = (await db(req).query(query, inputs)).rowsAffected;
        if (result) {
          res.redirect("/home/list-documentCome");
        }
        db(req).close();
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    deleteDocument: async (req, res) => {
      try {
        let id = req.params.id;
        const DeleteQuery = `DELETE VAN_BAN WHERE id=@Id`;
        const inputs = [
          {name: 'Id', value: parseInt(id)}
        ];
        const result = (await db(req).query(DeleteQuery, inputs)).rowsAffected;
        if (result) {
          res.json({ s: 200, msg: "Delete success!!" });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    editDocumentCome: async (req, res) => {
      try {
        let editValue = req.body;
        const query = `UPDATE VAN_BAN SET so_vb=@sovb, ma_dvb=@madvb, noi_dung=@noidung, dv_phat_hanh=@dvphathanh, nguoi_lh=@nguoilh, dien_thoai=@dienthoai, nguoi_nhan=@nguoinhan, nguoi_ky_vb=@nguoikyvb, trang_thai=@trangthai, ghi_chu=@ghichu, modifyby=@modifyBy, modifydate=@modifyDate, file_name=@fileName WHERE id=@Id`;
        const inputs = [
          {name: 'sovb', value: editValue.so_vb},
          {name: 'madvb', value: editValue.ma_dvb},//
          {name: 'noidung', value: editValue.noi_dung},
          {name: 'dvphathanh', value: editValue.dv_phat_hanh},//
          {name: 'nguoilh', value: editValue.nguoi_lh},
          {name: 'dienthoai', value: editValue.dien_thoai},
          {name: 'nguoinhan', value: editValue.nguoi_nhan},//
          {name: 'nguoikyvb', value: editValue.nguoi_ky_vb},
          {name: 'trangthai', value: editValue.trang_thai},//
          {name: 'ghichu', value: editValue.ghi_chu},
          {name: 'modifydate', value: new Date()},
          {name: 'modifyby', value: 'nguyenthanhtin@pnt.edu.vn'},
          {name: 'fileName', value: 'pdf'},
          {name: 'Id', value: editValue.id},
        ];
        const result = (await db(req).query(query, inputs)).rowsAffected;
        if (result) {
          res.redirect("/home/list-documentCome");
        }
        db(req).close();
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    documentGo: async (req, res) => {
      try {
        let params = req.body;
        let soVb = params.soVbSearch ? params.soVbSearch : "";
        let loaivb = params.loaivbSearch ? params.loaivbSearch : "";
        let donvi = params.donviSearch ? params.donviSearch : "";
        let trangthai= params.trangthaiSearch ? params.trangthaiSearch : "";

        let ItemsPerPage = 10;
        let currentPage = params.page ? parseInt(params.page) : 1;

        let resultDV = await listDepartment(req);
        let resultLVB = await listDocType(req);
        let resultTT = await listStatus(req);
        let resultUser = await listUser(req);

        // lay Tat ca van ban di
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
          listUser: resultUser,
          filters: {
            soVbSearch: soVb,
            loaivbSearch: loaivb,
            donviSearch: donvi,
            trangthaiSearch: trangthai,
          },
          detailDocument: null,
          path: pathname(req),
        });
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    },
    createDocumentGo: async (req, res) => {
      try {
        let createValue = req.body;
        const query = `INSERT INTO VAN_BAN (so_vb, ngay_tao, loai_vb, ma_dvb, noi_dung, dv_phat_hanh, nguoi_lh, dien_thoai, dv_nhan, nguoi_nhan, nguoi_ky_vb, trang_thai, status, ghi_chu, createdate, createby, modifydate, modifyby, file_name)
        VALUES ( @so_vb, @ngay_tao, @loai_vb, @ma_dvb, @noi_dung, @dv_phat_hanh, @nguoi_lh, @dien_thoai, @dv_nhan, @nguoi_nhan, @nguoi_ky_vb, @trang_thai, @status, @ghi_chu, @createdate, @createdby, @modifydate, @modifyby, @file_name)`;
        const inputs = [
          {name: 'so_vb', value: createValue.so_vb},
          {name: 'ngay_tao', value: new Date()},
          {name: 'loai_vb', value: 'CVDI'},
          {name: 'ma_dvb', value: createValue.ma_dvb},//
          {name: 'noi_dung', value: createValue.noi_dung},
          {name: 'dv_phat_hanh', value: 'DM_BP1501000000043'},// default Phòng Công nghệ Thông tin
          {name: 'nguoi_lh', value: createValue.nguoi_lh},
          {name: 'dien_thoai', value: createValue.dien_thoai},
          {name: 'dv_nhan', value: createValue.dv_nhan},
          {name: 'nguoi_nhan', value: createValue.nguoi_nhan},//
          {name: 'nguoi_ky_vb', value: createValue.nguoi_ky_vb},
          {name: 'trang_thai', value: createValue.trang_thai},//
          {name: 'status', value: 'True'},
          {name: 'ghi_chu', value: createValue.ghi_chu},
          {name: 'createdate', value: new Date()},
          {name: 'createdby', value: 'nguyenthanhtin@pnt.edu.vn'},
          {name: 'modifydate', value: new Date()},
          {name: 'modifyby', value: 'nguyenthanhtin@pnt.edu.vn'},
          {name: 'file_name', value: 'pdf'},
        ];
        const result = (await db(req).query(query, inputs)).rowsAffected;
        if (result > 0) {
          res.redirect("/home/list-documentGo");
        }
        db(req).close();
      } catch (error) {
        console.log(error);
        res.status(500).json(error);
      }
    }
  };
}

module.exports = new HomeController();
