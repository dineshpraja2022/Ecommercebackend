import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Seller = mongoose.model("Seller", sellerSchema);
export default Seller;
