import orderModel from "../models/orderModel.js";
import dotenv from "dotenv";
import productModel from "../models/productModel.js";
import pdfkit from "pdfkit";
import path from "path";
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

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const generateInvoice = async (orderData) => {
  try {
    return new Promise(async (resolve, reject) => {
      const doc = new pdfkit();

      // // Load logo image
      // const logoUrl = "https://divinecoorgcoffee.co.in/logo.png"; // Replace with your logo URL
      // const logoResponse = await axios.get(logoUrl, {
      //   responseType: "arraybuffer",
      // });
      // fs.writeFileSync("logo.png", logoResponse.data);

      // // Add logo image to the PDF document
      // const logoPath = "logo.png";
      // // Header style from generateHeader
      doc
        .image(imagePath, 50, 45, { width: 50 })
        .fillColor("#444444")
        .fontSize(10)
        .text("Divine Coorg Coffee.", 200, 50, { align: "right" })
        .text("Bangalore", 200, 65, { align: "right" })
        .text("Karnataka, INDIA, 560098", 200, 80, { align: "right" })
        .moveDown();

      // Custom information from generateCustomerInformation
      doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Invoice", 50, 120)
        .text("Shipping Details", 300, 120, { width: 200, align: "right" })
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, 150)
        .lineTo(550, 150)
        .stroke();

      const customerInformationTop = 160;

      // Left side: Order ID and Date
      doc
        .fontSize(10)
        .text("Order ID:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(orderData.paymentDetails.orderId, 150, customerInformationTop)
        .font("Helvetica")
        .text("Date:", 50, customerInformationTop + 15)
        .text(new Date().toLocaleDateString(), 150, customerInformationTop + 15)
        .text("Payment Mode:", 50, customerInformationTop + 30)
        .font("Helvetica-Bold")
        .text(
          orderData.paymentDetails.paymentMethod,
          150,
          customerInformationTop + 30
        );

      function calculateTextHeight(doc, text, options = {}) {
        return doc.heightOfString(text, options);
      }

      // Right side: Shipping Address
      let shippingPosition = customerInformationTop;
      const leadingValue = 20; // Adjust to your preferred line spacing

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(orderData.shippingDetails.name, 300, shippingPosition, {
          align: "right",
        });

      // Add the phone number after the name
      const phoneNumber = `+91 ${orderData.shippingDetails.phone}`;
      const phoneHeight = calculateTextHeight(doc, phoneNumber, {
        leading: leadingValue,
      });
      doc.text(phoneNumber, 300, shippingPosition + 15, {
        leading: leadingValue,
        align: "right",
      });

      // Adjust the position for the address
      const address = orderData.shippingDetails.address;
      const addressHeight = calculateTextHeight(doc, address, {
        leading: leadingValue,
      });
      doc
        .font("Helvetica")
        .text(address, 300, shippingPosition + 15 + phoneHeight, {
          align: "right",
        });

      // Adjust the position for the city
      const city = `${orderData.shippingDetails.city}, ${orderData.shippingDetails.state}, ${orderData.shippingDetails.pincode}`;
      const cityHeight = calculateTextHeight(doc, city, {
        leading: leadingValue,
      });
      doc.text(city, 300, shippingPosition + 15 + phoneHeight + addressHeight, {
        leading: leadingValue,
        align: "right",
      });

      doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, 240)
        .lineTo(550, 240)
        .stroke();

      // Cart Items with styling from generateInvoiceTable
      const invoiceTableTop = 280;
      doc.font("Helvetica-Bold");
      doc
        .fontSize(10)
        .text("No.", 50, invoiceTableTop)
        .text("Name", 100, invoiceTableTop)
        .text("Quantity", 250, invoiceTableTop)
        .text("Price", 350, invoiceTableTop)
        .text("Discount", 425, invoiceTableTop)
        .text("Total", 475, invoiceTableTop, { align: "right" });
      doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, invoiceTableTop + 20)
        .lineTo(550, invoiceTableTop + 20)
        .stroke();
      doc.font("Helvetica");

      let yPos = invoiceTableTop + 30;
      let itemNo = 1; // Initialize item number
      orderData.cartItems.forEach((item) => {
        doc
          .fontSize(10)
          .text(itemNo.toString(), 50, yPos, { width: 90, align: "left" }) // Add the item number here
          .text(item.name, 100, yPos)
          .text(item.quantity.toString(), 250, yPos, {
            width: 90,
            align: "left",
          })
          .text(`Rs.${item.price.toFixed(2)}`, 350, yPos, {
            width: 90,
            align: "left",
          })
          .text(`0%`, 425, yPos, {
            width: 90,
            align: "left",
          })
          .text(`Rs.${(item.price * item.quantity).toFixed(2)}`, 475, yPos, {
            align: "right",
          });
        yPos += 30;
        itemNo++; // Increment the item number for the next iteration
      });
      let totalAmount = orderData.cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      let couponDiscount = orderData.coupounDetails
        ? totalAmount * (orderData.coupounDetails.discount / 100)
        : 0;
      let subtotal = totalAmount + orderData.shippingCharge - couponDiscount;

      // ... [items loop code here as before]

      // Now, after looping through all items, add the total, coupon discount, and subtotal to the bottom
      const bottomPosition = yPos + 10; // Adjust as necessary

      doc
        .font("Helvetica-Bold")
        .text("Total:", 400, bottomPosition)
        .text(`Rs.${totalAmount.toFixed(2)}`, 475, bottomPosition, {
          align: "right",
        });

      // Only display the coupon discount if it's available
      if (couponDiscount > 0) {
        doc
          .text("Coupon:", 400, bottomPosition + 20)
          .text(
            `- ${orderData.coupounDetails.discount} % on Total`,
            450,
            bottomPosition + 20,
            { align: "right" }
          );
      }
      doc
        .text("Shipping:", 400, bottomPosition + 40)
        .text(
          `+ Rs.${orderData.shippingCharge.toFixed(2)}`,
          475,
          bottomPosition + 40,
          { align: "right" }
        );

      doc
        .text("Subtotal:", 400, bottomPosition + 60)
        .text(`Rs.${subtotal.toFixed(2)}`, 475, bottomPosition + 60, {
          align: "right",
        });

      // Footer from generateFooter
      doc.fontSize(10).text("Thank you for your Purchase!", 50, 600, {
        align: "center",
        width: 500,
      });

      // Save the PDF document to the specified file path
      const buffers = [];
      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(buffers);
        const name = orderData.paymentDetails.orderId;
        const uploadParams = {
          Bucket: process.env.BUCKET_NAME,
          Key: `invoices/${name}.pdf`, // Use a proper file path within your bucket
          Body: pdfBuffer,
          ContentType: "application/pdf",
        };
        const command = new PutObjectCommand(uploadParams);
        const data = await s3.send(command);
        const pdfUrl = `https://d26jxww88dzshe.cloudfront.net/invoices/${name}.pdf`;

        resolve(pdfUrl); // Resolve the promise with the PDF URL
      });

      doc.end();
    });
  } catch (error) {
    console.error(error);
    throw new Error("Error generating and uploading invoice");
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
    const coupounDisc = coupounDiscountPrice(
      cartTotal,
      coupounDetails.discount
    );

    function coupounDiscountPrice(subTotal, couponDis) {
      return subTotal * (couponDis / 100);
    }

    const coupounCode = coupounDetails.name
      ? coupounDetails.name
      : "No Coupoun";
    const data = {
      orderId: orderId,
      cartItems: cartItems,
      cartTotal: cartTotal,
      coupounCode: coupounCode,
      coupounDisc: coupounDisc,
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
    const pdfUrl = await generateInvoice(req.body);
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
