import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    cod: {
      type: Boolean,

      default: false,
    },
    phonePe: {
      type: Boolean,

      default: false,
    },
    razorpay: {
      type: Boolean,

      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("payment", paymentSchema);
