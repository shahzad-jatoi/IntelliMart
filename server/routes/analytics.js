const express = require('express');
const router = express.Router();
const { getAnalytics, getModelStats } = require('../controllers/analyticsController');

router.get('/', getAnalytics);
router.get('/model', getModelStats);

module.exports = router;
