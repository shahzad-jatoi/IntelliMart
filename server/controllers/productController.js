const axios = require('axios');
const Product = require('../models/Product');
const Category = require('../models/Category');
const PredictionLog = require('../models/PredictionLog');
const config = require('../config');

// Helper: Call ML model service
const classifyProduct = async (title, description) => {
  const startTime = Date.now();
  try {
    const response = await axios.post(`${config.modelServiceUrl}/predict`, {
      title,
      description: description || null,
    });
    const processingMs = Date.now() - startTime;
    return { ...response.data, processing_ms: processingMs };
  } catch (error) {
    console.error('ML Service Error:', error.message);
    throw new Error('ML classification service unavailable');
  }
};

// @desc    Create a new product (with ML classification)
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, imageUrl, brand } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Product title is required' });
    }

    // Call ML model for classification
    let mlResult;
    try {
      mlResult = await classifyProduct(title, description);
    } catch (err) {
      // If ML service is down, still create product with 'Uncategorized'
      mlResult = {
        predicted_category: 'Uncategorized',
        confidence: 0,
        model_used: 'manual',
        all_probabilities: {},
      };
    }

    // Parse top-3 alternative categories from all_probabilities
    const altCategories = Object.entries(mlResult.all_probabilities || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, confidence]) => ({ name, confidence }));

    // Create product
    const product = await Product.create({
      title,
      description: description || '',
      price: price || 0,
      imageUrl: imageUrl || '',
      brand: brand || '',
      category: mlResult.predicted_category,
      confidence: mlResult.confidence,
      altCategories,
      modelUsed: mlResult.model_used,
      sellerId: req.user ? req.user._id : null,
    });

    // Log prediction
    await PredictionLog.create({
      productId: product._id,
      inputText: `${title} ${description || ''}`.trim(),
      predictedCategory: mlResult.predicted_category,
      confidence: mlResult.confidence,
      modelUsed: mlResult.model_used,
      processingTimeMs: mlResult.processing_ms || 0,
      allProbabilities: mlResult.all_probabilities || {},
    });

    // Update category product count
    await Category.findOneAndUpdate(
      { name: mlResult.predicted_category },
      { $inc: { productCount: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      product,
      classification: {
        category: mlResult.predicted_category,
        confidence: mlResult.confidence,
        modelUsed: mlResult.model_used,
        alternatives: altCategories,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products with pagination, search, and filtering
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Price range
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Confidence filter
    if (req.query.minConfidence) {
      filter.confidence = { $gte: parseFloat(req.query.minConfidence) };
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('sellerId', 'name email');

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('sellerId', 'name email');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product (admin override category)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { manualCategory, title, description, price, imageUrl } = req.body;

    if (manualCategory) product.manualCategory = manualCategory;
    if (title) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (imageUrl) product.imageUrl = imageUrl;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Decrease category count
    await Category.findOneAndUpdate(
      { name: product.category },
      { $inc: { productCount: -1 } }
    );

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured/random products
// @route   GET /api/products/featured
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    // Get products with highest confidence as "featured"
    const products = await Product.find({ confidence: { $gte: 0.5 } })
      .sort('-confidence -createdAt')
      .limit(limit);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products by seller
// @route   GET /api/products/seller/:sellerId
exports.getSellerProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { sellerId: req.params.sellerId };
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Re-classify a product
// @route   POST /api/products/:id/reclassify
exports.reclassifyProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const mlResult = await classifyProduct(product.title, product.description);

    const altCategories = Object.entries(mlResult.all_probabilities || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, confidence]) => ({ name, confidence }));

    product.category = mlResult.predicted_category;
    product.confidence = mlResult.confidence;
    product.altCategories = altCategories;
    product.modelUsed = mlResult.model_used;
    product.manualCategory = null; // Reset manual override
    await product.save();

    // Log the new prediction
    await PredictionLog.create({
      productId: product._id,
      inputText: `${product.title} ${product.description || ''}`.trim(),
      predictedCategory: mlResult.predicted_category,
      confidence: mlResult.confidence,
      modelUsed: mlResult.model_used,
      processingTimeMs: mlResult.processing_ms || 0,
      allProbabilities: mlResult.all_probabilities || {},
    });

    res.json({
      product,
      classification: {
        category: mlResult.predicted_category,
        confidence: mlResult.confidence,
        modelUsed: mlResult.model_used,
        alternatives: altCategories,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
