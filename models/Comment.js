const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  likes: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    ref: "User",
  },
  post: {
    type: String,
    ref: "Post",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Comment", CommentSchema);