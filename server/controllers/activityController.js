const UserActivity = require('../models/UserActivity');
const axios = require('axios');
const config = require('../config');

// @desc    Log user activity (fire-and-forget from frontend)
// @route   POST /api/activity
exports.logActivity = async (req, res) => {
  try {
    const { productId, eventType, category, searchQuery, durationSeconds, sessionId } = req.body;

    // Create activity log silently
    await UserActivity.create({
      userId: req.user ? req.user._id : null,
      sessionId: sessionId || null,
      productId: productId || null,
      eventType,
      category: category || null,
      searchQuery: searchQuery || null,
      durationSeconds: durationSeconds || 0,
    });

    res.status(201).json({ status: 'logged' });
  } catch (error) {
    // Don't fail - activity logging is non-critical
    console.error('Activity logging error:', error.message);
    res.status(200).json({ status: 'skipped' });
  }
};

// @desc    Get recommendations for a user (stub - calls model service)
// @route   POST /api/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.body;

    // Call the recommendation model service
    const response = await axios.post(`${config.modelServiceUrl}/recommend`, {
      user_id: userId,
    });

    res.json(response.data);
  } catch (error) {
    // Return placeholder when recommendation service is not ready
    res.json({
      recommendations: [],
      status: 'model_not_ready',
      message: 'Recommendation system is under development.',
    });
  }
};

// @desc    Get user activity history
// @route   GET /api/activity/history
exports.getActivityHistory = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const limit = parseInt(req.query.limit) || 50;

    const activities = await UserActivity.find(userId ? { userId } : {})
      .sort('-createdAt')
      .limit(limit)
      .populate('productId', 'title category');

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
