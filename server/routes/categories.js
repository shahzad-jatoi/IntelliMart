const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  getCategoryProducts,
  syncCounts,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.get('/:name/products', getCategoryProducts);
router.post('/sync-counts', protect, adminOnly, syncCounts);

module.exports = router;
