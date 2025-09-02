// api/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "../config/connectDB.js";
import { connectCloudinary } from "../config/cloudinary.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

// ✅ Load environment variables
dotenv.config();

const app = express();

// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173", // local dev
  // "https://yourfrontend.com" // production URL
];

// ✅ Middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// ✅ Static files (uploads folder)
app.use("/images", express.static("uploads"));

// ✅ Routes import
import userRoutes from "../routes/user.routes.js";
import sellerRoutes from "../routes/seller.routes.js";
import productRoutes from "../routes/product.routes.js";
import cartRoutes from "../routes/cart.routes.js";
import addressRoutes from "../routes/address.routes.js";
import orderRoutes from "../routes/order.routes.js";
import paymentRoutes from "../routes/payment.js";

// ✅ API routes
app.use("/api/user", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server running fine 🚀" });
});

// ✅ Mongo + Cloudinary Connect
const init = async () => {
  try {
    await connectDB();
    await connectCloudinary();
    console.log("✅ Database + Cloudinary Connected");
  } catch (err) {
    console.error("❌ Init error:", err);
  }
};

init();

// ❌ app.listen() मत लगाना
// ✅ Instead export app
export default app;
