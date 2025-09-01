// controllers/payment.controller.js

import Razorpay from "razorpay";
import crypto from "crypto";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 Helper function to calculate total amount with GST and shipping
const calculateTotalAmount = async (items) => {
  let amount = 0;
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new Error(`Product not found: ${item.product}`);
    amount += product.offerPrice * item.quantity;
  }

  const gst = amount * 0.12;         // 12% GST
  const shippingCharge = 39;         // ₹39 fixed shipping charge

  const totalAmount = Math.round(amount + gst + shippingCharge);  // round off total

  return totalAmount;
};

// 🔹 Create Razorpay Order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, address } = req.body;
    if (!items?.length || !address) {
      return res.status(400).json({ success: false, message: "Invalid order details" });
    }

    const amount = await calculateTotalAmount(items);

    const options = {
      amount: amount * 100, // amount in paise for Razorpay
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      orderId: order.id,
      amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      items,
      address,
    });
  } catch (error) {
    console.error("❌ Razorpay order creation error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
  }
};

// 🔹 Verify Razorpay Payment & Save Order
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address } = req.body;
    const userId = req.user;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    // ✅ Signature verification
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("⚠️ Invalid payment signature detected");
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // ✅ Recalculate amount to avoid tampering
    const amount = await calculateTotalAmount(items);

    // ✅ Save the order in DB
    await Order.create({
      userId,
      items,
      address,
      amount,
      paymentType: "Online",
      isPaid: true,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id, // for extra tracking
    });

    return res.json({ success: true, message: "Payment verified & order placed successfully" });
  } catch (error) {
    console.error("❌ Payment verification error:", error.message);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};
