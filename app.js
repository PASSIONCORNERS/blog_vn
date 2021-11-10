const express = require("express");
const router = require("./routes");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const csrf = require("csurf");

// === Express ===
const app = express();
// data to req obj
app.use(express.urlencoded({ extended: false }));
// enable json
app.use(express.json());

// === Session ===
let sessionOptions = session({
  secret: process.env.SESSIONSECRET,
  store: MongoStore.create({ mongoUrl: process.env.CONNECTIONSTRING }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, //24hrs
    httpOnly: true,
  },
});

// === App Use ===
app.use(sessionOptions);
app.use(flash());
app.use(express.static("public"));

// === CSRF ===
app.use(csrf());
app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use(function (err, req, res, next) {
  if (err) {
    if (err.code == "EBADCSRFTOKEN") {
      req.flash("errors", "Cross site request forgery detected");
      req.session.save(() => {
        res.redirect("/");
      });
    } else {
      res.render("404");
    }
  }
});

// === MW ===
app.use(function (req, res, next) {
  // make flash global
  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");
  // get current user Id
  if (req.session.user) {
    req.currentUserId = req.session.user._id;
  } else {
    req.currentUserId = 0;
  }
  // make user global
  res.locals.user = req.session.user;
  next();
});

// === Template Engine ===
app.set("views", "views");
app.set("view engine", "ejs");

// === Routes ===
app.use("/", router);

module.exports = app;
