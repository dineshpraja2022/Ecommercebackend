// server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/connectDB.js";
import { connectCloudinary } from "./config/cloudinary.js";

// ✅ Load environment variables
dotenv.config();

const app = express();

// ✅ Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend.vercel.app" // 🔥 apna actual Vercel frontend URL
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

// ✅ Static files (uploads folder serve)
app.use("/images", express.static(path.join(__dirname, "uploads")));

// ✅ Routes import
import userRoutes from "./routes/user.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import addressRoutes from "./routes/address.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.js";

// ✅ API routes
app.use("/api/user", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Welcome to VD Elevate Tech Solutions API 🚀. Use /api/health to check server status.");
});

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server running fine 🚀" });
});

const PORT = process.env.PORT || 5000;

// ✅ Start server
const startServer = async () => {
  try {
    await connectDB();
    await connectCloudinary();

    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }
};

startServer();
