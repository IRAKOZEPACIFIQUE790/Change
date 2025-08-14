const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const Admin = require("../models/Admin");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const ResponseHandler = require("../utils/responseHandler");
const logger = require("../utils/logger");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Admin Authentication
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    logger.info("Admin registration attempt:", { username, email });

    // Validate input
    if (!username || !email || !password) {
      return ResponseHandler.error(
        res,
        "Username, email, and password are required",
        400
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingAdmin) {
      return ResponseHandler.conflict(
        res,
        "Admin with this email or username already exists"
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin
    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    ResponseHandler.success(
      res,
      {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      },
      "Admin registered successfully",
      201
    );
  } catch (error) {
    logger.error("Admin registration error:", error);
    ResponseHandler.error(res, "Server error during registration");
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("Admin login attempt:", { email });

    // Validate input
    if (!email || !password) {
      return ResponseHandler.error(res, "Email and password are required", 400);
    }

    // Find admin
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return ResponseHandler.unauthorized(res, "Invalid credentials");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return ResponseHandler.unauthorized(res, "Invalid credentials");
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    ResponseHandler.success(
      res,
      {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      },
      "Login successful"
    );
  } catch (error) {
    logger.error("Admin login error:", error);
    ResponseHandler.error(res, "Server error during login");
  }
};

// Image upload endpoint
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return ResponseHandler.error(res, "No image file provided", 400);
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    ResponseHandler.success(res, { imageUrl }, "Image uploaded successfully");
  } catch (error) {
    logger.error("Image upload error:", error);
    ResponseHandler.error(res, "Error uploading image");
  }
};

// Create menu item with image support
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      prepTime,
      rating,
      popular,
      isAvailable,
    } = req.body;

    // Handle image upload if present
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const menuItem = await MenuItem.create({
      name,
      description,
      price: parseFloat(price),
      category,
      image: imageUrl,
      prepTime,
      rating: parseFloat(rating) || 0,
      popular: popular === "true" || popular === true,
      isAvailable: isAvailable !== "false" && isAvailable !== false,
    });

    ResponseHandler.success(
      res,
      menuItem,
      "Menu item created successfully",
      201
    );
  } catch (error) {
    logger.error("Create menu item error:", error);
    ResponseHandler.error(res, "Error creating menu item");
  }
};

const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll({
      order: [["createdAt", "DESC"]],
    });
    ResponseHandler.success(
      res,
      menuItems,
      "Menu items retrieved successfully"
    );
  } catch (error) {
    logger.error("Get menu items error:", error);
    ResponseHandler.error(res, "Error fetching menu items");
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await MenuItem.update(req.body, {
      where: { id },
    });

    if (updated) {
      const updatedMenuItem = await MenuItem.findByPk(id);
      ResponseHandler.success(
        res,
        updatedMenuItem,
        "Menu item updated successfully"
      );
    } else {
      ResponseHandler.notFound(res, "Menu item");
    }
  } catch (error) {
    logger.error("Update menu item error:", error);
    ResponseHandler.error(res, "Error updating menu item");
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.destroy({
      where: { id },
    });

    if (deleted) {
      ResponseHandler.success(res, null, "Menu item deleted successfully");
    } else {
      ResponseHandler.notFound(res, "Menu item");
    }
  } catch (error) {
    logger.error("Delete menu item error:", error);
    ResponseHandler.error(res, "Error deleting menu item");
  }
};

// Order Management
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
    });
    ResponseHandler.success(res, orders, "Orders retrieved successfully");
  } catch (error) {
    logger.error("Get orders error:", error);
    ResponseHandler.error(res, "Error fetching orders");
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    logger.info("Order status update attempt:", { orderId: id, status });

    const order = await Order.findByPk(id);
    if (!order) {
      return ResponseHandler.notFound(res, "Order");
    }

    order.status = status;
    await order.save();

    logger.info("Order status updated successfully:", { orderId: id, status });

    ResponseHandler.success(res, "Order status updated successfully", {
      order: {
        id: order.id,
        status: order.status,
      },
    });
  } catch (error) {
    logger.error("Error updating order status:", error);
    ResponseHandler.error(res, "Failed to update order status");
  }
};

// Get Admin Profile
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;

    logger.info("Admin profile request:", { adminId });

    if (!adminId) {
      logger.error("No admin ID found in request admin");
      return ResponseHandler.error(res, "Authentication error", 401);
    }

    const admin = await Admin.findByPk(adminId, {
      attributes: { exclude: ["password"] }, // Don't send password
    });

    if (!admin) {
      logger.error("Admin not found:", { adminId });
      return ResponseHandler.notFound(res, "Admin");
    }

    logger.info("Admin profile retrieved successfully:", { adminId });

    ResponseHandler.success(res, "Admin profile retrieved successfully", {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.username, // Use username as name for display
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (error) {
    logger.error("Error getting admin profile:", error);
    ResponseHandler.error(res, "Failed to get admin profile");
  }
};

// Get Notification Count
const getNotificationCount = async (req, res) => {
  try {
    const adminId = req.admin.id;

    logger.info("Notification count request:", { adminId });

    if (!adminId) {
      logger.error("No admin ID found in request admin");
      return ResponseHandler.error(res, "Authentication error", 401);
    }

    // Count pending orders as notifications
    const pendingOrdersCount = await Order.count({
      where: {
        status: "pending",
      },
    });

    // Count recent orders (last 24 hours) as additional notifications
    const recentOrdersCount = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const totalNotifications =
      pendingOrdersCount + Math.min(recentOrdersCount, 5); // Cap recent notifications

    logger.info("Notification count retrieved successfully:", {
      adminId,
      pendingOrders: pendingOrdersCount,
      recentOrders: recentOrdersCount,
      totalNotifications,
    });

    ResponseHandler.success(res, "Notification count retrieved successfully", {
      count: totalNotifications,
      pendingOrders: pendingOrdersCount,
      recentOrders: recentOrdersCount,
    });
  } catch (error) {
    logger.error("Error getting notification count:", error);
    ResponseHandler.error(res, "Failed to get notification count");
  }
};

// Get Notifications (Detailed)
const getNotifications = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { limit = 10, offset = 0 } = req.query;

    logger.info("Notifications request:", { adminId, limit, offset });

    // Get pending orders
    const pendingOrders = await Order.findAll({
      where: {
        status: "pending",
      },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: {
        status: {
          [Op.ne]: "pending", // Not pending
        },
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      order: [["createdAt", "DESC"]],
      limit: Math.min(parseInt(limit), 5), // Limit recent notifications
      offset: parseInt(offset),
    });

    const notifications = [
      ...pendingOrders.map((order) => ({
        id: `pending-${order.id}`,
        type: "pending_order",
        title: "New Pending Order",
        message: `Order #${order.id} from ${order.customerName}`,
        data: order,
        createdAt: order.createdAt,
        priority: "high",
      })),
      ...recentOrders.map((order) => ({
        id: `recent-${order.id}`,
        type: "recent_order",
        title: "Recent Order",
        message: `Order #${order.id} from ${order.customerName}`,
        data: order,
        createdAt: order.createdAt,
        priority: "medium",
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    logger.info("Notifications retrieved successfully:", {
      adminId,
      totalNotifications: notifications.length,
    });

    ResponseHandler.success(
      res,
      {
        notifications,
        total: notifications.length,
      },
      "Notifications retrieved successfully"
    );
  } catch (error) {
    logger.error("Error getting notifications:", error);
    ResponseHandler.error(res, "Failed to get notifications");
  }
};

// Enhanced Statistics Functions
const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { days = 30 } = req.query;
    
    const dateFilter = {
      createdAt: {
        [Op.gte]: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
      }
    };

    // Basic stats
    const [totalOrders, totalRevenue, totalMenuItems, activeMenuItems] = await Promise.all([
      Order.count({ where: dateFilter }),
      Order.sum('totalAmount', { where: { ...dateFilter, status: { [Op.ne]: 'cancelled' } } }),
      MenuItem.count(),
      MenuItem.count({ where: { isAvailable: true } })
    ]);

    // Orders by status
    const ordersByStatus = await Order.findAll({
      where: dateFilter,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      group: ['status'],
      raw: true
    });

    // Orders by type
    const ordersByType = await Order.findAll({
      where: dateFilter,
      attributes: [
        'orderType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      group: ['orderType'],
      raw: true
    });

    // Daily revenue trend (last 7 days)
    const dailyRevenue = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Peak hours analysis
    const peakHours = await Order.findAll({
      where: dateFilter,
      attributes: [
        [sequelize.fn('HOUR', sequelize.col('createdAt')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('HOUR', sequelize.col('createdAt'))],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });

    // Category performance
    const categoryStats = await sequelize.query(`
      SELECT 
        mi.category,
        COUNT(DISTINCT o.id) as order_count,
        SUM(CAST(JSON_EXTRACT(item.value, '$.quantity') AS INTEGER)) as total_quantity,
        SUM(CAST(JSON_EXTRACT(item.value, '$.quantity') AS INTEGER) * CAST(JSON_EXTRACT(item.value, '$.price') AS DECIMAL(10,2))) as total_revenue
      FROM orders o
      CROSS JOIN JSON_EACH(o.items) as item
      JOIN menu_items mi ON mi.id = CAST(JSON_EXTRACT(item.value, '$.id') AS INTEGER)
      WHERE o.createdAt >= DATE('now', '-${parseInt(days)} days')
        AND o.status != 'cancelled'
      GROUP BY mi.category
      ORDER BY total_revenue DESC
    `, { type: sequelize.QueryTypes.SELECT });

    ResponseHandler.success(res, {
      overview: {
        totalOrders: totalOrders || 0,
        totalRevenue: parseFloat(totalRevenue) || 0,
        totalMenuItems: totalMenuItems || 0,
        activeMenuItems: activeMenuItems || 0,
        averageOrderValue: totalOrders > 0 ? (parseFloat(totalRevenue) || 0) / totalOrders : 0
      },
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: parseInt(item.count),
        revenue: parseFloat(item.revenue) || 0
      })),
      ordersByType: ordersByType.map(item => ({
        type: item.orderType,
        count: parseInt(item.count),
        revenue: parseFloat(item.revenue) || 0
      })),
      dailyRevenue: dailyRevenue.map(item => ({
        date: item.date,
        orders: parseInt(item.orders),
        revenue: parseFloat(item.revenue) || 0
      })),
      peakHours: peakHours.map(item => ({
        hour: parseInt(item.hour),
        count: parseInt(item.count)
      })),
      categoryStats: categoryStats.map(item => ({
        category: item.category,
        orderCount: parseInt(item.order_count),
        totalQuantity: parseInt(item.total_quantity),
        totalRevenue: parseFloat(item.total_revenue) || 0
      }))
    }, "Dashboard statistics retrieved successfully");

  } catch (error) {
    logger.error("Error getting dashboard stats:", error);
    ResponseHandler.error(res, "Failed to get dashboard statistics");
  }
};

// Get Recent Activity
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const recentOrders = await Order.findAll({
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'customerName', 'totalAmount', 'status', 'orderType', 'createdAt']
    });

    const recentMenuItems = await MenuItem.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'category', 'price', 'isAvailable', 'createdAt']
    });

    ResponseHandler.success(res, {
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        customerName: order.customerName,
        totalAmount: parseFloat(order.totalAmount),
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
        timeAgo: getTimeAgo(order.createdAt)
      })),
      recentMenuItems: recentMenuItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: parseFloat(item.price),
        isAvailable: item.isAvailable,
        createdAt: item.createdAt,
        timeAgo: getTimeAgo(item.createdAt)
      }))
    }, "Recent activity retrieved successfully");

  } catch (error) {
    logger.error("Error getting recent activity:", error);
    ResponseHandler.error(res, "Failed to get recent activity");
  }
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
};

// Enhanced Menu Management
const getMenuItemsWithStats = async (req, res) => {
  try {
    const { category, search, sortBy = 'createdAt', order = 'DESC', limit = 50, offset = 0 } = req.query;
    
    let whereClause = {};
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const menuItems = await MenuItem.findAll({
      where: whereClause,
      order: [[sortBy, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get order statistics for each menu item
    const menuItemsWithStats = await Promise.all(
      menuItems.map(async (item) => {
        const orderStats = await sequelize.query(`
          SELECT 
            COUNT(DISTINCT o.id) as order_count,
            SUM(CAST(JSON_EXTRACT(item.value, '$.quantity') AS INTEGER)) as total_quantity,
            SUM(CAST(JSON_EXTRACT(item.value, '$.quantity') AS INTEGER) * CAST(JSON_EXTRACT(item.value, '$.price') AS DECIMAL(10,2))) as total_revenue
          FROM orders o
          CROSS JOIN JSON_EACH(o.items) as item
          WHERE CAST(JSON_EXTRACT(item.value, '$.id') AS INTEGER) = ${item.id}
            AND o.status != 'cancelled'
            AND o.createdAt >= DATE('now', '-30 days')
        `, { type: sequelize.QueryTypes.SELECT });

        const stats = orderStats[0] || { order_count: 0, total_quantity: 0, total_revenue: 0 };
        
        return {
          ...item.toJSON(),
          stats: {
            orderCount: parseInt(stats.order_count) || 0,
            totalQuantity: parseInt(stats.total_quantity) || 0,
            totalRevenue: parseFloat(stats.total_revenue) || 0
          }
        };
      })
    );

    const total = await MenuItem.count({ where: whereClause });

    ResponseHandler.success(res, {
      items: menuItemsWithStats,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }, "Menu items with statistics retrieved successfully");

  } catch (error) {
    logger.error("Error getting menu items with stats:", error);
    ResponseHandler.error(res, "Failed to get menu items with statistics");
  }
};

// Enhanced Order Management
const getOrdersWithFilters = async (req, res) => {
  try {
    const { 
      status, 
      orderType, 
      dateFrom, 
      dateTo, 
      search,
      sortBy = 'createdAt',
      order = 'DESC',
      limit = 50,
      offset = 0
    } = req.query;

    let whereClause = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (orderType && orderType !== 'all') {
      whereClause.orderType = orderType;
    }
    
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
    }
    
    if (search) {
      whereClause[Op.or] = [
        { customerName: { [Op.iLike]: `%${search}%` } },
        { customerPhone: { [Op.iLike]: `%${search}%` } },
        { id: { [Op.eq]: parseInt(search) || 0 } }
      ];
    }

    const orders = await Order.findAll({
      where: whereClause,
      order: [[sortBy, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Order.count({ where: whereClause });

    ResponseHandler.success(res, {
      orders: orders.map(order => ({
        ...order.toJSON(),
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
        timeAgo: getTimeAgo(order.createdAt)
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }, "Orders retrieved successfully");

  } catch (error) {
    logger.error("Error getting orders with filters:", error);
    ResponseHandler.error(res, "Failed to get orders");
  }
};

// Stats: Top Ordered Items
const getTopItems = async (req, res) => {
  try {
    const {
      days = "7",
      status = "delivered",
      rankBy = "quantity",
      limit = "5",
    } = req.query;

    const daysNum = parseInt(days, 10);
    const lim = Math.min(parseInt(limit, 10) || 5, 50); // cap to 50

    const where = {};
    if (!isNaN(daysNum) && daysNum > 0) {
      where.createdAt = {
        [Op.gte]: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
      };
    }
    if (status && status !== "all") {
      where.status = status;
    }

    const orders = await Order.findAll({
      where,
      attributes: ["id", "items", "totalAmount", "status", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    const aggregates = new Map();
    for (const order of orders) {
      const items = order.items || [];
      for (const it of items) {
        const id = Number(it.id);
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const name = it.name || `Item ${id}`;
        if (!aggregates.has(id)) {
          aggregates.set(id, { id, name, totalQuantity: 0, totalRevenue: 0 });
        }
        const cur = aggregates.get(id);
        cur.totalQuantity += qty;
        cur.totalRevenue += qty * price;
      }
    }

    const itemsArr = Array.from(aggregates.values());
    itemsArr.sort((a, b) => {
      if (rankBy === "revenue") return b.totalRevenue - a.totalRevenue;
      return b.totalQuantity - a.totalQuantity;
    });

    const top = itemsArr.slice(0, lim);
    ResponseHandler.success(res, top, "Top items computed successfully");
  } catch (error) {
    logger.error("Error computing top items:", error);
    ResponseHandler.error(res, "Failed to compute top items");
  }
};

module.exports = {
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
  getDashboardStats,
  getRecentActivity,
  getMenuItemsWithStats,
  getOrdersWithFilters,
  getTopItems,
  upload,
};