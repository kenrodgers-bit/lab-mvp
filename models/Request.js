const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  items: [{
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    itemName: String,
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    approvedQuantity: {
      type: Number,
      default: 0
    },
    unit: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'partially-approved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  reason: {
    type: String,
    required: [true, 'Please provide reason for request']
  },
  notes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Generate request number before saving
requestSchema.pre('save', async function(next) {
  if (!this.requestNumber) {
    const count = await mongoose.model('Request').countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.requestNumber = `REQ-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Request', requestSchema);
