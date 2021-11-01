const dotenv = require("dotenv");
dotenv.config();
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

// === DB ===
MongoClient.connect(process.env.CONNECTIONSTRING, function (err, client) {
  const db = client.db("ComplexPractice");
  module.exports = db;
  console.log(">>> DB connected...");
  const app = require("./app");
  console.log(">>> APP listen...");
  app.listen(process.env.PORT);
  // default
  assert.equal(null, err);
  // client.close();
});
