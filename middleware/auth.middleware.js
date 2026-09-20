const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // ১. রিকোয়েস্টের হেডার থেকে Authorization হেডার নেওয়া
    const authHeader = req.headers.authorization;

    // যদি হেডার না থাকে বা Bearer দিয়ে শুরু না হয়
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Access denied. No token provided or invalid token format. Use 'Bearer <token>'",
      });
    }

    // ২. 'Bearer <token>' থেকে মূল টোকেনটি আলাদা করা
    const token = authHeader.split(" ")[1];

    // ৩. টোকেনটি ভ্যালিড কিনা যাচাই করা (JWT_ACCESS_SECRET দিয়ে)
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);

    // ৪. ডিকোড করা ইউজারের তথ্য (id, email) req.user এ যুক্ত করা
    req.user = decoded;

    // ৫. পরবর্তী কন্ট্রোলারে যাওয়ার অনুমতি দেওয়া
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
