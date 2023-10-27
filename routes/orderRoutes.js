import express from "express";
import {
  getMonthWiseOrderDetails,
  getOrderDetails,
  getYearlyWiseTotalOrderCount,
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

export default router;
