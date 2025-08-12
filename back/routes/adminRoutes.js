const express = require("express");
const router = express.Router();
const { authenticateAdmin } = require("../middleware/auth");
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

// Admin Authentication
router.post("/register", validateAdminRegistration, registerAdmin);
router.post("/login", loginAdmin);

// Admin Profile
router.get("/profile", authenticateAdmin, getAdminProfile);

// Notifications
router.get("/notifications/count", authenticateAdmin, getNotificationCount);
router.get("/notifications", authenticateAdmin, getNotifications);

// Image Upload
router.post(
  "/upload-image",
  authenticateAdmin,
  upload.single("image"),
  uploadImage
);

// Menu Item Management (Protected)
router.get("/menu-items", authenticateAdmin, getAllMenuItems);
router.post(
  "/menu-items",
  authenticateAdmin,
  upload.single("image"),
  createMenuItem
);
router.put(
  "/menu-items/:id",
  authenticateAdmin,
  validateMenuItem,
  updateMenuItem
);
router.delete("/menu-items/:id", authenticateAdmin, deleteMenuItem);

// Order Management (Protected)
router.get("/orders", authenticateAdmin, getAllOrders);

// Stats (Protected)
router.get("/stats/top-items", authenticateAdmin, getTopItems);

router.put("/orders/:id/status", authenticateAdmin, updateOrderStatus);

module.exports = router;
