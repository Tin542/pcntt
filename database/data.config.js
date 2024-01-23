require("dotenv").config();

const options = {
  encrypt: false,
  enableArithAbort: false,
};

const getDataConfig = () => ({
  pcntt: {
    name: process.env.SQL_NAME,
    config: {
      driver: process.env.SQL_DRIVER,
      server: process.env.SQL_SERVER,
      database: process.env.SQL_DATABASE,
      user: process.env.SQL_UID,
      password: process.env.SQL_PWD,
      options: options,
    },
  },
});

module.exports = getDataConfig;
