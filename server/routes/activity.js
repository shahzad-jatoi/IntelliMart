const express = require('express');
const router = express.Router();
const { logActivity, getRecommendations, getActivityHistory } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

// Activity logging - accepts both authenticated and anonymous requests
router.post('/', logActivity);
router.post('/recommend', getRecommendations);
router.get('/history', protect, getActivityHistory);

module.exports = router;
