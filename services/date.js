"use strict";
const firebase = require("./firebaseService");
const xlsx = require("xlsx");
const fs = require("fs");

function FileService() {
  const SELF = {
    getDateISO: (yourDate) => {
      if (!yourDate) yourDate = new Date();
      const offset = yourDate.getTimezoneOffset();
      yourDate = new Date(yourDate.getTime() - offset * 60 * 1000);
      return parseInt(
        yourDate.toISOString().split("T")[0].split("-").join(""),
        10
      );
    },
    getTimeISO: (yourDate) => {
      if (!yourDate) yourDate = new Date();
      const offset = yourDate.getTimezoneOffset();
      yourDate = new Date(yourDate.getTime() - offset * 60 * 1000);
      return yourDate
        .toISOString()
        .split("T")[1]
        .split(".")[0]
        .split(":")
        .join("");
    },
    chunkSubstr: (str, size) => {
      const numChunks = Math.ceil(str.length / size);
      const chunks = new Array(numChunks);

      for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.slice(o, size + o);
      }
      return chunks;
    },
  };
  return {
    /**@memberOf TimeUtil
     * @description get current date
     * @param format MMDDYYYY | DDMMYYYY | YYYYMMDD (default: MMDDYYYY)
     * @param yourDate the date which to convert
     * @return String MMDDYYYY*/
    getStrDate: (format, yourDate) => {
      const now = "" + SELF.getDateISO(yourDate);
      if (format === "MMDDYYYY")
        return now.substring(4, 6) + now.substring(6) + now.substring(0, 4);
      if (format === "DDMMYYYY")
        return now.substring(6) + now.substring(4, 6) + now.substring(0, 4);
      if (format === "DD/MM/YYYY")
        return `${now.substring(6)}/${now.substring(4, 6)}/${now.substring(0, 4)}`;
      if (format === "MM/YYYY")
        return `${now.substring(4, 6)}/${now.substring(0, 4)}`;
      if (format === "MMYYYY")
        return `${now.substring(4, 6)}${now.substring(0, 4)}`;
      if (format === "YYYYMMDD") {
        return `${now.substring(0, 4)}${now.substring(4, 6)}${now.substring(
          6
        )}`;
      }
      return now;
    },
    /**@memberOf TimeUtil
     * @description get current time
     * @param format  (default: SS:MM:HH)
     * @param yourDate the date which to convert
     * @return String MMDDYYYY*/
    getStrTime: (format = "SS:MM:HH", yourDate) => {
      if (!yourDate) yourDate = new Date();
      let time = SELF.getTimeISO(yourDate);
      return SELF.chunkSubstr("" + time, 2).join(":");
    },
  };
}

module.exports = new FileService();
