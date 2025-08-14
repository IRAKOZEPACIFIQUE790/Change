const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

// Enhanced admin authentication with role-based access
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
    const admin = await Admin.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!admin || !admin.isActive) {
      return ResponseHandler.unauthorized(res, 'Invalid token or admin not active.');
    }

    // Add admin info to request
    req.admin = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive
    };

    // Log admin activity
    logger.info('Admin authenticated successfully', {
      adminId: admin.id,
      username: admin.username,
      endpoint: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.warn('Admin authentication failed:', error.message);
    ResponseHandler.unauthorized(res, 'Invalid token.');
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return ResponseHandler.unauthorized(res, 'Authentication required.');
    }

    const userRoles = Array.isArray(req.admin.role) ? req.admin.role : [req.admin.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      logger.warn('Admin access denied - insufficient role', {
        adminId: req.admin.id,
        userRoles,
        requiredRoles,
        endpoint: req.path
      });
      return ResponseHandler.forbidden(res, 'Insufficient permissions.');
    }

    next();
  };
};

// Rate limiting for admin actions
const adminRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const adminId = req.admin?.id;
    if (!adminId) return next();

    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(adminId)) {
      requests.set(adminId, []);
    }
    
    const adminRequests = requests.get(adminId);
    
    // Remove old requests
    const validRequests = adminRequests.filter(time => time > windowStart);
    requests.set(adminId, validRequests);
    
    if (validRequests.length >= maxRequests) {
      logger.warn('Admin rate limit exceeded', {
        adminId,
        requestCount: validRequests.length,
        endpoint: req.path
      });
      return ResponseHandler.error(res, 'Too many requests. Please try again later.', 429);
    }
    
    validRequests.push(now);
    next();
  };
};

module.exports = {
  authenticateAdmin,
  requireRole,
  adminRateLimit
};