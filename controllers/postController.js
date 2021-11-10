const Post = require("../models/Post");

// create
exports.create = (req, res) => {
  // console.log(req.session.user._id);
  new Post(req.body, req.session.user._id)
    .create()
    .then((newPost) => {
      req.flash("success", "Post was created 😃");
      req.session.save(() => {
        res.redirect(`/post/${newPost}`);
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
exports.update = (req, res) => {
  let post = new Post(req.body, req.currentUserId, req.params.id);
  post
    .update()
    .then((status) => {
      if (status == "success") {
        req.flash("success", "Post successfully updated 👌🏻");
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/update`);
        });
      } else {
        post.errors.forEach((err) => {
          req.flash("errors", err);
          req.session.save(() => {
            res.redirect(`/post/${req.params.id}/update`);
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
exports.delete = (req, res) => {
  new Post()
    .delete(req.params.id, req.currentUserId)
    .then(() => {
      req.flash("success", "Post was deleted.");
      req.session.save(() => {
        // res.redirect(`/profile/${req.currentUserId}`);
        res.redirect("/");
      });
    })
    .catch(() => {
      req.flash("errors", "Permission denied 🛑");
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// search
exports.search = (req, res) => {
  new Post()
    .search(req.body.searchTerm)
    .then((posts) => {
      res.json(posts);
    })
    .catch(() => {
      // res.json([]);
      res.send([]);
    });
};
// render
exports.renderCreatePost = (req, res) => {
  res.render("create-post");
};
exports.renderSinglePost = (req, res) => {
  let currentUserId = req.currentUserId;
  new Post()
    // currentUserId for updating
    .readSingle(req.params.id, currentUserId)
    .then((post) => {
      res.render("single-post", { post });
    })
    .catch((err) => {
      req.flash("errors", err);
      req.session.save(() => {
        res.render("404");
        // res.redirect("/");
      });
    });
};
exports.renderUpdatePost = (req, res) => {
  new Post()
    .readSingle(req.params.id)
    .then((post) => {
      if (req.currentUserId == post.author._id) {
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
