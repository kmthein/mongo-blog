const User = require("../models/user");

const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");

const dotenv = require("dotenv").config();

const crypto = require("crypto");

const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

exports.renderLoginPage = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  let regSuccessMsg = req.flash("regSuccess");
  if (regSuccessMsg.length > 0) {
    regSuccessMsg = regSuccessMsg[0];
  } else {
    regSuccessMsg = null;
  }
  res.render("auth/login", {
    title: "Login Page",
    errorMsg: message,
    oldFormData: { email: "", password: "" },
  });
};

exports.postLoginData = (req, res) => {
  // res.setHeader("Set-Cookie", "isLogin=true");
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      title: "Login Page",
      errorMsg: errors.array()[0].msg,
      oldFormData: { email, password },
    });
  }
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        res.status(422).render("auth/login", {
          title: "Login Page",
          errorMsg: "Wrong Email or Password, try again.",
          oldFormData: { email, password },
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            req.session.isLogin = true;
            req.session.userInfo = user;
            return req.session.save((err) => {
              req.flash("loginSuccess", "Your account is login successfully.");
              res.redirect("/");
            });
          }
          res.status(422).render("auth/login", {
            title: "Login Page",
            errorMsg: "Wrong Email or Password, try again.",
            oldFormData: { email, password },
          });
          res.redirect("/login");
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

exports.renderRegisterPage = (req, res) => {
  let message = req.flash("regError");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/register", {
    title: "Register Page",
    regError: message,
    oldFormData: { username: "", email: "", password: "" },
  });
};

exports.postRegisterData = (req, res) => {
  const { username, email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/register", {
      title: "Register Page",
      regError: errors.array()[0].msg,
      oldFormData: { username, email, password },
    });
  }
  bcrypt.hash(password, 10).then((hashedPassword) => {
    User.create({
      username,
      email,
      password: hashedPassword,
    }).then(() => {
      transporter.sendMail({
        from: process.env.SENDER_MAIL,
        to: email,
        subject: "Register Successful",
        html: "<h1>Register account successful</h1><p>Created an account using this email address in blog.io.</p>",
      });
      res.redirect("/login");
    });
  });
};

exports.renderResetPage = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  let regSuccessMsg = req.flash("regSuccess");
  if (regSuccessMsg.length > 0) {
    regSuccessMsg = regSuccessMsg[0];
  } else {
    regSuccessMsg = null;
  }
  res.render("auth/reset-password", {
    title: "Reset Password",
    errorMsg: message,
    oldFormData: { email: "" },
  });
};

exports.sendResetLink = (req, res) => {
  const { email } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("auth/reset-password", {
      title: "Reset Password",
      errorMsg: errors.array()[0].msg,
      oldFormData: { email },
    });
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/reset-password");
    }
    const token = buffer.toString("hex");
    User.findOne({ email }).then((user) => {
      user.resetToken = token;
      user.tokenExpiration = Date.now() + 1800000;
      return user
        .save()
        .then((result) => {
          console.log(result);
          transporter.sendMail(
            {
              from: process.env.SENDER_MAIL,
              to: email,
              subject: "Reset Password",
              html: `<h1>Reset your password</h1><p>Change your password by clicking link below.</p><a href="http://localhost:8080/reset-password/${token}" target="_blank">Click me to change password !!!</a>`,
            },
            (err) => {
              console.log(err);
            }
          );
          res.redirect("/reset-password");
        })
        .catch((err) => {
          console.log(err);
        });
    });
  });
};

exports.renderChangePassword = (req, res) => {
  const { token } = req.params;
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  let regSuccessMsg = req.flash("regSuccess");
  if (regSuccessMsg.length > 0) {
    regSuccessMsg = regSuccessMsg[0];
  } else {
    regSuccessMsg = null;
  }
  User.findOne({
    resetToken: token,
    tokenExpiration: { $gt: Date.now() },
  }).then((user) => {
    if (user) {
      res.render("auth/change-password", {
        title: "Change Password",
        resetToken: token,
        user_id: user._id,
        errorMsg: message,
        oldFormData: { password: "", cpassword: "" },
      });
    } else {
      res.redirect("/");
    }
  });
};

exports.changeNewPassword = (req, res) => {
  const { password, cpassword, user_id, resetToken } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("auth/change-password", {
      title: "Change Password",
      errorMsg: errors.array()[0].msg,
      oldFormData: { password, cpassword },
      user_id,
      resetToken,
    });
  }
  let resetUser;
  User.findOne({
    resetToken,
    tokenExpiration: { $gt: Date.now() },
    _id: user_id,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(password, 10);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.tokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("login");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
