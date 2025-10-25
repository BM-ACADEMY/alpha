const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Load environment variables
dotenv.config();

const app = express();

// Create Uploads directory
const uploadsDir = path.join(__dirname, "Uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(UploadsDir, { recursive: true });
}

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, process.env.PRODUCTION_URL, // Fallback to localhost:3000
];
const corsOptions = {
  origin: function (origin, callback) {
    // console.log("CORS Origin:", origin); // Debug origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("CORS blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS to all routes, including static files
app.use(cors(corsOptions));

// Serve static files with explicit CORS headers
app.use(
  "/Uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  },
  express.static(uploadsDir)
);

// Apply other middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));

// Increase timeout and size limit for upload route
app.use("/api/user-subscription-plan/upload-screenshot", (req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  next();
});

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).send("API is running...");
});

// Route Imports
const planRoutes = require("./route/planRoute");
const percentageRoutes = require("./route/percentageRoute");
const testimonialRoutes = require("./route/testimonialRoute");
const complaintRoutes = require("./route/complaintRoute");
const userRoutes = require("./route/usersRoute");
const rolesRoutes = require("./route/rolesRoute");
const accountRoutes = require("./route/accountRoute");
const addressRoutes = require("./route/addressRoute");
const userSubscriptionPlanRoute = require("./route/userSubscriptionPlanRoute");
const walletRoute = require("./route/walletRoute");
const reportRoute = require("./route/reportRoute");
const profileImageRoute = require("./route/profileImageRoute");
const dashboardRoute = require("./route/dashboardRoute");
const redeemRoute = require("./route/redeemRoute");
const socialMediaRoutes = require("./route/socialMediaRoutes");

// Register Routes with Prefix
app.use("/api/plans", planRoutes);
app.use("/api/percentages", percentageRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/user-subscription-plan", userSubscriptionPlanRoute);
app.use("/api/wallet-point", walletRoute);
app.use("/api/reports", reportRoute);
app.use("/api/profile-image", profileImageRoute);
app.use("/api/dashboard-route", dashboardRoute);
app.use("/api/redeem", redeemRoute);
app.use("/api/socialmedia", socialMediaRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server error:", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  }
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS policy violation" });
  }
  if (err.code === "ECONNRESET" || err.code === "ECONNABORTED") {
    return res.status(503).json({ message: "Request aborted by client or server" });
  }
  res.status(500).json({ message: err.message || "Internal server error" });
});

// Connect to DB and Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};
startServer();