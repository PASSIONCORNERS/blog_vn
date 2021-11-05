const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

// users related
router.get("/", userController.renderHome);
router.get("/register/activate/:token", userController.renderActivate);
router.post("/register/activate", userController.activate);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// profile related
router.get(
  "/profile/:userId",
  userController.findUser,
  userController.sharedProfile,
  userController.renderProfile
);
router.get(
  "/profile/:userId/followers",
  userController.findUser,
  userController.sharedProfile,
  userController.renderFollower
);
router.get(
  "/profile/:userId/followings",
  userController.findUser,
  userController.sharedProfile,
  userController.renderFollowing
);

// posts related
router.get(
  "/create-post",
  userController.loggedIn,
  postController.renderCreatePostScreen
);
router.get("/post/:id", postController.renderSinglePost);
router.post("/create-post", userController.loggedIn, postController.createPost);
router.get(
  "/post/:id/edit",
  userController.loggedIn,
  postController.renderEditPost
);
router.post("/post/:id/edit", userController.loggedIn, postController.editPost);
router.post(
  "/post/:id/delete",
  userController.loggedIn,
  postController.deletePost
);
router.post("/search", postController.search);

// follow related
router.post(
  "/addFollow/:userId",
  userController.loggedIn,
  followController.follow
);
router.post(
  "/removeFollow/:userId",
  userController.loggedIn,
  followController.unfollow
);

module.exports = router;
