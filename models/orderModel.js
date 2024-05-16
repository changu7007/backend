import mongoose from "mongoose";

const reqString = { type: String, required: true };
const reqNumber = { type: Number, required: true };

const orderSchema = new mongoose.Schema(
  {
    subTotal: reqNumber,
    coupounDetails: {
      type: { type: String },
      name: {
        type: String,
      },
      discount: {
        type: Number,
        default: 0,
      },
    },
    shippingCharge: {
      type: Number,
      default: 0,
    },
    shippingDetails: {
      name: reqString,
      phone: reqString,
      address: reqString,
      city: reqString,
      pincode: reqNumber,
      state: reqString,
    },
    products: [
      {
        product: { type: mongoose.ObjectId, ref: "Products" },
        quantity: reqNumber,
        totalPrice: reqNumber,
      },
    ],
    cartItems: [
      {
        product: { type: mongoose.ObjectId, ref: "Products" },
        name: reqString,
        categoryName: reqString,
        photo: reqString,
        oneQuantityPrice: reqNumber,
        oneStrikingPrice: reqNumber,
        strikingPrice: reqNumber,
        sellingPrice: reqNumber,
        discountType: reqString,
        discount: { type: Number, default: 0 },
        price: reqNumber,
        tax: reqNumber,
        taxAmount: reqNumber,
        sgst: reqNumber,
        sgstAmount: reqNumber,
        cgst: reqNumber,
        cgstAmount: reqNumber,
        quantity: reqNumber,
        slug: reqString,
      },
    ],
    paymentDetails: {
      orderId: reqString,
      merchantTransactionId: reqString,
      transactionId: reqString,
      paymentMethod: reqString,
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
    },
    status: {
      type: String,
      default: "Accepted",
      enum: ["Processing", "Accepted", "Shipped", "deliverd", "cancel"],
    },
    invoiceUrl: {
      type: String,
    },
    month: {
      type: String,
      default: new Date().getMonth(),
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
