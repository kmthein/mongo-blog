const Post = require("../models/post");

exports.getProfile = (req, res, next) => {
    const pageNumber = +req.query.page || 1;
  // res.sendFile(path.join(__dirname, "..", "views", "homepage.html"));
  // const cookie = req.get("Cookie").split("=")[1].trim() === "true";
  let totalPosts;
  const POST_PER_PAGE = 6;
  Post.find({userId: req.user._id})
    .countDocuments()
    .then((total) => {
      totalPosts = total;
        return Post.find({userId: req.user._id})
          .populate("userId")
          .skip((pageNumber - 1) * POST_PER_PAGE)
          .limit(POST_PER_PAGE)
          .sort({ createdAt: -1 });
    })
    .then((posts) => {
        console.log(posts);
      if(posts.length > 0) {
        res.render("user/profile", {
          title: req.session.userInfo.username,
          postsArr: posts,
          csrfToken: req.csrfToken(),
          currentUser: req.session.userInfo ? req.session.userInfo : "",
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
}

