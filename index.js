const express = require("express"); // import express
const app = express(); // khai bao
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();
const sessions = require("express-session");

const getDataConfig = require('./database/data.config');
const { dataAccess } = require('./database/data.access');
const home = require('./routes/home');
const admin = require('./routes/admin');
const auth = require('./routes/auth');

const dataConfig = getDataConfig();
const port = process.env.PORT;
var corsOptions = {
  origin: "http://localhost:8081"
};
app.use(
  sessions({
    secret: "456456456",
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: false,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.locals.db = {
  pcntt: dataAccess(dataConfig.pcntt),
}
app.locals.pathname = '/';

app.set("view engine", "ejs");
app.use('/views', express.static('views'));

app.use("/", home);
app.use('/auth', auth);
app.get("*", (req, res) => { 
  res.render("pages/auth/login.ejs");
}); 

app.listen(port, function () {
  console.log("Node server running @ http://localhost:3000");
});