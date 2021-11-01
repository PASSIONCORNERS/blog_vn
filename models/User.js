const bcrypt = require("bcryptjs");
const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.SENDGRID);
const jwt = require("jsonwebtoken");
const validator = require("validator");
const md5 = require("md5");
const usersCollection = require("../db").collection("users");
const createToken = require("../utils/token");
const { ObjectId } = require("bson");

// ==== Constructor ====
let User = function (data, getAvatar) {
  this.data = data;
  this.errors = [];
  // get avatar from outside
  if (getAvatar == undefined) {
    getAvatar = false;
  }
  if (getAvatar) {
    this.getAvatar();
  }
};
// ==== Prototyp ====
// sanitize
User.prototype.cleanUp = function () {
  // only string
  if (typeof this.data.username != "string") {
    this.data.username = "";
  }
  if (typeof this.data.email != "string") {
    this.data.email = "";
  }
  if (typeof this.data.password != "string") {
    this.data.password = "";
  }
  // only related data
  this.data = {
    username: this.data.username.trim(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
  };
};
// validate
User.prototype.validate = function () {
  return new Promise(async (resolve, reject) => {
    // check username
    if (this.data.username == "") {
      this.errors.push("Please enter a username.");
    }
    // check username characters
    if (!validator.isAlphanumeric(this.data.username)) {
      this.errors.push("Username can only contains letters and numbers.");
    }
    // check username length
    if (this.data.username.length > 0 && this.data.username.length < 3) {
      this.errors.push("Username must be at least 3 characters.");
    }
    // check username max
    if (this.data.username.length > 30) {
      this.errors.push("Username cannot exceed 30 characters.");
    }
    // check email
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("Please enter a valid email address.");
    }
    // check existing email
    if (validator.isEmail(this.data.email)) {
      let emailExists = await usersCollection.findOne({
        email: this.data.email,
      });
      if (emailExists) {
        this.errors.push("That email is already taken.");
      }
    }
    // check password
    if (this.data.password == "") {
      this.errors.push("Please enter a password.");
    }
    // check password min
    if (this.data.password.length > 0 && this.data.password.length < 6) {
      this.errors.push("Password must be at least 6 characters.");
    }
    // check password max
    if (this.data.password.length > 50) {
      this.errors.push("Password cannot exceed 50 characters.");
    }
    resolve();
  });
};
// register
User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    try {
      // sanitize
      this.cleanUp();
      // validate
      await this.validate();
      // pass validate
      if (!this.errors.length) {
        //hash password
        let salt = bcrypt.genSaltSync(10);
        this.data.password = bcrypt.hashSync(this.data.password, salt);
        // token
        const regUser = {
          username: this.data.username,
          email: this.data.email,
          password: this.data.password,
        };
        const activation_token = createToken.activation(regUser);
        // send email token
        const url = `http://localhost:3000/register/activate/${activation_token}`;
        sendgrid
          .send({
            to: this.data.email,
            from: "phong@passioncorners.com",
            subject: "Welcome To Passioncorners 🤗",
            text: `Please validate your email by clicking this link ${url}`,
            html: `
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link
              href="https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap"
              rel="stylesheet"
            />
            <title>Passioncorners | Account Activation</title>
            <style>
              body {
                background-color: #333333;
                height: 100vh;
                font-family: "Roboto", sans-serif;
                color: #fff;
                position: relative;
                text-align: center;
              }
              .container {
                max-width: 700px;
                width: 100%;
                height: 100%;
                margin: 0 auto;
              }
              .wrapper {
                padding: 0 15px;
              }
              .card {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100%;
              }
              span {
                color: #ffc107;
              }
              button {
                padding: 1em 6em;
                border-radius: 5px;
                border: 0;
                background-color: hsl(45, 100%, 51%);
                transition: all 0.3s ease-in;
                cursor: pointer;
              }
              button:hover {
                background-color: hsl(45, 70%, 51%);
                transition: all 0.3s ease-in;
              }
              .spacing {
                margin-top: 5rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="wrapper">
                <div class="card">
                  <h1><span>Welcome !</span> And thank you for registering !</h1>
                  <p>Please validate your email by clicking the button below 🙂</p>
                  <a href=${url}><button>Confirm Email</button></a>
                  <p class="spacing">
                    If the button above does not work, please navigate to the link
                    provided below 👇🏻
                  </p>
                  <div>${url}</div>
                </div>
              </div>
            </div>
          </body>
        </html>
          `,
          })
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => console.log(error.response.body));
        // success
        resolve();
      } else {
        reject(this.errors);
      }
    } catch (err) {
      reject(err.message);
    }
  });
};
// activate
User.prototype.activate = function () {
  return new Promise(async (resolve, reject) => {
    try {
      // // verify token
      const user = jwt.verify(this.data, process.env.ACTIVATION_TOKEN);
      const { username, email, password } = user;
      // // check user
      const check = await usersCollection.findOne({ email });
      if (check) {
        this.errors.push("This email is already registered.");
        reject(this.errors);
      }
      // add user to db
      const newUser = { username, email, password };
      await usersCollection.insertOne(newUser);
      // get avatar
      this.getAvatar();
      // success
      resolve();
    } catch (err) {
      reject(err.message);
    }
  });
};
// login
User.prototype.login = function () {
  return new Promise(async (resolve, reject) => {
    try {
      // sanitize
      this.cleanUp();
      // check email
      await usersCollection
        .findOne({ email: this.data.email })
        .then((result) => {
          if (result && bcrypt.compare(this.data.password, result.password)) {
            this.data = result;
            // get avatar
            this.getAvatar();
            resolve("Success");
          } else {
            reject("Invalid credentials");
          }
        })
        .catch((err) => {
          console.log(err.message);
        });
    } catch (err) {
      reject(err.message);
    }
  });
};
// avatar
User.prototype.getAvatar = function () {
  // add to construtor
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}/?s=128`;
};
// === Simple function ===
User.findUser = function (userId) {
  return new Promise((resolve, reject) => {
    // check id
    if (typeof userId != "string") {
      reject();
      return;
    }
    usersCollection
      .findOne({ _id: ObjectId(userId) })
      .then((result) => {
        // filter result
        result = new User(result, true);
        result = {
          _id: result.data._id,
          username: result.data.username,
          avatar: result.avatar,
        };
        resolve(result);
      })
      .catch((err) => {
        reject(err.message);
      });
  });
};
module.exports = User;
