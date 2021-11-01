const Post = require("../models/Post");

// create
exports.createPost = (req, res) => {
  // pass post data & author id
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then((newId) => {
      req.flash("success", "Post was created 😃");
      req.session.save(() => {
        res.redirect(`/post/${newId}`);
      });
    })
    .catch((err) => {
      req.flash("errors", err);
      req.session.save(() => {
        res.redirect("/create-post");
      });
    });
};
// update
exports.editPost = (req, res) => {
  let post = new Post(req.body, req.postOwner, req.params.id);
  post
    .editPost()
    .then((status) => {
      if (status == "success") {
        req.flash("success", "Post successfully updated 👌🏻");
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/edit`);
        });
      } else {
        post.errors.forEach((error) => {
          req.flash("errors", err);
          req.session.save(() => {
            res.redirect(`/post/${req.params.id}/edit`);
          });
        });
      }
    })
    .catch(() => {
      req.flash("errors", "Permision denied 🛑");
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// delete
exports.deletePost = (req, res) => {
  Post.deletePost(req.params.id, req.postOwner)
    .then(() => {
      req.flash("success", "Post was deleted.");
      req.session.save(() => {
        res.redirect(`/profile/${req.postOwner}`);
      });
    })
    .catch(() => {
      req.flash("errors", "Permission denied 🛑");
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// render
exports.renderCreatePostScreen = (req, res) => {
  res.render("create-post");
};
exports.renderSinglePost = (req, res) => {
  let ownerId = req.postOwner;
  Post.getSinglePost(req.params.id, ownerId)
    .then((post) => {
      res.render("single-post", { post });
    })
    .catch((err) => {
      req.flash("errors", err.message);
      req.session.save(function () {
        res.render("404");
      });
    });
  // diff syntax
  // try {
  //   let post = await Post.getSinglePost(req.params.id);
  //   res.render("single-post", { post });
  // } catch {
  //   res.send("Not Found");
  // }
};
exports.renderEditPost = (req, res) => {
  Post.getSinglePost(req.params.id)
    .then((post) => {
      // if (post.authorId == req.postOwner) {
      if (req.postOwner) {
        res.render("edit-post", { post });
      } else {
        req.flash("errors", "Permission denied 🛑");
        req.session.save(() => {
          res.redirect("/");
        });
      }
    })
    .catch(() => {
      res.render("404");
    });
};
