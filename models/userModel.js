import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      require: true,
    },
    city: {
      type: String,
      require: true,
    },
    pincode: {
      type: Number,
      require: true,
    },
    state: {
      type: String,
      require: true,
    },
    answer: {
      type: {},
      require: true,
    },
    refreshToken: {
      type: String,
      require: true,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// userSchema.pre("save",async function (next) {
//   if (!this.isModified("password")) {
//     next()
//   }
//   hashPassword(this.password);
//   next()
// })

// userSchema.methods.createPasswordResetToken = async() => {
//   const resetToken = crypto.randomBytes(32).toString("hex");
//   this.passwordResetToken = crypto.createHash("256").update(resetToken).digest("hex")
//   this.passwordResetExpires = Date.now()+30*60*1000 //10min
//   return resetToken
// }

export default mongoose.model("users", userSchema);
