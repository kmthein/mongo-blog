const Post = require("../models/post");

const User = require("../models/user");

const { validationResult } = require("express-validator");

const fileDelete = require("../utils/file-delete");

const dotenv = require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const path = require("path");
const { userInfo } = require("os");

exports.getProfile = (req, res, next) => {
  const pageNumber = +req.query.page || 1;
  // res.sendFile(path.join(__dirname, "..", "views", "homepage.html"));
  // const cookie = req.get("Cookie").split("=")[1].trim() === "true";
  let totalPosts;
  const POST_PER_PAGE = 6;
  Post.find({ userId: req.user._id })
    .countDocuments()
    .then((total) => {
      if (total == 0) {
        return res.status(422).render("user/profile", {
          title: req.session.userInfo.username,
          postsArr: [],
          profileImg: req.user.img ? req.user.img : "",
          userInfo: req.user ? req.user : "",
          csrfToken: req.csrfToken(),
          currentUser: req.session.userInfo ? req.session.userInfo : "",
        });
      }
      totalPosts = total;
      return Post.find({ userId: req.user._id })
        .populate("userId")
        .skip((pageNumber - 1) * POST_PER_PAGE)
        .limit(POST_PER_PAGE)
        .sort({ createdAt: -1 });
    })
    .then((posts) => {
      if (posts.length > 0) {
        return res.render("user/profile", {
          title: req.session.userInfo.username,
          postsArr: posts,
          csrfToken: req.csrfToken(),
          profileImg: req.user.img ? req.user.img : "",
          userInfo: req.user ? req.user : "",
          currentUser: req.session.userInfo ? req.session.userInfo : "",
          currentPage: pageNumber,
          hasNextPage: POST_PER_PAGE * pageNumber < totalPosts,
          hasPreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
        });
        console.log(userInfo);
      } else {
        res.status(500).render("error/500", {
          title: "Something went wrong.",
          message: "No posts found in this page number.",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getPublicProfile = (req, res) => {
  const { id } = req.params;
  const pageNumber = +req.query.page || 1;
  // res.sendFile(path.join(__dirname, "..", "views", "homepage.html"));
  // const cookie = req.get("Cookie").split("=")[1].trim() === "true";
  let totalPosts;
  const POST_PER_PAGE = 6;
  Post.find({ userId: id })
    .countDocuments()
    .then((total) => {
      totalPosts = total;
      return Post.find({ userId: id })
        .populate("userId")
        .skip((pageNumber - 1) * POST_PER_PAGE)
        .limit(POST_PER_PAGE)
        .sort({ createdAt: -1 });
    })
    .then((posts) => {
      if (posts.length > 0) {
        res.render("user/public-profile", {
          title: posts[0].userId.username,
          profileImg: posts[0].userId.img,
          postsArr: posts,
          csrfToken: req.csrfToken(),
          userInfo: req.user ? req.user : "",
          currentPage: pageNumber,
          hasNextPage: POST_PER_PAGE * pageNumber < totalPosts,
          hasPreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
        });
      } else {
        res.status(500).render("error/500", {
          title: "Something went wrong.",
          message: "No posts found in this page number.",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditProfile = (req, res) => {
  const { username, email, password } = req.body;
  User.findById(req.user._id)
    .then((user) => {
      res.render("user/edit-user", {
        title: "Edit Profile",
        user,
        userInfo: req.user ? req.user : "",
        csrfToken: req.csrfToken(),
        errorMsg: "",
        oldFormData: { username: "", email: "", password: "" },
        isUpdateFail: false,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.updateProfile = (req, res, next) => {
  const { username, email } = req.body;
  const image = req.file;
  User.findById(req.user._id)
    .then((user) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).render("user/edit-user", {
          title: "Edit Profile",
          user,
          csrfToken: req.csrfToken(),
          errorMsg: errors.array()[0].msg,
          oldFormData: { username, email },
          isUpdateFail: true,
        });
      }
      user.username = username;
      user.email = email;
      if (image) {
        user.img = image.path;
      }
      return user.save().then(() => {
        console.log("User updated.");
        res.redirect(`/admin/profile/<%= user._req.user._id %`);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getPremiumPage = (req, res, next) => {
  User.findById(req.user._id).then((user) => {
    stripe.checkout.sessions
      .create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: "price_1OKDyJJTaSaGoUM605OqQNch",
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.protocol}://${req.get(
          "host"
        )}/admin/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get(
          "host"
        )}/admin/subscription-fail`,
      })
      .then((stripe_session) => {
        return res.render("user/premium", {
          title: "Premium Page",
          user,
          session_id: stripe_session.id,
        });
      });
  });
};

exports.getSuccessPage = (req, res, next) => {
  const session_id = req.query.session_id;
  if (!session_id || !session_id.includes("cs_test_")) {
    return res.redirect(`/admin/profile/${req.user._id}`);
  }
  User.findById(req.user._id)
    .then((user) => {
      user.isPremium = true;
      user.payment_session_key = session_id;
      return user.save();
    })
    .then((result) => {
      console.log("Premium user subscription completed.");
      return res.redirect(`/admin/profile/${req.user_id}`);
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.getPremiumDetails = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      return stripe.checkout.sessions.retrieve(user.payment_session_key);
    })
    .then((stripe_session) => {
      const total = stripe_session.amount_total.toString();
      res.render("user/premium-details", {
        title: "Premium Details",
        user: req.user,
        customerId: stripe_session.customer,
        email: stripe_session.customer_details.email,
        name: stripe_session.customer_details.name,
        status: stripe_session.payment_status.charAt(0).toUpperCase() + stripe_session.payment_status.slice(1),
        totalAmount: total.substring(0, total.length - 2),
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};
