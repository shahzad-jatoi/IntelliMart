const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: 500,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  brand: {
    type: String,
    trim: true,
    default: '',
  },
  asin: {
    type: String,
    trim: true,
    default: '',
  },
  // ML-assigned category
  category: {
    type: String,
    required: true,
    index: true,
  },
  // Admin manual override
  manualCategory: {
    type: String,
    default: null,
  },
  // ML confidence score (0-1)
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  // Alternative category predictions
  altCategories: [{
    name: { type: String },
    confidence: { type: Number },
  }],
  // Which model was used for prediction
  modelUsed: {
    type: String,
    enum: ['logistic_regression', 'naive_bayes_fallback', 'ensemble_blend', 'manual', 'seeded'],
    default: 'logistic_regression',
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// Create text index for search
productSchema.index({ title: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
