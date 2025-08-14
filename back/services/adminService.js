const AdminHelpers = require('../utils/adminHelpers');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Admin = require('../models/Admin');

// Service layer for admin operations - better separation of concerns

class AdminService {
  // Dashboard service
  static async getDashboardData(adminId, filters = {}) {
    try {
      const { period = 'month', includeComparisons = true } = filters;
      
      // Get performance metrics with comparisons
      const performanceMetrics = includeComparisons 
        ? await AdminHelpers.getPerformanceMetrics(period)
        : await AdminHelpers.calculateRevenue(AdminHelpers.getDateRange(period));

      // Get inventory alerts
      const inventoryAlerts = await AdminHelpers.getInventoryAlerts();

      // Get customer insights
      const customerInsights = await AdminHelpers.getCustomerInsights(30);

      // Get order status flow
      const orderStatusFlow = await AdminHelpers.getOrderStatusFlow(30);

      return {
        performanceMetrics,
        inventoryAlerts,
        customerInsights,
        orderStatusFlow,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('AdminService.getDashboardData error:', error);
      throw new Error('Failed to generate dashboard data');
    }
  }

  // Menu management service
  static async getMenuAnalytics(filters = {}) {
    try {
      const { category, period = 30 } = filters;
      
      let whereClause = {};
      if (category && category !== 'all') {
        whereClause.category = category;
      }

      const menuItems = await MenuItem.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      // Get performance data for each item
      const menuAnalytics = await Promise.all(
        menuItems.map(async (item) => {
          const performance = await AdminHelpers.getMenuItemPerformance(item.id, period);
          const totalOrders = performance.reduce((sum, day) => sum + day.orderCount, 0);
          const totalQuantity = performance.reduce((sum, day) => sum + day.totalQuantity, 0);
          const totalRevenue = performance.reduce((sum, day) => sum + day.totalRevenue, 0);

          return {
            ...item.toJSON(),
            analytics: {
              totalOrders,
              totalQuantity,
              totalRevenue,
              averageOrdersPerDay: performance.length > 0 ? totalOrders / performance.length : 0,
              performanceHistory: performance
            }
          };
        })
      );

      // Sort by performance
      menuAnalytics.sort((a, b) => b.analytics.totalRevenue - a.analytics.totalRevenue);

      return {
        items: menuAnalytics,
        summary: {
          totalItems: menuAnalytics.length,
          activeItems: menuAnalytics.filter(item => item.isAvailable).length,
          topPerformer: menuAnalytics[0] || null,
          totalRevenue: menuAnalytics.reduce((sum, item) => sum + item.analytics.totalRevenue, 0)
        }
      };
    } catch (error) {
      logger.error('AdminService.getMenuAnalytics error:', error);
      throw new Error('Failed to generate menu analytics');
    }
  }

  // Order management service
  static async getOrderAnalytics(filters = {}) {
    try {
      const { 
        status, 
        orderType, 
        period = 30,
        groupBy = 'day' 
      } = filters;

      const dateFilter = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
      let whereClause = {
        createdAt: { [Op.gte]: dateFilter }
      };

      if (status && status !== 'all') {
        whereClause.status = status;
      }
      if (orderType && orderType !== 'all') {
        whereClause.orderType = orderType;
      }

      // Get orders with grouping
      let groupByClause;
      let dateFormat;
      
      switch (groupBy) {
        case 'hour':
          groupByClause = [sequelize.fn('HOUR', sequelize.col('createdAt'))];
          dateFormat = 'HOUR';
          break;
        case 'day':
          groupByClause = [sequelize.fn('DATE', sequelize.col('createdAt'))];
          dateFormat = 'DATE';
          break;
        case 'week':
          groupByClause = [sequelize.fn('WEEK', sequelize.col('createdAt'))];
          dateFormat = 'WEEK';
          break;
        case 'month':
          groupByClause = [sequelize.fn('MONTH', sequelize.col('createdAt'))];
          dateFormat = 'MONTH';
          break;
        default:
          groupByClause = [sequelize.fn('DATE', sequelize.col('createdAt'))];
          dateFormat = 'DATE';
      }

      const orderTrends = await Order.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn(dateFormat, sequelize.col('createdAt')), 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
          [sequelize.fn('AVG', sequelize.col('totalAmount')), 'avgOrderValue']
        ],
        group: groupByClause,
        order: [[sequelize.fn(dateFormat, sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      // Get status distribution
      const statusDistribution = await Order.findAll({
        where: { createdAt: { [Op.gte]: dateFilter } },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
        ],
        group: ['status'],
        raw: true
      });

      // Get order type distribution
      const typeDistribution = await Order.findAll({
        where: { createdAt: { [Op.gte]: dateFilter } },
        attributes: [
          'orderType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
        ],
        group: ['orderType'],
        raw: true
      });

      return {
        trends: orderTrends.map(item => ({
          period: item.period,
          orderCount: parseInt(item.orderCount),
          revenue: parseFloat(item.revenue) || 0,
          avgOrderValue: parseFloat(item.avgOrderValue) || 0
        })),
        statusDistribution: statusDistribution.map(item => ({
          status: item.status,
          count: parseInt(item.count),
          revenue: parseFloat(item.revenue) || 0
        })),
        typeDistribution: typeDistribution.map(item => ({
          type: item.orderType,
          count: parseInt(item.count),
          revenue: parseFloat(item.revenue) || 0
        }))
      };
    } catch (error) {
      logger.error('AdminService.getOrderAnalytics error:', error);
      throw new Error('Failed to generate order analytics');
    }
  }

  // Admin activity logging
  static async logAdminActivity(adminId, action, details = {}) {
    try {
      logger.info('Admin activity logged', {
        adminId,
        action,
        details,
        timestamp: new Date().toISOString()
      });

      // Here you could also save to a dedicated admin_activity_logs table
      // if you want to persist admin actions for audit purposes
      
      return true;
    } catch (error) {
      logger.error('AdminService.logAdminActivity error:', error);
      return false;
    }
  }

  // System health check
  static async getSystemHealth() {
    try {
      const [
        totalOrders,
        totalMenuItems,
        totalAdmins,
        recentErrors
      ] = await Promise.all([
        Order.count(),
        MenuItem.count(),
        Admin.count(),
        // You could implement error tracking here
        Promise.resolve(0)
      ]);

      const dbHealth = await sequelize.authenticate()
        .then(() => 'healthy')
        .catch(() => 'unhealthy');

      return {
        database: dbHealth,
        statistics: {
          totalOrders,
          totalMenuItems,
          totalAdmins,
          recentErrors
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('AdminService.getSystemHealth error:', error);
      throw new Error('Failed to get system health');
    }
  }
}

module.exports = AdminService;