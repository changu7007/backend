import express from "express";
import {
  loginController,
  registerController,
  updateProfileController,
  sendForm,
  handleRefreshToken,
  logout,
  forgotPasswordToken,
  resetPassword,
  getAllUsers,
  sendPhoneOtp,
  verifyOtp,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";
//router object
const router = express.Router();

//routing
//REGISTER || METHOD POST
router.post("/register", registerController);
router.post("/send-otp", sendPhoneOtp);
router.post("/sendform", sendForm);

//LOGIN || METHOD POST
router.post("/login", loginController);
router.post("/verify-otp", verifyOtp);

router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);

//FORGET PASSWORD
router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);

//test routes
router.get("/allusers", requireSignIn, isAdmin, getAllUsers);

// protected user route
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

// admin protected route
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

//update-profile
router.put("/profile", requireSignIn, updateProfileController, (req, res) => {
  res.status(200).send({ ok: true });
});

export default router;
