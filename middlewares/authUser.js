import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  try {
    // Token from cookie OR Authorization header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    console.error("❌ Error in authUser middleware:", error.message);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    const message =
      error.name === "TokenExpiredError"
        ? "Token expired, please log in again"
        : "Invalid token, please log in again";

    return res.status(401).json({ message, success: false });
  }
};

export default authUser;
