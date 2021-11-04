const Follow = require("../models/Follow");

exports.follow = (req, res) => {
  let follow = new Follow(req.params.userId, req.postOwner);
  console.log("Params", req.params.userId);
  console.log("Post Owner", req.postOwner);
  follow
    .create()
    .then(() => {
      req.flash("success", `Followed 😃`);
      req.session.save(() => {
        res.redirect(`/profile/${req.params.userId}`);
      });
    })
    .catch((errors) => {
      errors.forEach((error) => {
        req.flash("errors", error);
      });
      req.session.save(() => res.redirect("/"));
    });
};
exports.unfollow = (req, res) => {
  let follow = new Follow(req.params.userId, req.postOwner);
  follow
    .delete()
    .then(() => {
      req.flash("success", `Unfollowed`);
      req.session.save(() => {
        res.redirect(`/profile/${req.params.userId}`);
      });
    })
    .catch((errors) => {
      errors.forEach((error) => {
        req.flash("errors", error);
      });
      req.session.save(() => res.redirect("/"));
    });
};
