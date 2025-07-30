const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Order = require("../models/Order");
const ResponseHandler = require("../utils/responseHandler");
const logger = require("../utils/logger");

// User Authentication
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    logger.info("User registration attempt:", { name, email });

    // Validate input
    if (!name || !email || !password) {
      return ResponseHandler.error(
        res,
        "Name, email, and password are required",
        400
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return ResponseHandler.conflict(
        res,
        "User with this email already exists"
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
    });

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    console.log(token);
    ResponseHandler.success(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
        },
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    logger.error("User registration error:", error);
    ResponseHandler.error(res, "Server error during registration");
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("User login attempt:", { email });

    // Validate input
    if (!email || !password) {
      return ResponseHandler.error(res, "Email and password are required", 400);
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return ResponseHandler.unauthorized(res, "Invalid credentials");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return ResponseHandler.unauthorized(res, "Invalid credentials");
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    ResponseHandler.success(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
        },
      },
      "Login successful"
    );
  } catch (error) {
    logger.error("User login error:", error);
    ResponseHandler.error(res, "Server error during login");
  }
};

// User Profile Management
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    ResponseHandler.success(res, user, "User profile retrieved successfully");
  } catch (error) {
    logger.error("Get user profile error:", error);
    ResponseHandler.error(res, "Error fetching user profile");
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const [updated] = await User.update(
      { name, phone, address },
      { where: { id: req.user.id } }
    );

    if (updated) {
      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
      });
      ResponseHandler.success(res, updatedUser, "Profile updated successfully");
    } else {
      ResponseHandler.notFound(res, "User");
    }
  } catch (error) {
    logger.error("Update user profile error:", error);
    ResponseHandler.error(res, "Error updating profile");
  }
};

// Order Management
const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      deliveryAddress,
      customerName,
      customerPhone,
      tableNumber,
      orderNotes,
      orderType,
    } = req.body;

    const order = await Order.create({
      userId: req.user.id,
      items,
      totalAmount,
      deliveryAddress,
      customerName,
      customerPhone,
      tableNumber,
      orderNotes,
      orderType: orderType || "dine-in",
    });

    ResponseHandler.success(res, order, "Order created successfully", 201);
  } catch (error) {
    logger.error("Create order error:", error);
    ResponseHandler.error(res, "Error creating order");
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    ResponseHandler.success(res, orders, "Orders retrieved successfully");
  } catch (error) {
    logger.error("Get user orders error:", error);
    ResponseHandler.error(res, "Error fetching orders");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id, userId: req.user.id },
    });

    if (!order) {
      return ResponseHandler.notFound(res, "Order");
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return ResponseHandler.error(res, "Cannot cancel this order", 400);
    }

    await Order.update(
      { status: "cancelled" },
      { where: { id, userId: req.user.id } }
    );

    ResponseHandler.success(res, null, "Order cancelled successfully");
  } catch (error) {
    logger.error("Cancel order error:", error);
    ResponseHandler.error(res, "Error cancelling order");
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  createOrder,
  getUserOrders,
  cancelOrder,
};
