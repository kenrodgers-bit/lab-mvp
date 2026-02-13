const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide item name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    enum: ['Reagent', 'Equipment', 'Consumable', 'Chemical', 'Glassware', 'Other']
  },
  department: {
    type: String,
    required: [true, 'Please provide department'],
    enum: ['Haematology', 'Microbiology', 'Chemistry', 'Pathology', 'Biochemistry', 'All']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: 0
  },
  unit: {
    type: String,
    required: [true, 'Please provide unit'],
    enum: ['pieces', 'ml', 'liters', 'grams', 'kg', 'boxes', 'bottles', 'vials', 'tubes']
  },
  minStockLevel: {
    type: Number,
    required: [true, 'Please provide minimum stock level'],
    min: 0
  },
  location: {
    type: String,
    default: ''
  },
  expiryDate: {
    type: Date
  },
  supplier: {
    type: String,
    default: ''
  },
  batchNumber: {
    type: String,
    default: ''
  },
  costPerUnit: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for low stock status
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minStockLevel;
});

// Ensure virtuals are included in JSON
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
