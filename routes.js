const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");

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
  userController.renderProfile
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

module.exports = router;
