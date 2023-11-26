const posts = [];

const Post = require("../models/post");

const { validationResult } = require("express-validator");

const formatISO9075 = require("date-fns/formatISO9075");

exports.createPost = (req, res) => {
  const { title, description, photo } = req.body;
  const image = req.file;
  // const userId = req.session.userInfo._id;
  if (image === undefined) {
    return res.status(422).render("addPost", {
      title: "Add New Post",
      errorMsg: "Photo extension must be jpg, png or jpeg.",
      oldFormData: { title, description, photo },
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("addPost", {
      title: "Add New Post",
      errorMsg: errors.array()[0].msg,
      oldFormData: { title, description, photo },
    });
  }
  Post.create({ title, description, imgUrl: image.path, userId: req.user._id })
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.renderCreatePage = (req, res) => {
  // res.sendFile(path.join(__dirname, "..", "views", "addPost.html"));

  res.render("addPost", {
    title: "Add New Post",
    errorMsg: "",
    oldFormData: { title: "", description: "", photo: "" },
  });
};

exports.renderHomePage = (req, res) => {
  // res.sendFile(path.join(__dirname, "..", "views", "homepage.html"));
  // const cookie = req.get("Cookie").split("=")[1].trim() === "true";
  let loginSuccessMsg = req.flash("loginSuccess");
  if (loginSuccessMsg.length > 0) {
    loginSuccessMsg = loginSuccessMsg[0];
  } else {
    loginSuccessMsg = null;
  }
  Post.find()
    // .select("title")
    .populate("userId", "username")
    .sort({ title: 1 })
    .then((posts) => {
      res.render("home", {
        title: "Homepage",
        postsArr: posts,
        isLogin: req.session.isLogin ? true : false,
        loginSuccessMsg,
        currentUser: req.session.userInfo ? req.session.userInfo.email : "",
        csrfToken: req.csrfToken(),
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditPost = (req, res) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return res.redirect("/");
      }
      res.render("editPost", {
        postId,
        title: post.title,
        post,
        errorMsg: "",
        oldFormData: { title: undefined, description: undefined },
        isValidationFail: false,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("addPost", {
      title: "Add New Post",
      errorMsg: errors.array()[0].msg,
      oldFormData: { title, description, photo },
    });
  }
  Post.findById(postId)
    .populate("userId", "email")
    .then((post) => {
      res.render("details", {
        title: "Post Details",
        post,
        date: post.createdAt
          ? formatISO9075(post.createdAt, { representation: "date" })
          : undefined,
        currentLoginUserId: req.session.userInfo
          ? req.session.userInfo._id
          : "",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};

exports.editPost = (req, res) => {
  const { title, description, photo, postId } = req.body;
  const image = req.file;
  console.log(image);
  Post.findById(postId)
    .then((post) => {
      if (post.userId.toString() != req.user._id.toString()) {
        return res.redirect("/");
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).render("editPost", {
          title: post.title,
          errorMsg: errors.array()[0].msg,
          post,
          oldFormData: { title, description, photo },
          isValidationFail: true,
        });
      }
      post.title = title;
      post.description = description;
      if (image) {
        post.imgUrl = image.path;
      }
      return post.save().then((result) => {
        console.log("Post Updated.");
        res.redirect("/");
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deletePost = (req, res) => {
  const { postId } = req.params;

  Post.deleteOne({ _id: postId, userId: req.user._id })
    .then(() => {
      console.log("Post Deleted");
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};
