import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    numViews: {
      type: Number,
      default:0,
    },
    isLiked: {
      type: Boolean,
      default:false,

    },
    isDisliked: {
        type: Boolean,
        default:false,
  
      },
    likes:[
        {
            type: mongoose.ObjectId,
            ref:"users"
        }
    ],
    dislikes:[
        {
            type: mongoose.ObjectId,
            ref:"users"
        }
    ],
    author:{
        type:String,
        default:"Admin"
    },
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);
