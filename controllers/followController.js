const Follow = require("../models/Follow");

// follow
exports.follow = (req, res) => {
  let follow = new Follow(req.params.userId, req.currentUserId);
  follow
    .follow()
    .then(() => {
      req.flash("success", "Followed 😃");
      req.session.save(() => {
        res.redirect(`/profile/${req.params.userId}`);
      });
    })
    .catch((errors) => {
      errors.forEach((err) => {
        req.flash("errors", err);
      });
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// unfollow
exports.unfollow = (req, res) => {
  let follow = new Follow(req.params.userId, req.currentUserId);
  follow
    .unfollow()
    .then(() => {
      req.flash("success", "Unfollowed 😃");
      req.session.save(() => {
        res.redirect(`/profile/${req.params.userId}`);
      });
    })
    .catch((errors) => {
      errors.forEach((err) => {
        req.flash("errors", err);
        req.session.save(() => {
          res.redirect("/");
        });
      });
    });
};
