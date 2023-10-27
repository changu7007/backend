import express from "express";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";
import { createCouponController, deleteCouponController, getAllCoupon, updateCouponController } from "../controllers/couponController.js";
const router = express.Router();

router.post("/",requireSignIn,isAdmin ,createCouponController)
router.get("/all-coupons",requireSignIn,isAdmin ,getAllCoupon)
router.put("/update-coupon/:id",requireSignIn,isAdmin ,updateCouponController)
router.delete("/delete-coupon/:id",requireSignIn,isAdmin ,deleteCouponController)




export default router;