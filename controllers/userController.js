const User = require("../models/User");
const Post = require("../models/Post");

// register
exports.register = async (req, res) => {
  // pass in data
  let user = new User(req.body);
  user
    .register()
    .then(() => {
      // flash message
      req.flash("success", "Please check your email 📧");
      req.session.save(function () {
        res.redirect("/");
      });
    })
    .catch((err) => {
      req.flash("errors", err);
      req.session.save(function () {
        res.redirect("/");
      });
    });
};
// activate
exports.activate = (req, res) => {
  let user = new User(req.session.token);
  user
    .activate()
    .then(() => {
      req.flash("success", "Account activated, you can now log in 🤗");
      req.session.save(function () {
        res.redirect("/");
      });
      // destroy token
      req.session.destroy();
    })
    .catch((err) => {
      req.flash("errors", err);
      // res.send(err);
      req.session.save(function () {
        res.redirect("/");
      });
    });
};
// login
exports.login = async (req, res) => {
  let user = new User(req.body);
  user
    .login()
    .then(() => {
      // pass user data to session
      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id,
      };
      // save user session
      req.session.save(function () {
        // redirect to dashboard
        res.redirect("/");
      });
    })
    .catch((err) => {
      req.flash("errors", err);
      req.session.save(function () {
        // redirect to dashboard
        res.redirect("/");
      });
    });
};
// logout
exports.logout = (req, res) => {
  req.session.destroy(function () {
    res.redirect("/");
  });
};
// logged in
exports.loggedIn = (req, res, next) => {
  // check if user is logged in
  if (req.session.user) {
    next();
  } else {
    req.flash("errors ", "Please log in");
    req.session.save(function () {
      res.redirect("/");
    });
  }
};
// find user
exports.findUser = (req, res, next) => {
  User.findUser(req.params.userId)
    .then((userId) => {
      // create new property on the request object
      req.profileUser = userId;
      next();
    })
    .catch(() => {
      res.render("404");
    });
};
// renders
exports.renderHome = (req, res) => {
  if (req.session.user) {
    res.render("dashboard");
  } else {
    res.render("signup");
  }
};
exports.renderActivate = (req, res) => {
  // check for token
  if (req.params.token) {
    // store token in session
    req.session.token = req.params.token;
    res.render("activate");
  } else {
    req.flash("errors", "Please try again");
    req.session.save(function () {
      res.render("activate");
    });
  }
};
exports.renderProfile = (req, res) => {
  // pull in profile posts
  Post.findAuthorPost(req.params.userId)
    .then((posts) => {
      res.render("profile", {
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        profilePosts: posts,
      });
    })
    .catch((err) => {
      res.render("404");
    });
};
