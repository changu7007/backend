import express from "express";
import {
  getAllNotification,
  getMonthWiseOrderDetails,
  getOrderDetails,
  getYearlyWiseTotalOrderCount,
  handleNotificationRead,
  inVoice,
  orderGetAllController,
  orderGetController,
  orderPostController,
  orderStatusController,
  sendConfirmationEmail,
  webhook,
} from "../controllers/orderController.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";

const router = express.Router();

router.post("/", requireSignIn, orderPostController);
router.get("/orders", requireSignIn, orderGetController);
router.post("/confirmationorders", requireSignIn, sendConfirmationEmail);
router.post("/send-whatsapp", webhook);
router.get("/all-orders", requireSignIn, isAdmin, orderGetAllController);
router.get("/get-order/:orderId", getOrderDetails);
router.get("/get-notifications", requireSignIn, isAdmin, getAllNotification);
router.delete(
  "/update-notification/:id",
  requireSignIn,
  isAdmin,
  handleNotificationRead
);
router.get(
  "/getMonthWiseStats",
  requireSignIn,
  isAdmin,
  getMonthWiseOrderDetails
);

router.get(
  "/getYearlyWiseOrder",
  requireSignIn,
  isAdmin,
  getYearlyWiseTotalOrderCount
);

router.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  orderStatusController
);

router.put("/invoice/:orderId", requireSignIn, isAdmin, inVoice);

export default router;
