import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: {
      type: String,
    },
    numViews: {
      type: Number,
      default: 0,
    },
    isLiked: {
      type: Boolean,
      default: false,
    },
    isDisliked: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: mongoose.ObjectId,
        ref: "users",
      },
    ],
    dislikes: [
      {
        type: mongoose.ObjectId,
        ref: "users",
      },
    ],
    author: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

blogSchema.pre("save", function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

export default mongoose.model("Blog", blogSchema);
