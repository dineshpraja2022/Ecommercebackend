// server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/connectDB.js";
import { connectCloudinary } from "./config/cloudinary.js";

dotenv.config();
const app = express();

// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://your-frontend.vercel.app", // production frontend URL
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

// ✅ Static files
app.use("/images", express.static("uploads"));

// ✅ Routes
import userRoutes from "./routes/user.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import addressRoutes from "./routes/address.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.js";

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

// ✅ Connect DB & Cloudinary (ek baar hi chalega)
connectDB();
connectCloudinary();

// ❌ app.listen मत लगाओ
// ✅ Export app (Vercel ke liye)
export default app;
