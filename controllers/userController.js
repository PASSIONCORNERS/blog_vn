const ObjectId = require("mongodb").ObjectId;
const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");

// register
exports.register = (req, res) => {
  // use model
  new User(req.body)
    .register()
    .then(() => {
      req.flash("success", "Please check your emai 📧 ");
      req.session.save(() => {
        res.redirect("/");
      });
    })
    .catch((err) => {
      req.flash("errors", err);
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// activate
exports.activate = (req, res) => {
  new User(req.session.token)
    .activate()
    .then(() => {
      req.flash("success", "Account activated, you can now log in 😃");
      req.session.save(() => {
        res.redirect("/");
      });
      // destroy token
      req.session.destroy();
    })
    .catch((err) => {
      req.flash("errors", err.message);
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// login
exports.login = (req, res) => {
  let user = new User(req.body);
  user
    .login()
    .then((result) => {
      // pass user data to session
      req.session.user = {
        username: result.username,
        _id: result._id,
        avatar: user.avatar,
      };
      req.session.save(() => {
        res.redirect("/");
      });
    })
    .catch((err) => {
      // not err.message because it's from error arrays
      req.flash("errors", err);
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
// loggedIn
exports.loggedIn = async (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "Please login");
    req.session.save(function () {
      res.redirect("/");
    });
  }
};
// find User
exports.findUser = (req, res, next) => {
  new User()
    .findUser(req.params.userId)
    .then((userProfile) => {
      req.profileUser = userProfile;
      next();
    })
    .catch((err) => {
      console.log(err);
      res.render("404");
    });
};
// share profile data
exports.shareProfileData = async (req, res, next) => {
  // get is following & is profile
  let isFollowing = false;
  let isProfile = false;
  if (req.session.user) {
    new Follow()
      .isFollowing(req.params.userId, req.currentUserId)
      .then((value) => {
        // get isFollowing value
        isFollowing = value;
        // get isProfile value
        isProfile = ObjectId(req.params.userId).equals(
          ObjectId(req.currentUserId)
        );
        // pass isFollowing value to req
        req.isFollowing = isFollowing;
        // pass isProfile value to req
        req.isProfile = isProfile;
      })
      .catch((err) => {
        console.log(err);
        next(false);
      });
  }
  // get counts for Tab
  let postCountPromise = new Post().postCount(
    // from findUser mw
    req.profileUser._id
  );
  let followerCountPromise = new Follow().followerCount(req.profileUser._id);
  let followingCountPromise = new Follow().followingCount(req.profileUser._id);
  let [postCount, followerCount, followingCount] = await Promise.all([
    postCountPromise,
    followerCountPromise,
    followingCountPromise,
  ]);
  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;
  next();
};
// renders
exports.renderHome = (req, res) => {
  if (req.session.user) {
    new Post()
      .getFeed(req.currentUserId)
      .then((posts) => {
        res.render("dashboard", { posts });
      })
      .catch(() => {
        res.render("signup");
      });
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
    req.flash("errors", "Please register again.");
    req.session.save(() => {
      res.render("/");
    });
  }
};
exports.renderProfile = (req, res) => {
  new Post()
    .findProfilePost(req.params.userId)
    .then((posts) => {
      res.render("profile", {
        currentPage: "profile",
        profilePosts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        profileUserId: req.profileUser._id,
        isFollowing: req.isFollowing,
        isProfile: req.isProfile,
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.render("404");
    });
};
exports.renderFollower = (req, res) => {
  new Follow()
    .getFollower(req.profileUser._id)
    .then((followers) => {
      res.render("followers", {
        currentPage: "followers",
        followers: followers,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        profileUserId: req.profileUser._id,
        isFollowing: req.isFollowing,
        isProfile: req.isProfile,
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount,
        },
      });
    })
    .catch((err) => {
      console.log(err.message);
      res.render("404");
    });
};
exports.renderFollowing = (req, res) => {
  new Follow()
    .getFollowing(req.profileUser._id)
    .then((followings) => {
      res.render("followings", {
        currentPage: "followings",
        followings: followings,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        profileUserId: req.profileUser._id,
        isFollowing: req.isFollowing,
        isProfile: req.isProfile,
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount,
        },
      });
    })
    .catch((err) => {
      console.log(err.message);
      res.render("404");
    });
};
