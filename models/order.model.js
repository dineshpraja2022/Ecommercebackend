import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gstNumber: {
  type: String,
  default: "",
},

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
      },
    ],
    amount: { type: Number, required: true },
    address: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    status: { type: String, default: "Order Placed" },
     gstNumber: { type: String },
    paymentType: { type: String, required: true },
    isPaid: { type: Boolean, default: false, required: true },
    isShipped: { type: Boolean, default: false },
    shippedAt: { type: Date },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
