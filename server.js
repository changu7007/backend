import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import couponRoutes from "./routes/couponRoute.js";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

//config env
dotenv.config();

//database config
connectDB();
const app = express();

//esmodulefix

//middelware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/coupon", couponRoutes);

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.join(__dirname, "./client/build")));
  app.use("*", function (req, res) {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
  });
}
// port
const PORT = process.env.PORT || 8000;

// run or listen
app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});
