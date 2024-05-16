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
import bannerRoutes from "./routes/bannerRoutes.js";
import popUpBannerRoutes from "./routes/popUpBannerRoute.js";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import attachIO from "./middelware/ioMiddleware.js";
import "./controllers/crons-controller.js";

//config env
dotenv.config();

//database config
connectDB();
const app = express();

//esmodulefix

//middelware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(morgan("dev"));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(cookieParser());

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/coupon", couponRoutes);
app.use("/api/v1/banner", bannerRoutes);
app.use("/api/v1/popUpBanner", popUpBannerRoutes);

if (
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "test" ||
  process.env.NODE_ENV === "dev"
) {
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
const server = app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust according to your front-end's URL
  },
});

io.on("Connection", (socket) => {
  console.log("Connected");

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
});

app.use(attachIO(io));
