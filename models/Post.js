const ObjectId = require("mongodb").ObjectId;
const postCollection = require("../db").collection("posts");
const User = require("./User");

// === Constructor ===
let Post = function (data, userId, postId) {
  this.data = data;
  this.userId = userId;
  this.errors = [];
  this.postId = postId;
};
// === Prototype ===
// sanitize
Post.prototype.cleanUp = function () {
  if (typeof this.data.title != "string") {
    this.data.title = "";
  }
  if (typeof this.data.body != "string") {
    this.data.body = "";
  }
  // only add our defined properties
  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    // need to allow created date
    createdDate: new Date(),
    // need to allow author id
    author: ObjectId(this.userId),
  };
};
// validate
Post.prototype.validate = function () {
  if (this.data.title == "") {
    this.errors.push("Please provide a title");
  }
  if (this.data.body == "") {
    this.errors.push("Please provide some content");
  }
};
// create
Post.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    try {
      // sanitize
      this.cleanUp();
      // validate
      this.validate();
      // sanitize & validate success
      if (!this.errors.length) {
        // save post
        postCollection
          .insertOne(this.data)
          .then((postInfo) => {
            // new post id
            resolve(postInfo.insertedId);
          })
          .catch((err) => {
            this.errors.push(err.message);
            reject(this.errors);
          });
      } else {
        reject(this.errors);
      }
    } catch (err) {
      reject(err);
    }
  });
};
// update
Post.prototype.editPost = function () {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.getSinglePost(this.postId, this.userId);
      if (post.postOwner) {
        let status = await this.updatePost();
        resolve(status);
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};
Post.prototype.updatePost = function () {
  return new Promise(async (resolve, reject) => {
    try {
      this.cleanUp();
      this.validate();
      if (!this.errors.length) {
        await postCollection.findOneAndUpdate(
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
};
// === Simple function ===
Post.deletePost = function (postId, postOwner) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.getSinglePost(postId, postOwner);
      if (post.postOwner) {
        await postCollection.deleteOne({ _id: ObjectId(postId) });
        resolve();
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};
Post.resuablePostQuery = function (operations, ownerId) {
  return new Promise(async (resolve, reject) => {
    try {
      // custom operations
      let aggOperations = operations.concat([
        {
          $lookup: {
            from: "users", // colection to relate
            localField: "author", // local field
            foreignField: "_id", // relate field
            as: "authorDocument", // match result
          },
        },
        {
          $project: {
            title: 1,
            body: 1,
            createdDate: 1,
            authorId: "$author",
            author: { $arrayElemAt: ["$authorDocument", 0] },
          },
        },
      ]);
      // perform aggregate
      let posts = await postCollection.aggregate(aggOperations).toArray();
      // filter out author field
      posts = posts.map((post) => {
        // post owner
        post.postOwner = post.authorId.equals(ownerId);
        // author
        post.author = {
          username: post.author.username,
          avatar: new User(post.author, true).avatar,
        };
        return post;
      });
      resolve(posts);
    } catch (err) {
      reject(err);
    }
  });
};
Post.getSinglePost = function (id, ownerId) {
  return new Promise(async (resolve, reject) => {
    try {
      // check id
      if (typeof id != "string" || !ObjectId.isValid(id)) {
        reject("Invalid actions");
        return;
      }
      // pass custom operations
      let posts = await Post.resuablePostQuery(
        [{ $match: { _id: ObjectId(id) } }],
        ownerId
      );
      // check post
      if (posts.length) {
        resolve(posts[0]);
      } else {
        reject("Post not found");
      }
    } catch (err) {
      reject(err.message);
    }
  });
};
Post.findAuthorPost = function (id) {
  return Post.resuablePostQuery([
    { $match: { author: ObjectId(id) } },
    { $sort: { createdDate: -1 } },
  ]);
};
module.exports = Post;

// === Note ===
// before resuable post query
// Post.getSinglePost = function (id) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // check id
//       if (typeof id != "string" || !ObjectId.isValid(id)) {
//         reject("Invalid actions");
//         return;
//       }
//       // get post
//       let posts = await postCollection
//         .aggregate([
//           // 1. find matching post id
//           { $match: { _id: ObjectId(id) } },
//           // 2. look up users collection to form relationship
//           {
//             $lookup: {
//               from: "users", // colection to relate
//               localField: "author", // local field
//               foreignField: "_id", // relate field
//               as: "authorDocument", // match result
//             },
//           },
//           // 3. custom return for 'as'
//           {
//             $project: {
//               title: 1,
//               body: 1,
//               createdDate: 1,
//               // merge author with authorDocument
//               author: { $arrayElemAt: ["$authorDocument", 0] },
//             },
//           },
//         ])
//         .toArray();
//       // filter out author field
//       posts = posts.map((post) => {
//         post.author = {
//           username: post.author.username,
//           // User model getAvatar
//           avatar: new User(post.author, true).avatar,
//         };
//         return post;
//       });
//       // check post
//       if (posts.length) {
//         // will return array of posts
//         // we just need the first one
//         resolve(posts[0]);
//       } else {
//         reject("Post not found");
//       }
//     } catch (err) {
//       reject(err.message);
//     }
//   });
// };
