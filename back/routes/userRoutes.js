const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  createOrder,
  getUserOrders,
  cancelOrder,
  getUserNotificationCount,
  getUserNotifications
} = require('../controllers/userController');
const { authenticateUser } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateOrder 
} = require('../middleware/validation');

// User Authentication Routes
router.post('/register', validateUserRegistration, registerUser);
router.post('/login', validateUserLogin, loginUser);

// User Profile Routes (Protected)
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);

// Notifications (Protected)
router.get('/notifications/count', authenticateUser, getUserNotificationCount);
router.get('/notifications', authenticateUser, getUserNotifications);

// Order Routes (Protected)
router.post('/orders', authenticateUser, validateOrder, createOrder);
router.get('/orders', authenticateUser, getUserOrders);
router.put('/orders/:id/cancel', authenticateUser, cancelOrder);

module.exports = router;