import Product from "../models/product.model.js";

// Add Product
export const addProduct = async (req, res) => {
  try {
    const { name, price, offerPrice, description, category } = req.body;
    const image = req.files?.map((file) => file.filename);

    if (!name || !price || !offerPrice || !description || !category || !image || image.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All fields including images are required",
      });
    }

    const product = new Product({
      name,
      price,
      offerPrice,
      description,
      category,
      image,
    });

    const savedProduct = await product.save();

    return res.status(201).json({
      success: true,
      product: savedProduct,
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("Error in addProduct:", error);
    return res.status(500).json({ success: false, message: "Server error while adding product" });
  }
};

// Get All Products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Product By ID (now via req.params.id)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Change Stock
export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;
    const product = await Product.findByIdAndUpdate(id, { inStock }, { new: true });
    res.status(200).json({ success: true, product, message: "Stock updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Product using req.params.id
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.files && req.files.length > 0) {
      updateData.image = req.files.map((file) => file.filename);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product: updatedProduct, message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while updating product", error: error.message });
  }
};

// ✅ Delete Product using req.params.id
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while deleting product", error: error.message });
  }
};
