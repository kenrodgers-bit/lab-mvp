const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLog');

// @route   GET /api/inventory
// @desc    Get all inventory items (filtered by department for staff)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = { isActive: true };

    // Staff can only see their department's inventory
    if (req.user.role === 'staff') {
      query.department = { $in: [req.user.department, 'All'] };
    }

    // Filter by department if provided
    if (req.query.department && req.user.role === 'admin') {
      query.department = req.query.department;
    }

    // Filter by low stock
    if (req.query.lowStock === 'true') {
      const items = await Inventory.find(query).populate('addedBy', 'name email');
      const lowStockItems = items.filter(item => item.quantity <= item.minStockLevel);
      return res.json({
        success: true,
        count: lowStockItems.length,
        inventory: lowStockItems
      });
    }

    const inventory = await Inventory.find(query)
      .populate('addedBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: inventory.length,
      inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/inventory
// @desc    Add new inventory item
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      addedBy: req.user._id
    };

    const item = await Inventory.create(itemData);

    // Create audit log
    await createAuditLog({
      action: 'INVENTORY_ADDED',
      performedBy: req.user._id,
      targetInventory: item._id,
      description: `Admin ${req.user.name} added inventory item: ${item.name}`,
      details: { name: item.name, quantity: item.quantity, department: item.department },
      req
    });

    res.status(201).json({
      success: true,
      inventory: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('addedBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check if staff has access to this item
    if (req.user.role === 'staff' && 
        item.department !== req.user.department && 
        item.department !== 'All') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this inventory item'
      });
    }

    res.json({
      success: true,
      inventory: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const oldQuantity = item.quantity;
    
    item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    // Create audit log
    await createAuditLog({
      action: 'INVENTORY_UPDATED',
      performedBy: req.user._id,
      targetInventory: item._id,
      description: `Admin ${req.user.name} updated inventory item: ${item.name}`,
      details: { 
        oldQuantity, 
        newQuantity: item.quantity,
        changes: req.body 
      },
      req
    });

    res.json({
      success: true,
      inventory: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item (soft delete)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    item.isActive = false;
    await item.save();

    // Create audit log
    await createAuditLog({
      action: 'INVENTORY_DELETED',
      performedBy: req.user._id,
      targetInventory: item._id,
      description: `Admin ${req.user.name} deleted inventory item: ${item.name}`,
      req
    });

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/inventory/stats/dashboard
// @desc    Get inventory statistics
// @access  Private
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    let query = { isActive: true };
    
    if (req.user.role === 'staff') {
      query.department = { $in: [req.user.department, 'All'] };
    }

    const allItems = await Inventory.find(query);
    const totalItems = allItems.length;
    const lowStockItems = allItems.filter(item => item.quantity <= item.minStockLevel).length;
    const outOfStock = allItems.filter(item => item.quantity === 0).length;
    
    const totalValue = allItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

    // Category breakdown
    const categoryBreakdown = {};
    allItems.forEach(item => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalItems,
        lowStockItems,
        outOfStock,
        totalValue,
        categoryBreakdown
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
