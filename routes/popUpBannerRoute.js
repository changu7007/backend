import express from "express";
import formidableMiddleware from "../middelware/formidable.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";
import {
  deletePopUpBannerById,
  getAllPopUpBanner,
  getPopUpBannerById,
  popUpStatusController,
  postPopUpBanner,
  updatePopUpBanner,
} from "../controllers/popupController.js";

const router = express.Router();

router.post(
  "/post-popup-banner",
  requireSignIn,
  isAdmin,
  formidableMiddleware,
  postPopUpBanner
);

router.put(
  "/update-popup-banner/:bid",
  requireSignIn,
  isAdmin,
  formidableMiddleware,
  updatePopUpBanner
);

router.put(
  "/update-status/:bid",
  requireSignIn,
  isAdmin,
  popUpStatusController
);

router.delete(
  "/delete-popup-banner/:bid",
  requireSignIn,
  isAdmin,
  deletePopUpBannerById
);
router.get("/get-all-popup-banner", getAllPopUpBanner);

router.get(
  "/get-popup-banner/:bid",
  requireSignIn,
  isAdmin,
  getPopUpBannerById
);

export default router;
