const User = require("../models/user");

const bcrypt = require("bcrypt");

exports.renderLoginPage = (req, res) => {
  res.render("auth/login", { title: "Login Page" });
};

exports.postLoginData = (req, res) => {
  // res.setHeader("Set-Cookie", "isLogin=true");
  const { email, password } = req.body;
  User.findOne({ email }).then((user) => {
    if (!user) {
      return res.redirect("/login");
    }
    bcrypt
      .compare(password, user.password)
      .then((isMatch) => {
        if (isMatch) {
          req.session.isLogin = true;
          req.session.userInfo = user;
          return req.session.save((err) => {
            res.redirect("/");
            console.log(err);
          });
        }
        res.redirect("/");
      })
      .catch((err) => console.log(err));
  });
};

exports.renderRegisterPage = (req, res) => {
  res.render("auth/register", { title: "Register Page" });
};

exports.postRegisterData = (req, res) => {
  const { username, email, password } = req.body;
  User.findOne({ email }).then((user) => {
    if (user) {
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
