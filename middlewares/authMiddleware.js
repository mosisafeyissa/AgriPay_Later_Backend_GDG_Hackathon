// middlewares/authMiddleware.js

// Define your requireAuth function (example using JWT)
const jwt = require("jsonwebtoken"); // Example dependency

const requireAuth = (req, res, next) => {
  // 1. Get token (e.g., from Authorization header)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];

  // 2. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key
    // 3. Attach user info to request object
    req.user = decoded; // Or fetch user from DB based on decoded.id
    next(); // Proceed if token is valid
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Your existing requireFarmer function
const requireFarmer = (req, res, next) => {
  // It's safer to check req.user exists first (set by requireAuth)
  if (!req.user || req.user.role !== "farmer") {
    return res
      .status(403)
      .json({ message: "Access denied: Farmer role required" });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied: Admin role required" });
  }
  next();
};

// Export BOTH functions
module.exports = {
  requireAuth,
  requireFarmer,
  requireAdmin,
  // Add other middleware exports here if needed
};
