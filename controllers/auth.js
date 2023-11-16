exports.renderLoginPage = (req, res) => {
    res.render("auth/login", {title: "Login Page"})
}

exports.postLoginData = (req, res) => {
    // res.setHeader("Set-Cookie", "isLogin=true");
    req.session.isLogin = true;
    res.redirect("/");
}

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    })
}