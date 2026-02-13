const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/audit
// @desc    Get audit logs
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, startDate, endDate, limit = 100 } = req.query;

    let query = {};

    // Filter by action type
    if (action) {
      query.action = action;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email')
      .populate('targetInventory', 'name')
      .populate('targetRequest', 'requestNumber')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/audit/user/:userId
// @desc    Get audit logs for specific user
// @access  Private/Admin
router.get('/user/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find({ performedBy: req.params.userId })
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email')
      .populate('targetInventory', 'name')
      .populate('targetRequest', 'requestNumber')
      .sort('-createdAt')
      .limit(100);

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/audit/stats
// @desc    Get audit statistics
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    
    const actionCounts = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await AuditLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        totalLogs,
        recentActivity,
        actionBreakdown: actionCounts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
