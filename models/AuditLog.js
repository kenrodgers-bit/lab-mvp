const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DEACTIVATED',
      'INVENTORY_ADDED',
      'INVENTORY_UPDATED',
      'INVENTORY_DELETED',
      'REQUEST_CREATED',
      'REQUEST_APPROVED',
      'REQUEST_PARTIALLY_APPROVED',
      'REQUEST_REJECTED',
      'STOCK_ADJUSTED',
      'PASSWORD_RESET',
      'REPORT_GENERATED'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetInventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  targetRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
