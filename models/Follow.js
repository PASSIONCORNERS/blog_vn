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
  async validate() {
    // check user
    let followedAccount = await usersCollection.findOne({
      _id: ObjectId(this.followedUserId),
    });
    if (followedAccount) {
      return followedAccount;
    } else {
      this.errors.push("Cannot find user.");
    }
  }
  create() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp();
      await this.validate();
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

  // create() {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       this.cleanUp();
  //       await this.validate();
  //       if (!this.errors.length) {
  //         let test = await followsCollection
  //           .aggregate([
  //             {
  //               $set: {
  //                 isFollowing: ObjectId(this.followedUserId),
  //                 authorId: ObjectId(this.authorId),
  //               },
  //             },
  //             // {
  //             //   $match: {
  //             //     followedId: ObjectId(followedId),
  //             //     authorId: ObjectId(visitorId),
  //             //   },
  //             // },

  //             // {
  //             //   $lookup: {
  //             //     from: "users", // colection to relate
  //             //     localField: "followedId", // local field
  //             //     foreignField: "_id", // relate field
  //             //     as: "followedUsername", // match result
  //             //   },
  //             // },

  //             // {
  //             //   $project: {
  //             //     // merge author with authorDocument
  //             //     author: { $arrayElemAt: ["$followedUsername", 0] },
  //             //   },
  //             // },
  //           ])
  //           .toArray();

  //         resolve(test);
  //       } else {
  //         reject(this.errors);
  //       }
  //     } catch {
  //       reject(this.errors);
  //     }
  //   });
  // }

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
    // return new Promise(async (resolve, reject) => {
    //   try {
    //     // get post
    //     let usernames = await followsCollection
    //       .aggregate([
    //         // 1. find matching post id
    //         {
    //           $match: {
    //             followedId: ObjectId(followedId),
    //             authorId: ObjectId(visitorId),
    //           },
    //         },
    //         // 2. look up users collection to form relationship
    //         {
    //           $lookup: {
    //             from: "users", // colection to relate
    //             localField: "followedId", // local field
    //             foreignField: "_id", // relate field
    //             as: "followedUsername", // match result
    //           },
    //         },
    //         // 3. custom return for 'as'
    //         {
    //           $project: {
    //             // merge author with authorDocument
    //             author: { $arrayElemAt: ["$followedUsername", 0] },
    //           },
    //         },
    //       ])
    //       .toArray();
    //     // filter out returned project
    //     usernames = usernames.map((name) => {
    //       name.author = {
    //         username: name.author.username,
    //       };
    //       return name;
    //     });
    //     console.log("from Model", usernames);
    //     // check post
    //     if (usernames.length) {
    //       // will return array of usernames
    //       // we just need the first one
    //       resolve(usernames[0]);
    //     } else {
    //       reject(false);
    //     }
    //   } catch {
    //     reject(false);
    //   }
    // });
  }
}
module.exports = Follow;
