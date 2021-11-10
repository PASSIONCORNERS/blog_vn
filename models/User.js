const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.SENDGRID);
const md5 = require("md5");
const ObjectId = require("mongodb").ObjectId;
const usersCollection = require("../db").collection("users");

// === Constructor ===
let User = function (data, getAvatar) {
  this.data = data;
  this.errors = [];
  if (getAvatar == undefined) {
    getAvatar = false;
  }
  if (getAvatar) {
    this.getAvatar();
  }
};
// === Prototype ===
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
    username: this.data.username,
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
  };
};
// validate
User.prototype.validate = function () {
  // check username
  if (this.data.username == "") {
    this.errors.push("Please enter a username.");
  }
  // only characters
  if (!validator.isAlphanumeric(this.data.username)) {
    this.errors.push(
      "Username can only contains letter, number, and no spaces."
    );
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
};
// register
User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    try {
      // sanitize
      this.cleanUp();
      // validate
      this.validate();
      // check email
      let checkEmail = await usersCollection.findOne({
        email: this.data.email,
      });
      if (checkEmail) {
        this.errors.push("That email is already taken.");
        reject(this.errors);
      }
      if (!this.errors.length) {
        // hash pass
        let salt = bcrypt.genSaltSync(10);
        this.data.password = bcrypt.hashSync(this.data.password, salt);
        // gen token
        const regUser = {
          username: this.data.username,
          email: this.data.email,
          password: this.data.password,
        };
        const activation_token = jwt.sign(
          regUser,
          process.env.ACTIVATIONTOKEN,
          { expiresIn: "5m" }
        );
        // send email
        const url = `http://localhost:3000/register/activate/${activation_token}`;
        sendgrid
          .send({
            to: this.data.email,
            from: "phong@passioncorners.com",
            subject: "Welcome To Blog VN 🤗",
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
                  color: rgb(99, 102, 241);
                }
                button {
                  padding: 1em 6em;
                  border-radius: 5px;
                  border: 0;
                  background-color: rgba(99, 102, 241, 1);
                  transition: all 0.3s ease-in;
                  cursor: pointer;
                }
                button:hover {
                  background-color: rgba(99, 102, 241, 0.8);
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
            // console.log("Email sent");
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
      // verify token
      let regUser = jwt.verify(this.data, process.env.ACTIVATIONTOKEN);
      // check user again
      const { username, email, password } = regUser;
      const check = await usersCollection.findOne({ email });
      if (check) {
        this.errors.push("This email is already registered 😕");
        reject(this.errors);
      } else {
        // add user to db
        const newUser = { username, email, password };
        await usersCollection.insertOne(newUser);
        // success
        resolve();
      }
    } catch (err) {
      reject(err.message);
    }
  });
};
// login
User.prototype.login = function () {
  return new Promise((resolve, reject) => {
    try {
      this.cleanUp();
      // find user
      usersCollection
        .findOne({ email: this.data.email })
        .then((result) => {
          // check password
          if (
            result &&
            bcrypt.compareSync(this.data.password, result.password)
          ) {
            this.getAvatar();
            resolve(result);
          } else {
            this.errors.push("Invalid credentials.");
            reject(this.errors);
          }
        })
        .catch((err) => {
          reject(err.message);
        });
    } catch (err) {
      reject(err.message);
    }
  });
};
// avatar
User.prototype.getAvatar = function () {
  // add to constructor data
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}/?s=128`;
};
// find user
User.prototype.findUser = function (userId) {
  return new Promise((resolve, reject) => {
    try {
      // check id
      if (typeof userId != "string") {
        reject();
        return;
      }
      // check db
      usersCollection
        .findOne({ _id: ObjectId(userId) })
        .then((user) => {
          // pass user to constructor
          user = new User(user, true);
          // filter user data
          user = {
            _id: user.data._id,
            username: user.data.username,
            avatar: user.avatar,
          };
          resolve(user);
        })
        .catch((err) => {
          reject(err.message);
        });
    } catch (err) {
      reject(err.message);
    }
  });
};
module.exports = User;
