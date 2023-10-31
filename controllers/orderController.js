import orderModel from "../models/orderModel.js";
import dotenv from "dotenv";
import productModel from "../models/productModel.js";
import path from "path";
import puppeteer from "puppeteer";
import ejs from "ejs";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { fileURLToPath } from "url";
import sendMail from "../utils/sendMail.js";
import axios from "axios";
import notificationModel from "../models/notificationModel.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagePath = path.join(__dirname, "../assets/stick.png");
const templatePath = path.join(__dirname, "../emails/invoice-template.ejs");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const pdfGenerate = async (order) => {
  const cartTotal = calculateTotalPrice(order.cartItems);
  const code = order?.coupounDetails?.name
    ? order?.coupounDetails.name
    : "No Coupoun";
  function calculateTotalPrice(cartItems) {
    const total = cartItems.reduce(
      (total, val) => total + Math.round(val.oneQuantityPrice),
      0
    );
    return total;
  }

  const orderData = {
    paymentDetails: {
      orderId: order.paymentDetails.orderId,
      paymentMethod: order.paymentDetails.paymentMethod,
    },
    shippingDetails: order.shippingDetails,
    cartItems: order.cartItems,
    coupounCode: code,
    coupounDisc: order.coupounDetails.discount,
    cartSubtotal: cartTotal,
    subTotal: order.subTotal,
    shippingCharge: order.shippingCharge,
  };
  try {
    const renderedHtml = await ejs.renderFile(templatePath, {
      orderData,
      imagePath: "https://divinecoorgcoffee.co.in/logo.png",
    });

    const browser = await puppeteer.launch({
      headless: "new",
    });
    const page = await browser.newPage();
    await page.setContent(renderedHtml);
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
    });
    await browser.close();

    const name = orderData.paymentDetails.orderId;
    const uploadParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `invoices/${name}.pdf`,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    };
    const command = new PutObjectCommand(uploadParams);
    const data = await s3.send(command);
    const pdfUrl = `https://d26jxww88dzshe.cloudfront.net/invoices/${name}.pdf`;

    return pdfUrl;
  } catch (error) {
    console.error(error);
    throw new Error("Error generating and uploading invoice");
  }
};

export const inVoice = async (req, res) => {
  const orderData = {
    paymentDetails: {
      orderId: "DCC301020231821811",
      merchantTransactionId: "cod",
      transactionId: "cod",
      paymentMethod: "cod",
    },
    shippingDetails: {
      name: "Gagan",
      phone: "917349068451",
      address: "Muthusara Nilaya",
      city: "Gonikoppal",
      pincode: 571213,
      state: "Karnataka",
    },
    cartItems: [
      {
        name: "Caramel",
        categoryName: "Instant Coffee",
        oneQuantityPrice: 260,
        sellingPrice: 220,
        discountType: "NONE",
        discount: null,
        price: 259.6,
        tax: 18,
        taxAmount: 39.6,
        sgst: 9,
        sgstAmount: 19.8,
        cgst: 9,
        cgstAmount: 19.8,
        quantity: 1,
        slug: "Caramel",
      },
    ],
    coupounDetails: {
      type: "PERCENT",
      name: "FLAT10",
      discount: 26,
    },
    subTotal: 284,
    shippingCharge: 50,
  };

  try {
    const pdfPath = await pdfGenerate(orderData);
    res.redirect(pdfPath); // Redirect to the saved PDF file
  } catch (error) {
    res.status(500).send("Error generating invoice.");
  }
};

export const webhook = async (req, res) => {
  try {
    const url = "https://graph.facebook.com/v17.0/157288900799760/messages";
    const headers = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };
    const payload = {
      messaging_product: "whatsapp",
      to: "918277635511",
      type: "template",
      template: {
        name: "notification",
        language: {
          code: "en_US",
        },
      },
    };

    try {
      const response = await axios.post(url, payload, { headers });
      return res.status(201).send({ success: true, message: response.data });
    } catch (error) {
      return res.status(500).send({ success: false, message: error.message });
    }
  } catch (error) {
    res.status(500).send({ success: false, error });
  }
};

export const sendConfirmationEmail = async (req, res) => {
  try {
    const {
      email,
      orderId,
      paymentMethod,
      coupounDetails,
      shippingDetails,
      shippingCharge,
      cartItems,
      subTotal,
    } = req.body;

    function calculateTotalPrice(cartItems) {
      const total = cartItems.reduce(
        (total, val) => total + val.oneQuantityPrice,
        0
      );
      return total;
    }
    const cartTotal = calculateTotalPrice(cartItems);
    // const coupounDisc = coupounDiscountPrice(
    //   cartTotal,
    //   coupounDetails.discount
    // );

    // function coupounDiscountPrice(subTotal, couponDis) {
    //   return subTotal * (couponDis / 100);
    // }

    const coupounCode = coupounDetails.name
      ? coupounDetails.name
      : "No Coupoun";
    const data = {
      orderId: orderId,
      cartItems: cartItems,
      cartTotal: cartTotal,
      coupounCode: coupounCode,
      coupounDisc: coupounDetails.discount,
      shippingCharge: shippingCharge,
      subTotal: subTotal,
      shippingDetails: shippingDetails,
      paymentMethod: paymentMethod,
    };

    try {
      await sendMail({
        email,
        subject: `Order confirmation - ${orderId}`,
        template: "order-confirmation.ejs",
        data,
      });
      res.status(201).json({
        success: true,
        message: `please check your email ${email}`,
        data,
      });
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "error while sedning",
      error,
    });
  }
};

export const orderPostController = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const order = await orderModel.create({ ...req.body, buyer: req.user.id });
    const pdfUrl = await pdfGenerate(req.body);
    let update = cartItems.map((item) => {
      return {
        updateOne: {
          filter: { _id: item._id },
          update: { $inc: { stock: -item.quantity, sold: +item.quantity } },
        },
      };
    });
    const updated = await productModel.bulkWrite(update, {});
    await notificationModel.create({
      productNumber: req.body.cartItems.length,
      user: req.body.shippingDetails.name,
    });
    order.invoiceUrl = pdfUrl;
    await order.save();
    res.status(201).send({
      success: true,
      order,
      message: "Order Placed",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const orderGetController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user.id })
      .populate("products")
      .populate("cartItems")
      .populate("buyer")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While getting Order",
    });
  }
};

export const getAllNotification = async (req, res) => {
  try {
    const newNotification = await notificationModel
      .find({})
      .sort({ createdAt: "-1" });
    if (!newNotification) {
      return res.status(404).send({ success: false, message: "No New Order" });
    }
    res.status(200).send({
      success: true,
      newNotification,
    });
  } catch (error) {
    res.status(500).send({
      error,
      success: false,
      message: "Something Went Wrong While Fetching Notification",
    });
  }
};
export const handleNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationModel.findById(id);
    if (!notification) {
      return res
        .status(404)
        .send({ success: false, message: "No Notification Found" });
    }
    await notificationModel.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      error,
      success: false,
      message: "Something Went Wrong While Fetching Notification",
    });
  }
};

export const orderGetAllController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products")
      .populate("cartItems")
      .populate("buyer")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While getting Order",
    });
  }
};

export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updating Order",
      error,
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await orderModel.findOne({
      "paymentDetails.orderId": orderId,
    });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updating Order",
      error,
    });
  }
};

// export const getMonthWiseOrderDetails = async (req, res) => {
//   let monthNames = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];
//   let day = new Date();
//   let endDate = "";
//   day.setDate(1);
//   for (let i = 0; i < 11; i++) {
//     day.setMonth(day.getMonth() - 1);
//     endDate = monthNames[day.getMonth()] + " " + day.getFullYear();
//   }
//   const data = await orderModel.aggregate([
//     {
//       $match: {
//         createdAt: {
//           $lte: new Date(),
//           $gte: new Date(endDate),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: {
//           month: "$month",
//         },
//         amount: { $sum: "$subTotal" },
//         count: { $sum: 1 },
//       },
//     },
//   ]);
//   res.json(data);
// };

export const getMonthWiseOrderDetails = async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let currentDate = new Date();
  let startDate = new Date(currentDate);
  startDate.setMonth(currentDate.getMonth() - 5); // 12 months including the current month
  startDate.setDate(1); // Start of the month
  startDate.setHours(0, 0, 0, 0); // Start of the day

  const data = await orderModel.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: startDate,
        },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        amount: { $sum: "$subTotal" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Ensure all months in the range have data
  let result = [];
  for (let i = 0; i < 6; i++) {
    const month = startDate.getMonth();
    const year = startDate.getFullYear();
    const monthData = data.find(
      (entry) => entry._id.month === month + 1 && entry._id.year === year
    );

    if (monthData) {
      result.push(monthData);
    } else {
      result.push({
        _id: {
          month: month + 1,
          year: year,
        },
        amount: 0,
        count: 0,
      });
    }

    startDate.setMonth(month + 1);
  }

  res.json(result);
};
export const getYearlyWiseTotalOrderCount = async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let day = new Date();
  let endDate = "";
  day.setDate(1);
  for (let i = 0; i < 11; i++) {
    day.setMonth(day.getMonth() - 1);
    endDate = monthNames[day.getMonth()] + " " + day.getFullYear();
  }
  const data = await orderModel.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        amount: { $sum: "$subTotal" },
      },
    },
  ]);
  res.json(data);
};
