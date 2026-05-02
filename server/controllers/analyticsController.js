const Product = require('../models/Product');
const PredictionLog = require('../models/PredictionLog');
const Category = require('../models/Category');
const User = require('../models/User');

// @desc    Get analytics overview
// @route   GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    // Total counts
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalPredictions = await PredictionLog.countDocuments();

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Confidence distribution (histogram buckets)
    const confidenceBuckets = await Product.aggregate([
      {
        $bucket: {
          groupBy: '$confidence',
          boundaries: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Model usage stats
    const modelUsageStats = await Product.aggregate([
      { $group: { _id: '$modelUsed', count: { $sum: 1 } } },
    ]);

    // Average confidence
    const avgConfidenceResult = await Product.aggregate([
      { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } },
    ]);
    const avgConfidence = avgConfidenceResult[0]?.avgConfidence || 0;

    // Recent predictions (last 20)
    const recentPredictions = await PredictionLog.find()
      .sort('-createdAt')
      .limit(20)
      .populate('productId', 'title');

    // Average processing time
    const avgProcessingResult = await PredictionLog.aggregate([
      { $group: { _id: null, avgTime: { $avg: '$processingTimeMs' } } },
    ]);
    const avgProcessingTime = avgProcessingResult[0]?.avgTime || 0;

    // Products over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const productsOverTime = await Product.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      overview: {
        totalProducts,
        totalCategories,
        totalUsers,
        totalPredictions,
        avgConfidence: Math.round(avgConfidence * 1000) / 1000,
        avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
      },
      categoryDistribution,
      confidenceBuckets,
      modelUsageStats,
      recentPredictions,
      productsOverTime,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get model performance stats
// @route   GET /api/analytics/model
exports.getModelStats = async (req, res) => {
  try {
    const stats = await PredictionLog.aggregate([
      {
        $group: {
          _id: '$modelUsed',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgProcessingTime: { $avg: '$processingTimeMs' },
          minConfidence: { $min: '$confidence' },
          maxConfidence: { $max: '$confidence' },
        },
      },
    ]);

    // Confidence by category
    const confidenceByCategory = await PredictionLog.aggregate([
      {
        $group: {
          _id: '$predictedCategory',
          avgConfidence: { $avg: '$confidence' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgConfidence: -1 } },
    ]);

    res.json({ modelStats: stats, confidenceByCategory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
