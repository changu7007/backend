import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    bannerTitle: {
      type: String,
      required: true,
    },
    bannerDekstopUrl: {
      type: String,
    },
    bannerMobileUrl: {
      type: String,
    },
    bannerButtonText: {
      type: String,
      required: true,
    },
    bannerLinkText: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("banner", bannerSchema);
