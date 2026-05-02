const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getSellerProducts,
  reclassifyProduct,
} = require('../controllers/productController');
const { protect, adminOnly, sellerOrAdmin } = require('../middleware/auth');

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes
router.post('/', protect, sellerOrAdmin, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/:id/reclassify', protect, adminOnly, reclassifyProduct);

// Seller routes
router.get('/seller/:sellerId', getSellerProducts);

module.exports = router;
