const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Inventory = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLog');

// @route   GET /api/requests
// @desc    Get all requests
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Staff can only see their own requests
    if (req.user.role === 'staff') {
      query.requestedBy = req.user._id;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const requests = await Request.find(query)
      .populate('requestedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .populate('items.inventory', 'name unit')
      .sort('-createdAt');

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/requests
// @desc    Create new request
// @access  Private/Staff
router.post('/', protect, async (req, res) => {
  try {
    const { items, reason, priority, notes } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one item'
      });
    }

    // Enrich items with inventory data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const inventory = await Inventory.findById(item.inventory);
        if (!inventory) {
          throw new Error(`Inventory item ${item.inventory} not found`);
        }
        return {
          inventory: item.inventory,
          itemName: inventory.name,
          requestedQuantity: item.requestedQuantity,
          unit: inventory.unit
        };
      })
    );

    const request = await Request.create({
      requestedBy: req.user._id,
      department: req.user.department,
      items: enrichedItems,
      reason,
      priority: priority || 'medium',
      notes
    });

    // Create audit log
    await createAuditLog({
      action: 'REQUEST_CREATED',
      performedBy: req.user._id,
      targetRequest: request._id,
      description: `${req.user.name} created request ${request.requestNumber}`,
      details: { items: enrichedItems, priority },
      req
    });

    const populatedRequest = await Request.findById(request._id)
      .populate('requestedBy', 'name email department')
      .populate('items.inventory', 'name unit');

    res.status(201).json({
      success: true,
      request: populatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/requests/:id
// @desc    Get single request
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requestedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .populate('items.inventory', 'name unit quantity');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if staff has access to this request
    if (req.user.role === 'staff' && 
        request.requestedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/requests/:id/review
// @desc    Approve or reject request (with quantity adjustment)
// @access  Private/Admin
router.put('/:id/review', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNotes, rejectionReason, items } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been reviewed'
      });
    }

    // Validate status
    if (!['approved', 'partially-approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Handle rejection
    if (status === 'rejected') {
      request.status = 'rejected';
      request.rejectionReason = rejectionReason;
      request.reviewedBy = req.user._id;
      request.reviewedAt = Date.now();
      request.adminNotes = adminNotes;
      await request.save();

      await createAuditLog({
        action: 'REQUEST_REJECTED',
        performedBy: req.user._id,
        targetRequest: request._id,
        description: `Admin ${req.user.name} rejected request ${request.requestNumber}`,
        details: { reason: rejectionReason },
        req
      });

      return res.json({
        success: true,
        request
      });
    }

    // Handle approval or partial approval
    let allFullyApproved = true;
    
    for (let i = 0; i < request.items.length; i++) {
      const requestItem = request.items[i];
      const approvedQty = items[i]?.approvedQuantity || requestItem.requestedQuantity;
      
      // Update approved quantity
      request.items[i].approvedQuantity = approvedQty;
      
      if (approvedQty < requestItem.requestedQuantity) {
        allFullyApproved = false;
      }

      // Update inventory
      const inventory = await Inventory.findById(requestItem.inventory);
      if (inventory) {
        if (inventory.quantity < approvedQty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${inventory.name}. Available: ${inventory.quantity}, Requested: ${approvedQty}`
          });
        }
        inventory.quantity -= approvedQty;
        inventory.lastUpdatedBy = req.user._id;
        await inventory.save();

        // Log stock adjustment
        await createAuditLog({
          action: 'STOCK_ADJUSTED',
          performedBy: req.user._id,
          targetInventory: inventory._id,
          description: `Stock adjusted for ${inventory.name} due to request ${request.requestNumber}`,
          details: { quantityReleased: approvedQty },
          req
        });
      }
    }

    request.status = allFullyApproved ? 'approved' : 'partially-approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = Date.now();
    request.adminNotes = adminNotes;
    await request.save();

    const action = allFullyApproved ? 'REQUEST_APPROVED' : 'REQUEST_PARTIALLY_APPROVED';
    await createAuditLog({
      action,
      performedBy: req.user._id,
      targetRequest: request._id,
      description: `Admin ${req.user.name} ${allFullyApproved ? 'approved' : 'partially approved'} request ${request.requestNumber}`,
      details: { items: request.items },
      req
    });

    const populatedRequest = await Request.findById(request._id)
      .populate('requestedBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .populate('items.inventory', 'name unit');

    res.json({
      success: true,
      request: populatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/requests/stats/dashboard
// @desc    Get request statistics
// @access  Private
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'staff') {
      query.requestedBy = req.user._id;
    }

    const allRequests = await Request.find(query);
    
    const stats = {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === 'pending').length,
      approved: allRequests.filter(r => r.status === 'approved').length,
      partiallyApproved: allRequests.filter(r => r.status === 'partially-approved').length,
      rejected: allRequests.filter(r => r.status === 'rejected').length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
