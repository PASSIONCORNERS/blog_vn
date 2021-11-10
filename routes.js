const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

// user related
router.get("/", userController.renderHome);
router.post("/register", userController.register);
router.get("/register/activate/:token", userController.renderActivate);
router.post("/register/activate", userController.activate);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get(
  "/profile/:userId/followers",
  userController.findUser,
  userController.shareProfileData,
  userController.renderFollower
);
router.get(
  "/profile/:userId/followings",
  userController.findUser,
  userController.shareProfileData,
  userController.renderFollowing
);

// post related
router.get(
  "/create-post",
  userController.loggedIn,
  postController.renderCreatePost
);
router.post("/create-post", userController.loggedIn, postController.create);
router.get("/post/:id", postController.renderSinglePost);
router.get(
  "/post/:id/update",
  userController.loggedIn,
  postController.renderUpdatePost
);
router.post("/post/:id/update", userController.loggedIn, postController.update);
router.post("/post/:id/delete", userController.loggedIn, postController.delete);
router.post("/search", postController.search);

// profile related
router.get(
  "/profile/:userId",
  userController.findUser,
  userController.shareProfileData,
  userController.renderProfile
);

// follow related
router.post(
  "/follow/:userId",
  userController.loggedIn,
  followController.follow
);
router.post(
  "/unfollow/:userId",
  userController.loggedIn,
  followController.unfollow
);

module.exports = router;
