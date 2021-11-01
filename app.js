const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

// === Express ===
const app = express();
app.use(express.urlencoded({ extended: false }));
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
app.use(express.static("public"));
app.use(flash());
// === MW ===
app.use(function (req, res, next) {
  // make flash available
  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");
  // make visitor id available in the request object
  if (req.session.user) {
    req.postOwner = req.session.user._id;
  } else {
    req.postOwner = 0;
  }
  // make user available
  res.locals.user = req.session.user;
  next();
});

// === Template Engine ===
app.set("views", "views");
app.set("view engine", "ejs");

// === Listen ===
const router = require("./routes");
app.use("/", router);

module.exports = app;
