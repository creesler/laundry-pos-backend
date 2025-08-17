import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema({
  Date: {
    type: Date,
    required: true
  },
  Coin: {
    type: Number,
    default: 0,
    min: 0
  },
  Hopper: {
    type: Number,
    default: 0,
    min: 0
  },
  Soap: {
    type: Number,
    default: 0,
    min: 0
  },
  Vending: {
    type: Number,
    default: 0,
    min: 0
  },
  'Drop Off Amount 1': {
    type: Number,
    default: 0,
    min: 0
  },
  'Drop Off Code': {
    type: String,
    default: ''
  },
  'Drop Off Amount 2': {
    type: Number,
    default: 0,
    min: 0
  },
  isSaved: {
    type: mongoose.Schema.Types.Mixed,
    default: true,
    get: v => typeof v === 'string' ? v === 'true' : Boolean(v)
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

// Add compound index for uniqueness
SaleSchema.index({ Date: 1, 'Drop Off Code': 1 }, { unique: true, sparse: true });

const Sale = mongoose.model('Sale', SaleSchema);
export default Sale;