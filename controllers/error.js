exports.get404page = (req, res) => {
  res.status(404).render("error/404", { title: "Page Not Found." });
};

exports.get500page = (err, req, res, next) => {
    res.status(500).render("error/500", { title: "Something went wrong.", message: err.msg });
}