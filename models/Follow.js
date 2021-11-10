const usersCollection = require("../db").collection("users");
const followsCollection = require("../db").collection("follows");
const User = require("./User");
const ObjectId = require("mongodb").ObjectId;

class Follow {
  constructor(followUserId, currentUserId) {
    this.followUserId = followUserId;
    this.currentUserId = currentUserId;
    this.errors = [];
  }
  // clean up
  cleanUp() {
    if (typeof this.followUserId != "string") {
      this.followUserId = "";
    }
  }
  // validate
  async validate(action) {
    // check user existence
    let followAccount = await usersCollection.findOne({
      _id: ObjectId(this.followUserId),
    });
    if (followAccount == "") {
      this.errors.push("Cannot find this user.");
    }
    // check if followed
    let isFollowed = await followsCollection.findOne({
      following: ObjectId(this.followUserId),
      follower: ObjectId(this.currentUserId),
    });
    if (action == "follow") {
      if (isFollowed) {
        this.errors.push("You already following this user.");
      }
    }
    if (action == "unfollow") {
      if (!isFollowed) {
        this.errors.push("You are not following this user.");
      }
    }
    // check self
    if (this.followUserId == this.currentUserId) {
      this.errors.push("You cannot follow yourself 😅");
    }
  }
  follow() {
    return new Promise(async (resolve, reject) => {
      try {
        this.cleanUp();
        await this.validate("follow");
        // no error
        if (!this.errors.length) {
          await followsCollection.insertOne({
            following: ObjectId(this.followUserId),
            follower: ObjectId(this.currentUserId),
          });
          resolve();
        } else {
          reject(this.errors);
        }
      } catch (err) {
        reject(err.message);
      }
    });
  }
  unfollow() {
    return new Promise(async (resolve, reject) => {
      try {
        this.cleanUp();
        await this.validate("unfollow");
        // no error
        if (!this.errors.length) {
          await followsCollection.deleteOne({
            following: ObjectId(this.followUserId),
            follower: ObjectId(this.currentUserId),
          });
          resolve();
        } else {
          reject(this.errors);
        }
      } catch (err) {
        reject(err.message);
      }
    });
  }
  isFollowing(followUserId, currentUserId) {
    return new Promise(async (resolve, reject) => {
      try {
        let followDoc = await followsCollection.findOne({
          following: ObjectId(followUserId),
          follower: ObjectId(currentUserId),
        });
        // if followDoc return a document that mean current user is following this profile
        if (followDoc) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err) {
        reject(err.message);
      }
    });
  }
  followerCount(profileId) {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await followsCollection.countDocuments({
          // following because how many follower is following you
          following: ObjectId(profileId),
        });
        resolve(count);
      } catch (err) {
        reject(err.message);
      }
    });
  }
  followingCount(profileId) {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await followsCollection.countDocuments({
          // follower because how many user YOU ARE following
          follower: ObjectId(profileId),
        });
        resolve(count);
      } catch (err) {
        reject(err.message);
      }
    });
  }
  getFollower(profileId) {
    return new Promise(async (resolve, reject) => {
      try {
        // aggregate
        let followers = await followsCollection
          .aggregate([
            { $match: { following: ObjectId(profileId) } },
            {
              $lookup: {
                from: "users",
                localField: "follower",
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
          // get avatar
          let user = new User(follower, true);
          return {
            username: follower.username,
            _id: follower._id,
            avatar: user.avatar,
          };
        });
        resolve(followers);
      } catch (err) {
        reject(err.message);
      }
    });
  }
  getFollowing(profileId) {
    return new Promise(async (resolve, reject) => {
      try {
        // aggregate
        let followings = await followsCollection
          .aggregate([
            { $match: { follower: ObjectId(profileId) } },
            {
              $lookup: {
                from: "users",
                localField: "following",
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
          // get avatar
          let user = new User(following, true);
          return {
            username: following.username,
            _id: following._id,
            avatar: user.avatar,
          };
        });
        resolve(followings);
      } catch (err) {
        reject(err.message);
      }
    });
  }
}

module.exports = Follow;
