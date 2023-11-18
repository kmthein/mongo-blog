const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const session = require("express-session");
const mongoStore = require("connect-mongodb-session")(session); 
const { isLogin } = require("./middleware/is-login");
const csrf = require("csurf");

const store = new mongoStore({
  uri: process.env.MONGODB_URI,
  collection: "session",
})

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const postRoutes = require("./routes/post");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

const User = require("./models/user");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_KEY,
  unsave: false,
  saveUninitialized: false,
  store
}))

app.use((req, res, next) => {
  if(req.session.isLogin === undefined) {
    return next();
  }
  User.findById(req.session.userInfo._id).select("_id username email").then((user) => {
    req.user = user;
    next();
  });
});

const csrfProtect = csrf();

app.use(csrfProtect);

app.use((req, res, next) => {
  res.locals.isLogin = req.session.isLogin ? true : false;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use("/admin", isLogin, adminRoutes);
app.use(postRoutes);
app.use(authRoutes);

mongoose
  .connect(process.env.MONGODB_URL)
  .then((result) => {
    app.listen(8080);
    console.log("Connected to database.");
  });
