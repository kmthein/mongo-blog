const posts = [];

const Post = require("../models/post");

const { validationResult } = require("express-validator");

const formatISO9075 = require("date-fns/formatISO9075");

const fileDelete = require("../utils/file-delete");

const path = require("path");

const pdf = require("pdf-creator-node");
const fs = require("fs");

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

exports.renderHomePage = (req, res, next) => {
  const pageNumber = +req.query.page || 1;
  // res.sendFile(path.join(__dirname, "..", "views", "homepage.html"));
  // const cookie = req.get("Cookie").split("=")[1].trim() === "true";
  let totalPosts;
  let loginSuccessMsg = req.flash("loginSuccess");
  if (loginSuccessMsg.length > 0) {
    loginSuccessMsg = loginSuccessMsg[0];
  } else {
    loginSuccessMsg = null;
  }
  const POST_PER_PAGE = 3;
  Post.find()
    .countDocuments()
    .then((total) => {
      totalPosts = total;
      if (total > 1) {
        return Post.find()
          .populate("userId", "username")
          .skip((pageNumber - 1) * POST_PER_PAGE)
          .limit(POST_PER_PAGE)
          .sort({ createdAt: -1 });
      } else {
        res
          .status(500)
          .render("error/500", {
            title: "Something went wrong.",
            message: "No posts found in this page number.",
          });
      }
    })
    .then((posts) => {
      if(posts.length > 0) {
        res.render("home", {
          title: "Homepage",
          postsArr: posts,
          isLogin: req.session.isLogin ? true : false,
          loginSuccessMsg,
          currentUser: req.session.userInfo ? req.session.userInfo.email : "",
          csrfToken: req.csrfToken(),
          currentPage: pageNumber,
          hasNextPage: POST_PER_PAGE * pageNumber < totalPosts,
          hasPreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
        });  
      } else {
        res
        .status(500)
        .render("error/500", {
          title: "Something went wrong.",
          message: "No posts found in this page number.",
        });
      }
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
        isLogin: req.session.isLogin ? true : false,
        currentUser: req.session.userInfo ? req.session.userInfo.email : "",
        csrfToken: req.csrfToken(),
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
        fileDelete(post.imgUrl);
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
  Post.findById(postId).then((post) => {
    fileDelete(post.imgUrl);
  });
  Post.deleteOne({ _id: postId, userId: req.user._id })
    .then(() => {
      console.log("Post Deleted");
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.saveAsPDF = (req, res) => {
  const { id } = req.params;
  const templateUrl = `${path.join(
    __dirname,
    "../views/template/template.html"
  )}`;
  const html = fs.readFileSync(templateUrl, "utf8");
  const options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "45mm",
      contents:
        '<div style="text-align: center;">PDF download from My Blogs</div>',
    },
  };
  Post.findById(id)
    .populate("userId")
    .lean()
    .then((post) => {
      const date = new Date();
      const pdfPath = `${path.join(
        __dirname,
        "../public/pdf/" + date.getTime() + ".pdf"
      )}`;
      const document = {
        html: html,
        data: {
          post,
        },
        path: pdfPath,
        type: "",
      };
      pdf
        .create(document, options)
        .then((result) => {
          console.log(result);
          res.download(pdfPath, (err) => {
            // if(err) throw err;
            fileDelete(pdfPath);
          });
        })
        .catch((error) => {
          console.error(error);
        });
    });
};
