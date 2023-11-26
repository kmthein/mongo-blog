const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const session = require("express-session");
const mongoStore = require("connect-mongodb-session")(session); 
const { isLogin } = require("./middleware/is-login");
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const store = new mongoStore({
  uri: process.env.MONGODB_URI,
  collection: "session",
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + "_" + file.originalname);
  }
})

const fileFilterConfigure = (req, file, cb) => {
  if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
    cb(null, true)
  } else {
    cb(null, false)
  }
} 

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const postRoutes = require("./routes/post");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

const errorController = require("./controllers/error");

const User = require("./models/user");

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
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

app.use(multer({ storage: storage, fileFilter: fileFilterConfigure }).single("photo"));

const csrfProtect = csrf();

app.use(csrfProtect);

app.use(flash());

app.use((req, res, next) => {
  res.locals.isLogin = req.session.isLogin ? true : false;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use("/admin", isLogin, adminRoutes);
app.use(postRoutes);
app.use(authRoutes);

app.all("*", errorController.get404page);

app.use(errorController.get500page);

mongoose
  .connect(process.env.MONGODB_URL)
  .then((result) => {
    app.listen(8080);
    console.log("Connected to database.");
  });
