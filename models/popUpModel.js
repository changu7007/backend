import mongoose from "mongoose";

const popUpBannerSchema = new mongoose.Schema(
  {
    publish: {
      type: Boolean,
      required: true,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
    },
    description: {
      type: String,
    },
    buttonText: {
      type: String,
      required: true,
    },
    bannerLink: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("popUpBanner", popUpBannerSchema);
