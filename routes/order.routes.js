import express from "express";
import authUser from "../middlewares/authUser.js";
import { getAllOrders, getUserOrders, placeOrderCOD } from "../controller/order.controller.js";
import { authSeller } from "../middlewares/authSeller.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 📦 COD order placement
router.post("/cod", authUser, placeOrderCOD);

// 👤 Get orders of logged-in user
router.get("/user", authUser, getUserOrders);

// 🛍 Get all orders for seller/admin
router.get("/seller", authSeller, getAllOrders);

// 🚚 Ship Order Route (✅ नया जोड़ा गया)
// PUT /api/order/:id/ship
router.put("/:id/ship", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // agar already packed/shipped hai to dobara update na ho
    if (order.status === "packed") {
      return res.json({ success: true, message: "Order already shipped", order });
    }

    // Update status
    order.status = "packed";
    order.isShipped = true; // extra field add karna ho to schema me add karo
    order.shippedAt = Date.now();

    const updatedOrder = await order.save();

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error while shipping order" });
  }
});


// 💰 Helper function to calculate total amount with GST and shipping
async function calculateAmountWithTaxAndShipping(items) {
  let amount = await items.reduce(async (accP, item) => {
    const acc = await accP;
    const product = await Product.findById(item.product);
    if (!product) throw new Error("Product not found");
    return acc + product.offerPrice * item.quantity;
  }, 0);

  const gst = amount * 0.12;      // 12% GST
  const shippingCharge = 39;      // ₹39 shipping
  amount = Math.round(amount + gst + shippingCharge);

  return amount;
}

// 🏦 Create Razorpay order for online payment
router.post("/razorpay", authUser, async (req, res) => {
  try {
    const { items, address } = req.body;

    if (!items || items.length === 0 || !address) {
      return res.status(400).json({ success: false, message: "Invalid order details" });
    }

    const amount = await calculateAmountWithTaxAndShipping(items);

    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
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
    res.status(500).json({ success: false, message: "Razorpay order creation failed" });
  }
});

// ✅ Verify payment & save order
router.post("/verify", authUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address, gstNumber } = req.body;
    const userId = req.user;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const amount = await calculateAmountWithTaxAndShipping(items);

    await Order.create({
      userId,
      items,
      address,
      amount,
      paymentType: "Online",
      isPaid: true,
      gstNumber,
      paymentId: razorpay_payment_id,
    });

    res.json({ success: true, message: "Payment verified & order placed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});

export default router;
