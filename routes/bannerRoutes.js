import express from "express";
import formidableMiddleware from "../middelware/formidable.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";
import {
  deleteBannerById,
  getAllBanner,
  getAllStatus,
  getBannerById,
  postBanner,
  updateBanner,
  updateStatus,
} from "../controllers/bannerController.js";

const router = express.Router();

router.post(
  "/post-new-banner",
  requireSignIn,
  isAdmin,
  formidableMiddleware,
  postBanner
);

router.put(
  "/update-banner/:bid",
  requireSignIn,
  isAdmin,
  formidableMiddleware,
  updateBanner
);
router.get("/get-all-banner", getAllBanner);
router.get("/get-banner/:bid", requireSignIn, isAdmin, getBannerById);

router.delete("/delete-banner/:bid", requireSignIn, isAdmin, deleteBannerById);
router.get("/payment-status", getAllStatus);
router.put("/update-payment-status/:id", requireSignIn, isAdmin, updateStatus);

export default router;
