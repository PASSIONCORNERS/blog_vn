const ObjectId = require("mongodb").ObjectId;
const postsCollection = require("../db").collection("posts");
const followsCollection = require("../db").collection("follows");
const User = require("../models/User");

class Post {
  constructor(data, authorId, postId) {
    this.data = data;
    this.authorId = authorId;
    this.postId = postId;
    this.errors = [];
  }
  // cleanup
  cleanUp() {
    if (typeof this.data.title != "string") {
      this.data.title = "";
    }
    if (typeof this.data.body != "string") {
      this.data.body = "";
    }
    // add to data properties
    this.data = {
      title: this.data.title.trim(),
      body: this.data.body.trim(),
      // addtional fields
      createdDate: new Date(),
      author: ObjectId(this.authorId),
    };
  }
  // validate
  validate() {
    if (this.data.title == "") {
      this.errors.push("Please provide a title");
    }
    if (this.data.body == "") {
      this.errors.push("Please provide some content");
    }
  }
  // resuable query
  resuablePostQuery(operation, ownerId, finalOperation = []) {
    return new Promise(async (resolve, reject) => {
      try {
        // custom operation conact with repeat operation
        let repeatOperations = operation
          .concat([
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorDetail",
              },
            },
            {
              $project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: { $arrayElemAt: ["$authorDetail", 0] },
              },
            },
          ])
          .concat(finalOperation);
        // perform the aggregation
        let posts = await postsCollection.aggregate(repeatOperations).toArray();
        // filter out result
        posts = posts.map((post) => {
          // post owner
          post.postOwner = post.authorId.equals(ownerId);
          // author
          post.author = {
            username: post.author.username,
            avatar: new User(post.author, true).avatar,
            _id: post.author._id,
          };
          return post;
        });
        resolve(posts);
      } catch (err) {
        reject(err.message);
      }
    });
  }
  // create
  create() {
    return new Promise(async (resolve, reject) => {
      try {
        // cleanup
        this.cleanUp();
        // validate
        this.validate();
        if (!this.errors.length) {
          // save post
          postsCollection
            .insertOne(this.data)
            .then((newPost) => {
              resolve(newPost.insertedId);
            })
            .catch((err) => {
              this.errors.push(err.message);
              reject(this.errors);
            });
        } else {
          reject(this.errors);
        }
      } catch (err) {
        reject(err.message);
      }
    });
  }
  // read (single post)
  readSingle(postId, currentUserId) {
    return new Promise(async (resolve, reject) => {
      try {
        // check post id
        if (typeof postId != "string" || !ObjectId.isValid(postId)) {
          this.errors.push("Invalid request");
          reject(this.errors);
          // end function
          return;
        }
        // use resuablePostQuery
        let posts = await this.resuablePostQuery(
          [{ $match: { _id: ObjectId(postId) } }],
          currentUserId
        );
        // check post existence
        if (posts.length) {
          resolve(posts[0]);
        } else {
          reject("Post not found");
        }
      } catch (err) {
        reject(err.message);
      }
    });
  }
  // update
  update() {
    return new Promise(async (resolve, reject) => {
      try {
        this.cleanUp();
        this.validate();
        if (!this.errors.length) {
          await postsCollection.findOneAndUpdate(
            { _id: ObjectId(this.postId) },
            {
              $set: {
                title: this.data.title,
                body: this.data.body,
              },
            }
          );
          resolve("success");
        } else {
          resolve("failed");
        }
      } catch {
        resolve("failed");
      }
    });
  }
  // delete
  delete(postId, currentUserId) {
    return new Promise(async (resolve, reject) => {
      try {
        let post = await this.readSingle(postId, currentUserId);
        if (post.postOwner) {
          await postsCollection.deleteOne({ _id: ObjectId(postId) });
          resolve();
        } else {
          reject();
        }
      } catch (err) {
        reject(err);
      }
    });
  }
  // find profile post
  async findProfilePost(profileId) {
    let posts = await this.resuablePostQuery([
      { $match: { author: ObjectId(profileId) } },
      { $sort: { createdDate: -1 } },
    ]);
    return posts;
  }
  // post count
  postCount(profileId) {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await postsCollection.countDocuments({
          author: ObjectId(profileId),
        });
        resolve(count);
      } catch (err) {
        reject(err.message);
      }
    });
  }
  // search
  search(searchTerm) {
    return new Promise(async (resolve, reject) => {
      // check search term
      if (typeof searchTerm == "string") {
        // look in db
        let posts = await this.resuablePostQuery(
          // 1st operation
          [{ $match: { $text: { $search: searchTerm } } }],
          // ownerId (don't need)
          undefined,
          // finalOperation
          [{ $sort: { score: { $meta: "textScore" } } }]
        );
        resolve(posts);
      } else {
        reject();
      }
    });
  }
  // get feed
  getFeed(currentUserId) {
    return new Promise(async (resolve, reject) => {
      try {
        // get following
        let followingUser = await followsCollection
          .find({ follower: ObjectId(currentUserId) })
          .toArray();
        followingUser = followingUser.map((doc) => {
          return doc.following;
        });
        // get following post
        let posts = this.resuablePostQuery([
          { $match: { author: { $in: followingUser } } },
          { $sort: { createdDate: -1 } },
        ]);
        resolve(posts);
      } catch {
        reject();
      }
    });
  }
}

module.exports = Post;

// notes
// read (single post)
// readSingle(postId, currentUserId) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // check post id
//       if (typeof postId != "string" || !ObjectId.isValid(postId)) {
//         this.errors.push("Invalid request");
//         reject(this.errors);
//         // end function
//         return;
//       }
//       // query post
//       let posts = await postsCollection
//         .aggregate([
//           { $match: { _id: ObjectId(postId) } },
//           {
//             $lookup: {
//               from: "users",
//               localField: "author",
//               foreignField: "_id",
//               as: "authorDetail",
//             },
//           },
//           {
//             $project: {
//               title: 1,
//               body: 1,
//               createdDate: 1,
//               authorId: "$author",
//               author: { $arrayElemAt: ["$authorDetail", 0] },
//             },
//           },
//         ])
//         .toArray();
//       posts = posts.map((post) => {
//         // set post owner for delete
//         post.postOwner = post.authorId.equals(currentUserId);
//         // overwrite author return
//         post.author = {
//           username: post.author.username,
//           avatar: new User(post.author, true).avatar,
//           _id: post.author._id,
//         };
//         return post;
//       });
//       // check post existence
//       if (posts.length) {
//         resolve(posts[0]);
//       } else {
//         reject("Post not found");
//       }
//     } catch (err) {
//       reject(err.message);
//     }
//   });
// }
