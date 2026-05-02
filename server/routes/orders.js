const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrder, getRecommendations } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect); // All order routes require authentication

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/recommendations', getRecommendations);
router.get('/:id', getOrder);

module.exports = router;
