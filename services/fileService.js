"use strict";
const firebase = require("./firebaseService");
const xlsx = require("xlsx");
const fs = require("fs");

function FileService() {
  const SELF = {
    sampleData: [
      {
        fullname: "Nguyen Van A",
        username: "anv",
        phone: "0905448763",
        email: "anv@gmail.com",
        active: true,
      },
      {
        fullname: "Nguyen Van B",
        username: "bnv",
        phone: "0905448778",
        email: "bnv@gmail.com",
        active: false,
      },
      {
        fullname: "Nguyen Van C",
        username: "cnv",
        phone: "0905448256",
        email: "cnv@gmail.com",
        active: true,
      },
    ],
  };
  return {
    uploadFile: (req, res) => {
      let uloadedFile = req.file;
      try {
        if (!uloadedFile) {
          return res.json({ s: 404, msg: "File not found" });
        }
        const blob = firebase.bucket.file(uloadedFile.originalname);
        const blobWriter = blob.createWriteStream({
          metadata: {
            contentType: uloadedFile.mimetype,
          },
        });
        blobWriter.on("error", (err) => {
          console.log("upload image error 0: ", err);
        });
        blobWriter.on("finish", () => {
          console.log("Uploaded");
          const options = {
            action: "read",
            expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 365 ngay
          };
          blob.getSignedUrl(options).then(async (urls) => {
            return res.json({
              urlUploaded: urls[0],
            });
          });
        });
        blobWriter.end(uloadedFile.buffer);
      } catch (error) {
        console.log("upload image error 1: ", error);
      }
    },
    uploadFileExcel: (req, res) => {
      const file = req.files;
      if (!file) {
        return res.json({ s: 400, msg: "No files" });
      }

      //Lưu file vào thư mục tạm
      const excelFile = file.file;
      excelFile.mv(__dirname + "/uploads/" + excelFile.name, (err) => {
        if (err) {
          return res.json({ s: 400, msg: err });
        }
        //__dirname: C://Desktop//work//Neshctech/NESHTECH-EC/services
        const workbook = xlsx.readFile(__dirname + "/uploads/" + excelFile.name);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(data);
        res.send("Import thành công");
      });
    },
    exportFileExcel: (req, res) => {
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(SELF.sampleData);
      xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet 1");

      // Tạo file Excel tạm thời
      const tempFilePath = "temp.xlsx";
      xlsx.writeFile(workbook, tempFilePath);

      // Gửi file Excel về cho người dùng tải xuống
      res.download(tempFilePath, "data.xlsx", (err) => {
        // Xóa file Excel tạm thời sau khi đã gửi
        fs.unlink(tempFilePath, (err) => {
          if (err) {
            console.error(err);
          }
        });
      });
    },
  };
}

module.exports = new FileService();
