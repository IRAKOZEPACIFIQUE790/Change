const express = require("express");
const router = express.Router();
const { authenticateAdmin, requireRole, adminRateLimit } = require("../middleware/adminAuth");
const {
  validateAdminRegistration,
  validateMenuItem,
} = require("../middleware/validation");
const {
  registerAdmin,
  loginAdmin,
  uploadImage,
  createMenuItem,
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
  getAllOrders,
  updateOrderStatus,
  getAdminProfile,
  getNotificationCount,
  getNotifications,
  getTopItems,
  upload,
} = require("../controllers/adminController");

const AdminService = require("../services/adminService");
const ResponseHandler = require("../utils/responseHandler");
const logger = require("../utils/logger");

// Admin Authentication
router.post("/register", validateAdminRegistration, registerAdmin);
router.post("/login", loginAdmin);

// Admin Profile
router.get("/profile", authenticateAdmin, getAdminProfile);

// Enhanced Dashboard & Analytics Routes
router.get("/dashboard/stats", authenticateAdmin, getDashboardStats);
router.get("/dashboard/activity", authenticateAdmin, getRecentActivity);

// Advanced Analytics Endpoints
router.get("/analytics/dashboard", authenticateAdmin, async (req, res) => {
  try {
    const data = await AdminService.getDashboardData(req.admin.id, req.query);
    ResponseHandler.success(res, data, "Dashboard analytics retrieved successfully");
  } catch (error) {
    logger.error("Dashboard analytics error:", error);
    ResponseHandler.error(res, "Failed to get dashboard analytics");
  }
});

router.get("/analytics/menu", authenticateAdmin, async (req, res) => {
  try {
    const data = await AdminService.getMenuAnalytics(req.query);
    ResponseHandler.success(res, data, "Menu analytics retrieved successfully");
  } catch (error) {
    logger.error("Menu analytics error:", error);
    ResponseHandler.error(res, "Failed to get menu analytics");
  }
});

router.get("/analytics/orders", authenticateAdmin, async (req, res) => {
  try {
    const data = await AdminService.getOrderAnalytics(req.query);
    ResponseHandler.success(res, data, "Order analytics retrieved successfully");
  } catch (error) {
    logger.error("Order analytics error:", error);
    ResponseHandler.error(res, "Failed to get order analytics");
  }
});

router.get("/system/health", authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const data = await AdminService.getSystemHealth();
    ResponseHandler.success(res, data, "System health retrieved successfully");
  } catch (error) {
    logger.error("System health error:", error);
    ResponseHandler.error(res, "Failed to get system health");
  }
});

// Image Upload
router.post(
  "/upload-image",
  authenticateAdmin, 
  adminRateLimit(50, 15 * 60 * 1000), // 50 uploads per 15 minutes
  upload.single("image"),
  uploadImage
);

// Menu Item Management (Protected)
router.get("/menu-items", authenticateAdmin, getAllMenuItems);
router.post(
  "/menu-items",
  authenticateAdmin,
  adminRateLimit(20, 15 * 60 * 1000), // 20 creates per 15 minutes
  upload.single("image"),
  createMenuItem
);
router.put(
  "/menu-items/:id",
  authenticateAdmin,
  adminRateLimit(50, 15 * 60 * 1000), // 50 updates per 15 minutes
  validateMenuItem,
  updateMenuItem
);
router.delete("/menu-items/:id", authenticateAdmin, requireRole(['admin']), deleteMenuItem);

// Order Management (Protected)
router.get("/orders", authenticateAdmin, getAllOrders);

// Stats (Protected)
router.get("/stats/top-items", authenticateAdmin, getTopItems);

router.put("/orders/:id/status", authenticateAdmin, adminRateLimit(100, 15 * 60 * 1000), updateOrderStatus);

module.exports = router;
