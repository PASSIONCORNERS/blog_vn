const Follow = require("../models/Follow");

exports.follow = (req, res) => {
  let follow = new Follow(req.params.userId, req.postOwner);
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
