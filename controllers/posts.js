const posts = [];

const Post = require("../models/post");

exports.createPost = (req, res) => {
  const { title, description, photo } = req.body;

  Post.create({ title, description, imgUrl: photo, userId: req.user })
    .then((result) => {
      console.log(result);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
}; 

exports.renderCreatePage = (req, res) => {
  // res.sendFile(path.join(__dirname, "..", "views", "addPost.html"));
  res.render("addPost", { title: "Post create ml" });
};

exports.renderHomePage = (req, res) => {
  // res.sendFile(path.join(__dirname, "..", "views", "homepage.html"));
  Post.find()
    .select("title")
    .populate("userId", "username")
    .sort({ title: 1 })
    .then((posts) => {
      console.log(posts);
      res.render("home", { title: "Homepage", postsArr: posts });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditPost = (req, res) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      res.render("editPost", { title: post.title, post });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getPost = (req, res) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      res.render("details", { title: "Post Details Page", post });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.editPost = (req, res) => {
  const { title, description, photo, postId } = req.body;

  Post.findById(postId)
    .then((post) => {
      post.title = title;
      post.description = description;
      post.imgUrl = photo;
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

  Post.findByIdAndDelete(postId)
    .then(() => {
      console.log("Post Deleted");
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};
