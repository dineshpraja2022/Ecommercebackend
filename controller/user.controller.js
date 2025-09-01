import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

// Cookie options define once, reuse everywhere
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all the fields", success: false });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Set cookie here
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all the fields", success: false });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist", success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials", success: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Set cookie here
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      message: "Logged in successfully",
      success: true,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Check Auth
export const checkAuth = async (req, res) => {
  try {
    const userId = req.user; // set by auth middleware
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in checkAuth:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    return res.status(200).json({ message: "Logged out successfully", success: true });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};
