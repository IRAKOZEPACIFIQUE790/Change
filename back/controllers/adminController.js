const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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
        [require("sequelize").Op.or]: [{ email }, { username }],
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
      return ResponseHandler.error(res, 'No image file provided', 400);
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    ResponseHandler.success(res, { imageUrl }, 'Image uploaded successfully');
  } catch (error) {
    logger.error('Image upload error:', error);
    ResponseHandler.error(res, 'Error uploading image');
  }
};

// Create menu item with image support
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, prepTime, rating, popular, isAvailable } = req.body;
    
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
      popular: popular === 'true' || popular === true,
      isAvailable: isAvailable !== 'false' && isAvailable !== false
    });

    ResponseHandler.success(res, menuItem, 'Menu item created successfully', 201);
  } catch (error) {
    logger.error('Create menu item error:', error);
    ResponseHandler.error(res, 'Error creating menu item');
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

    const [updated] = await Order.update(
      { status },
      {
        where: { id },
      }
    );

    if (updated) {
      const updatedOrder = await Order.findByPk(id);
      ResponseHandler.success(
        res,
        updatedOrder,
        "Order status updated successfully"
      );
    } else {
      ResponseHandler.notFound(res, "Order");
    }
  } catch (error) {
    logger.error("Update order status error:", error);
    ResponseHandler.error(res, "Error updating order status");
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
  upload
};
