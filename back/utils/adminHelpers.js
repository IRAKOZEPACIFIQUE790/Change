const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const logger = require('./logger');

// Admin utility functions for better organization

class AdminHelpers {
  // Date range utilities
  static getDateRange(period) {
    const now = new Date();
    const ranges = {
      today: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      },
      yesterday: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      },
      week: {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      },
      month: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      },
      quarter: {
        start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
        end: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1)
      },
      year: {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear() + 1, 0, 1)
      }
    };
    
    return ranges[period] || ranges.month;
  }

  // Revenue calculations
  static async calculateRevenue(dateRange, filters = {}) {
    try {
      const whereClause = {
        createdAt: {
          [Op.gte]: dateRange.start,
          [Op.lt]: dateRange.end
        },
        status: { [Op.ne]: 'cancelled' },
        ...filters
      };

      const result = await Order.findOne({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
          [sequelize.fn('AVG', sequelize.col('totalAmount')), 'averageOrderValue']
        ],
        raw: true
      });

      return {
        orderCount: parseInt(result.orderCount) || 0,
        totalRevenue: parseFloat(result.totalRevenue) || 0,
        averageOrderValue: parseFloat(result.averageOrderValue) || 0
      };
    } catch (error) {
      logger.error('Error calculating revenue:', error);
      return { orderCount: 0, totalRevenue: 0, averageOrderValue: 0 };
    }
  }

  // Menu item performance analysis
  static async getMenuItemPerformance(itemId, days = 30) {
    try {
      const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const performance = await sequelize.query(`
        SELECT 
          COUNT(DISTINCT o.id) as order_count,
          SUM(CAST(JSON_EXTRACT(item.value, '$.quantity') AS INTEGER)) as total_quantity,
          SUM(CAST(JSON_EXTRACT(item.value, '$.quantity') AS INTEGER) * CAST(JSON_EXTRACT(item.value, '$.price') AS DECIMAL(10,2))) as total_revenue,
          AVG(CAST(JSON_EXTRACT(item.value, '$.quantity') AS INTEGER)) as avg_quantity_per_order,
          DATE(o.createdAt) as order_date,
          COUNT(DISTINCT DATE(o.createdAt)) as active_days
        FROM orders o
        CROSS JOIN JSON_EACH(o.items) as item
        WHERE CAST(JSON_EXTRACT(item.value, '$.id') AS INTEGER) = ?
          AND o.status != 'cancelled'
          AND o.createdAt >= ?
        GROUP BY DATE(o.createdAt)
        ORDER BY order_date DESC
      `, {
        replacements: [itemId, dateFilter],
        type: sequelize.QueryTypes.SELECT
      });

      return performance.map(item => ({
        date: item.order_date,
        orderCount: parseInt(item.order_count),
        totalQuantity: parseInt(item.total_quantity),
        totalRevenue: parseFloat(item.total_revenue),
        avgQuantityPerOrder: parseFloat(item.avg_quantity_per_order)
      }));
    } catch (error) {
      logger.error('Error getting menu item performance:', error);
      return [];
    }
  }

  // Order status transitions
  static async getOrderStatusFlow(days = 30) {
    try {
      const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const statusFlow = await Order.findAll({
        where: {
          createdAt: { [Op.gte]: dateFilter }
        },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.literal('JULIANDAY("updatedAt") - JULIANDAY("createdAt")')), 'avgProcessingTime']
        ],
        group: ['status'],
        raw: true
      });

      return statusFlow.map(item => ({
        status: item.status,
        count: parseInt(item.count),
        avgProcessingTime: parseFloat(item.avgProcessingTime) || 0
      }));
    } catch (error) {
      logger.error('Error getting order status flow:', error);
      return [];
    }
  }

  // Customer insights
  static async getCustomerInsights(days = 30) {
    try {
      const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const insights = await Order.findAll({
        where: {
          createdAt: { [Op.gte]: dateFilter },
          status: { [Op.ne]: 'cancelled' }
        },
        attributes: [
          'customerName',
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSpent'],
          [sequelize.fn('AVG', sequelize.col('totalAmount')), 'avgOrderValue']
        ],
        group: ['customerName'],
        having: sequelize.literal('COUNT(id) > 1'), // Only repeat customers
        order: [[sequelize.fn('SUM', sequelize.col('totalAmount')), 'DESC']],
        limit: 20,
        raw: true
      });

      return insights.map(item => ({
        customerName: item.customerName,
        orderCount: parseInt(item.orderCount),
        totalSpent: parseFloat(item.totalSpent),
        avgOrderValue: parseFloat(item.avgOrderValue)
      }));
    } catch (error) {
      logger.error('Error getting customer insights:', error);
      return [];
    }
  }

  // Inventory alerts
  static async getInventoryAlerts() {
    try {
      const lowStockItems = await MenuItem.findAll({
        where: {
          isAvailable: false
        },
        attributes: ['id', 'name', 'category', 'price'],
        raw: true
      });

      const popularUnavailableItems = await sequelize.query(`
        SELECT 
          mi.id,
          mi.name,
          mi.category,
          mi.price,
          COUNT(DISTINCT o.id) as recent_demand
        FROM menu_items mi
        CROSS JOIN orders o
        CROSS JOIN JSON_EACH(o.items) as item
        WHERE mi.isAvailable = false
          AND CAST(JSON_EXTRACT(item.value, '$.id') AS INTEGER) = mi.id
          AND o.createdAt >= DATE('now', '-7 days')
          AND o.status != 'cancelled'
        GROUP BY mi.id, mi.name, mi.category, mi.price
        HAVING recent_demand > 0
        ORDER BY recent_demand DESC
      `, { type: sequelize.QueryTypes.SELECT });

      return {
        lowStockItems,
        popularUnavailableItems: popularUnavailableItems.map(item => ({
          ...item,
          recentDemand: parseInt(item.recent_demand)
        }))
      };
    } catch (error) {
      logger.error('Error getting inventory alerts:', error);
      return { lowStockItems: [], popularUnavailableItems: [] };
    }
  }

  // Performance metrics
  static async getPerformanceMetrics(period = 'month') {
    try {
      const currentRange = this.getDateRange(period);
      const previousRange = {
        start: new Date(currentRange.start.getTime() - (currentRange.end.getTime() - currentRange.start.getTime())),
        end: currentRange.start
      };

      const [currentMetrics, previousMetrics] = await Promise.all([
        this.calculateRevenue(currentRange),
        this.calculateRevenue(previousRange)
      ]);

      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        current: currentMetrics,
        previous: previousMetrics,
        growth: {
          orderCount: calculateGrowth(currentMetrics.orderCount, previousMetrics.orderCount),
          totalRevenue: calculateGrowth(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
          averageOrderValue: calculateGrowth(currentMetrics.averageOrderValue, previousMetrics.averageOrderValue)
        }
      };
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      return null;
    }
  }
}

module.exports = AdminHelpers;