import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase:true,
  },
  discount: {
    type: Number,
    required: true,
  },
  
},{ timestamps: true });

export default mongoose.model("coupon", couponSchema);
