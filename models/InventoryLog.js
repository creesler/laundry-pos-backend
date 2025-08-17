import mongoose from 'mongoose';

const InventoryLogSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
    ref: 'Inventory'
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  updateType: {
    type: String,
    required: true,
    enum: ['restock', 'adjustment', 'usage', 'sale', 'damage', 'other']
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  updatedBy: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for better querying
InventoryLogSchema.index({ itemId: 1, timestamp: -1 });
InventoryLogSchema.index({ updateType: 1, timestamp: -1 });

// Update timestamp before saving
InventoryLogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const InventoryLog = mongoose.model('InventoryLog', InventoryLogSchema);
export default InventoryLog; 