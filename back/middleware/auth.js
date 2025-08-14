const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

// Legacy admin auth - use adminAuth.js for new implementations
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    logger.debug('Admin auth attempt, token present:', !!token);
    
    if (!token) {
      return ResponseHandler.unauthorized(res, 'Access denied. No token provided.');
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET is not configured');
      return ResponseHandler.error(res, 'Server configuration error');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id);
    
    if (!admin || !admin.isActive) {
      return ResponseHandler.unauthorized(res, 'Invalid token or admin not active.');
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.warn('Admin authentication failed:', error.message);
    ResponseHandler.unauthorized(res, 'Invalid token.');
  }
};

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    logger.debug('User auth attempt, token present:', !!token);
    
    if (!token) {
      return ResponseHandler.unauthorized(res, 'Access denied. No token provided.');
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET is not configured');
      return ResponseHandler.error(res, 'Server configuration error');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      return ResponseHandler.unauthorized(res, 'Invalid token or user not active.');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn('User authentication failed:', error.message);
    ResponseHandler.unauthorized(res, 'Invalid token.');
  }
};

module.exports = {
  authenticateAdmin,
  authenticateUser
};