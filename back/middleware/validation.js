const { body, validationResult } = require("express-validator");

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  validateRequest,
];

// User login validation
const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

// Admin registration validation
const validateAdminRegistration = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validateRequest,
];

// Menu item validation
const validateMenuItem = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("prepTime").optional().trim(),
  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),
  validateRequest,
];

// Order validation
const validateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number"),
  body("customerName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Customer name must be between 2 and 100 characters"),
  body("customerPhone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("orderType")
    .optional()
    .isIn(["dine-in", "delivery"])
    .withMessage("Order type must be either dine-in or delivery"),
  body("tableNumber")
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage("Table number must be between 1 and 10 characters"),
  body("deliveryAddress")
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Delivery address must be between 5 and 500 characters"),
  body("orderNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Order notes must not exceed 1000 characters"),
  validateRequest,
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateAdminRegistration,
  validateMenuItem,
  validateOrder,
  validateRequest,
};
