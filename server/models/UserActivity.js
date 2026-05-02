const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Allow anonymous tracking
  },
  sessionId: {
    type: String,
    default: null, // For anonymous users
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  eventType: {
    type: String,
    enum: ['view', 'click', 'search', 'purchase', 'category_filter'],
    required: true,
  },
  category: {
    type: String,
    default: null,
  },
  searchQuery: {
    type: String,
    default: null,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for efficient querying by user
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ eventType: 1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
