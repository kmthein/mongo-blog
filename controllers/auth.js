const User = require("../models/user");

const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");

const dotenv = require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.MAIL_PASSWORD,
  }
})

exports.renderLoginPage = (req, res) => {
  let message = req.flash("error");
  if(message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  let regSuccessMsg = req.flash("regSuccess");
  if(regSuccessMsg.length > 0) {
    regSuccessMsg = regSuccessMsg[0];
  } else {
    regSuccessMsg = null;
  }
  res.render("auth/login", { title: "Login Page", errorMsg: message, regSuccessMsg });
};

exports.postLoginData = (req, res) => {
  // res.setHeader("Set-Cookie", "isLogin=true");
  const { email, password } = req.body;
  User.findOne({ email }).then((user) => {
    if (!user) {
      req.flash("error", "Wrong email or password try again!")
      return res.redirect("/login");
    }
    bcrypt
      .compare(password, user.password)
      .then((isMatch) => {
        if (isMatch) {
          req.session.isLogin = true;
          req.session.userInfo = user;
          return req.session.save((err) => {
            req.flash("loginSuccess", "Your account is login successfully.")
            res.redirect("/");
          });
        }
        req.flash("loginSuccess", "Your account is login successfully.")
        res.redirect("/");
      })
      .catch((err) => console.log(err));
  });
};

exports.renderRegisterPage = (req, res) => {
  let message = req.flash("regError");
  if(message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/register", { title: "Register Page", regError: message });
};

exports.postRegisterData = (req, res) => {
  const { username, email, password } = req.body;
  User.findOne({ email }).then((user) => {
    if (user) {
      req.flash("regError", "Email has already existing!")
      return res.redirect("/register");
    }
    return bcrypt
      .hash(password, 10)
      .then((hashedPassword) => {
        User.create({
          username,
          email,
          password: hashedPassword,
        }).then(() => {
          req.flash("regSuccess", "Your account has successfully created.")
          transporter.sendMail({
            from: process.env.SENDER_MAIL,
            to: email,
            subject: "Register Successful",
            html: "<h1>Register account successful</h1><p>Created an account using this email address in blog.io.</p>"
          })
          res.redirect("/login");
        });
      })
      .catch((err) => console.log(err));
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
