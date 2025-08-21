// server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const helmet = require("helmet");
const morgan = require("morgan");


// Load environment variables
dotenv.config();

const app = express();

// Apply Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Request logging
// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Add PATCH here
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

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

// Register Routes with Prefix
app.use("/api/plans", planRoutes);
app.use("/api/percentages", percentageRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);         // Changed from /userRoutes
app.use("/api/roles", rolesRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/address", addressRoutes);
app.use('/Uploads', express.static('Uploads'));
// Connect to DB and then Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1); // Exit process with failure
  }
};

startServer();
