const usersCollection = require("../db").collection("users");
const followsCollection = require("../db").collection("follows");
const User = require("./User");
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
  getFollowerById(id) {
    return new Promise(async (resolve, reject) => {
      try {
        let followers = await followsCollection
          .aggregate([
            { $match: { followedId: ObjectId(id) } },
            {
              $lookup: {
                from: "users",
                localField: "authorId",
                foreignField: "_id",
                as: "userDoc",
              },
            },
            {
              $project: {
                username: { $arrayElemAt: ["$userDoc.username", 0] },
                email: { $arrayElemAt: ["$userDoc.email", 0] },
                _id: { $arrayElemAt: ["$userDoc._id", 0] },
              },
            },
          ])
          .toArray();
        followers = followers.map((follower) => {
          let user = new User(follower, true);
          return {
            username: follower.username,
            avatar: user.avatar,
            _id: follower._id,
          };
        });
        resolve(followers);
      } catch {
        reject();
      }
    });
  }
  getFollowingById(id) {
    return new Promise(async (resolve, reject) => {
      try {
        let followings = await followsCollection
          .aggregate([
            { $match: { authorId: ObjectId(id) } },
            {
              $lookup: {
                from: "users",
                localField: "followedId",
                foreignField: "_id",
                as: "userDoc",
              },
            },
            {
              $project: {
                username: { $arrayElemAt: ["$userDoc.username", 0] },
                email: { $arrayElemAt: ["$userDoc.email", 0] },
                _id: { $arrayElemAt: ["$userDoc._id", 0] },
              },
            },
          ])
          .toArray();
        followings = followings.map((following) => {
          let user = new User(following, true);
          return {
            username: following.username,
            avatar: user.avatar,
            _id: following._id,
          };
        });
        resolve(followings);
      } catch {
        reject();
      }
    });
  }
  countFollower = function (id) {
    return new Promise(async (resolve, reject) => {
      let count = await followsCollection.countDocuments({
        followedId: ObjectId(id),
      });
      resolve(count);
    });
  };
  countFollowing = function (id) {
    return new Promise(async (resolve, reject) => {
      let count = await followsCollection.countDocuments({
        authorId: ObjectId(id),
      });
      resolve(count);
    });
  };
}
module.exports = Follow;
