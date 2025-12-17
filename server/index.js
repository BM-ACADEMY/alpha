import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

// === Fix __dirname in ESM ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Create Uploads directory
const uploadsDir = path.join(__dirname, "Uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
].filter(Boolean); // Remove empty values

const corsOptions = {
  origin: function (origin, callback) {
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

// Apply CORS to all routes
app.use(cors(corsOptions));

// Serve static files with explicit CORS headers
app.use(
  "/Uploads",
  (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    next();
  },
  express.static(uploadsDir)
);

// Apply other middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
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
  res.status(200).json({ message: "API is running..." });
});

// === Route Imports (ALL with .js extension) ===
import planRoutes from "./route/planRoute.js";
import percentageRoutes from "./route/percentageRoute.js";
import testimonialRoutes from "./route/testimonialRoute.js";
import complaintRoutes from "./route/complaintRoute.js";
import userRoutes from "./route/usersRoute.js";
import rolesRoutes from "./route/rolesRoute.js";
import accountRoutes from "./route/accountRoute.js";
import addressRoutes from "./route/addressRoute.js";
import userSubscriptionPlanRoute from "./route/userSubscriptionPlanRoute.js";
import walletRoute from "./route/walletRoute.js";
import reportRoute from "./route/reportRoute.js";
import profileImageRoute from "./route/profileImageRoute.js";
import dashboardRoute from "./route/dashboardRoute.js";
import redeemRoute from "./route/redeemRoute.js";
import socialMediaRoutes from "./route/socialMediaRoutes.js";
import blogRoutes from "./route/blogRoute.js";

// === Register Routes with Prefix ===
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
app.use("/api/blogs", blogRoutes);

// === Global Error Handler ===
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

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// === Connect to DB and Start Server ===
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();