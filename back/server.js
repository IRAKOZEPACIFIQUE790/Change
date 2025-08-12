const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, ".env") });

const sequelize = require("./config/database");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const publicRoutes = require("./routes/publicRoutes");
const logger = require("./utils/logger");
const ResponseHandler = require("./utils/responseHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 1000 requests for dev, 100 for production
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn("Blocked by CORS:", { origin });
        callback(null, true); // Allow for development - change in production
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    body: req.method === "POST" || req.method === "PUT" ? "present" : "none",
  });
  next();
});

// Routes
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// 404 handler
app.use("*", (req, res) => {
  ResponseHandler.notFound(res, "API endpoint");
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  ResponseHandler.error(
    res,
    process.env.NODE_ENV === "development"
      ? err.message
      : "Internal server error",
    500
  );
});

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connections
    await sequelize.authenticate();
    logger.info("MySQL database connection established successfully.");

    // Sync database models
    await sequelize.sync({ alter: true });
    logger.info("Database synced successfully.");

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(
        `📊 Health check: http://localhost:${PORT}/api/public/health`
      );
      logger.info(`👑 Admin API: http://localhost:${PORT}/api/admin`);
      logger.info(`👤 User API: http://localhost:${PORT}/api/user`);
      logger.info(`🌐 Public API: http://localhost:${PORT}/api/public`);
      logger.info(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

startServer();
