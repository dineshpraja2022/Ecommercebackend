// middlewares/authSeller.js
import jwt from "jsonwebtoken";

export const authSeller = (req, res, next) => {
  try {
    const token = req.cookies?.sellerToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.seller = decoded;
    next();
  } catch (error) {
    console.error("Error in authSeller middleware:", error);
    res.status(401).json({ message: "Invalid or expired token", success: false });
  }
};
