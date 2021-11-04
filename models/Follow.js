const usersCollection = require("../db").collection("users");
const followsCollection = require("../db").collection("follows");
const ObjectId = require("mongodb").ObjectId;

class Follow {
  constructor(followedUserId, authorId) {
    this.followedUserId = followedUserId;
    this.authorId = authorId;
    this.errors = [];
  }
  cleanUp() {
    if (typeof this.followedUserId != "string") {
      this.followedUserId = "";
    }
  }
  async validate(action) {
    // check user
    let followedAccount = await usersCollection.findOne({
      _id: ObjectId(this.followedUserId),
    });
    if (followedAccount == "") {
      this.errors.push("Cannot find user.");
    }
    // check if followed
    let isFollowed = await followsCollection.findOne({
      followedId: ObjectId(this.followedUserId),
      authorId: ObjectId(this.authorId),
    });
    if (action == "follow") {
      if (isFollowed) {
        this.errors.push("Already following.");
      }
    }
    if (!action == "unfollow") {
      if (isFollowed) {
        this.errors.push("Invalid action.");
      }
    }
    // cannot follow yourself
    if (this.followedUserId == this.authorId) {
      this.errors.push("You cannot follow yourself 😅");
    }
  }
  create() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp();
      await this.validate("follow");
      if (!this.errors.length) {
        await followsCollection.insertOne({
          followedId: ObjectId(this.followedUserId),
          authorId: ObjectId(this.authorId),
        });
        console.log("Errors", this.errors);
        resolve();
      } else {
        reject(this.errors);
      }
    });
  }
  delete() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp();
      await this.validate("unfollow");
      if (!this.errors.length) {
        await followsCollection.deleteOne({
          followedId: ObjectId(this.followedUserId),
          authorId: ObjectId(this.authorId),
        });
        resolve();
      } else {
        reject(this.errors);
      }
    });
  }

  async isFollowing(followedId, visitorId) {
    let followDoc = await followsCollection.findOne({
      followedId: ObjectId(followedId),
      authorId: ObjectId(visitorId),
    });
    if (followDoc) {
      return true;
    } else {
      return false;
    }
  }
}
module.exports = Follow;
