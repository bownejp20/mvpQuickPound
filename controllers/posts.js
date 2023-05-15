const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const {Types} = require("mongoose");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      console.log(req.params.id)
      const post = await Post.aggregate( [
        { $match : { _id : Types.ObjectId(req.params.id) } },
        {
          $lookup:
              {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
              }
        },
        {
          $unwind: "$user",
        },
      ] )
      console.log(post, "post")
      const comments = await Comment.aggregate( [
        { $match : { post : req.params.id } },
        {
          $lookup:
              {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
              }
        },
        {
          $unwind: "$user",
        },
      ] )

      console.log(req.user, "user")
      res.render("post.ejs", { post: post[0], user: req.user, comments: comments });// comes from the post.ejs line 36
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  createComment: async (req, res) => {
    try {
      await Comment.create({
        comment:req.body.comment,// tells you whats going in the comment schema 
        likes: 0,
        user: req.user.id,// tells you whats going in the comment schema 
        post: req.params.id // tells you whats going in the comment schema // the names on the left have to mkae the schema names
      });
      console.log("Comment has been added!");

      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
