import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// COD order placement
export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.user;
    const { items, address } = req.body;

    if (!address || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid order details", success: false });
    }

    // Calculate amount based only on product offerPrice * quantity (no tax/shipping)
    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error("Product not found");
      amount += product.offerPrice * item.quantity;
    }

    await Order.create({
      userId,
      items,
      address,
      amount,
      paymentType: "COD",
      gstNumber: req.body.gstNumber || "",
      isPaid: false,
    });

    res.status(201).json({ message: "Order placed successfully", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user;
    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product")
      .populate("address")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all orders for seller/admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product")
      .populate("address")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const totalAmount = orders.reduce((total, order) => total + (order.amount || 0), 0);

    res.status(200).json({
      success: true,
      orders,
      totalAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create Razorpay order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.user;

    if (!address || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid order details", success: false });
    }

    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error("Product not found");
      amount += product.offerPrice * item.quantity;
    }

    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      items,
      address,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
};

// Verify Razorpay payment
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address } = req.body;
    const userId = req.user;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error("Product not found");
      amount += product.offerPrice * item.quantity;
    }

    await Order.create({
      userId,
      items,
      address,
      amount,
      paymentType: "Online",
      isPaid: true,
      paymentId: razorpay_payment_id,
      gstNumber: req.body.gstNumber || "",
    });

    res.status(201).json({ success: true, message: "Payment verified & order placed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};
