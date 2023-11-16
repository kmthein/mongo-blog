const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const session = require("express-session");
const mongoStore = require("connect-mongodb-session")(session); 

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

app.use((req, res, next) => {
  User.findById("65544bc866bf5d94d0c9debd").then((user) => {
    req.user = user;
    next();
  });
});

app.use(session({
  secret: process.env.SESSION_KEY,
  unsave: false,
  saveUninitialized: false,
  store
}))

app.use("/admin", adminRoutes);
app.use(postRoutes);
app.use(authRoutes);

mongoose
  .connect(process.env.MONGODB_URL)
  .then((result) => {
    app.listen(8080);
    console.log("Connected to database.");
  });
