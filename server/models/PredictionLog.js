const mongoose = require('mongoose');

const predictionLogSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  inputText: {
    type: String,
    required: true,
  },
  predictedCategory: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  modelUsed: {
    type: String,
    enum: ['logistic_regression', 'naive_bayes_fallback', 'ensemble_blend', 'manual', 'seeded'],
    required: true,
  },
  processingTimeMs: {
    type: Number,
    default: 0,
  },
  allProbabilities: {
    type: Map,
    of: Number,
    default: {},
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PredictionLog', predictionLogSchema);
