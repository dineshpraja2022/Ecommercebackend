// routes/payment.routes.js

import express from "express";
import { createRazorpayOrder, verifyPayment } from "../controller/payment.js";
import authUser from "../middlewares/authUser.js";

const router = express.Router();

// Razorpay order creation - user must be logged in
router.post("/razorpay", authUser, createRazorpayOrder);

// Razorpay payment verification - user must be logged in
router.post("/verify", authUser, verifyPayment);

export default router;
