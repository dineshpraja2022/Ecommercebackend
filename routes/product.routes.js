import express from "express";
import { authSeller } from "../middlewares/authSeller.js";
import {
  addProduct,
  changeStock,
  getProductById,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controller/product.controller.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// Routes
router.post("/add-product", authSeller, upload.array("image", 4), addProduct);
router.get("/list", getProducts);
router.get("/:id", getProductById); // ✅ /api/product/123
router.post("/stock", authSeller, changeStock);
router.put("/:id", authSeller, upload.array("image", 4), updateProduct); // ✅ /api/product/:id
router.delete("/:id", authSeller, deleteProduct); // ✅ /api/product/:id

export default router;
