exports.renderLoginPage = (req, res) => {
    res.render("auth/login", {title: "Login Page"})
}

exports.postLoginData = (req, res) => {
    res.setHeader("Set-Cookie", "isLogin=true");
    res.redirect("/");
}