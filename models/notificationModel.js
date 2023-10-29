import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    notification: {
      type: Boolean,
      default: true,
    },
    productNumber: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("notification", notificationSchema);
