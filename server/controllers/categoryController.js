const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories
// @route   GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products by category name
// @route   GET /api/categories/:name/products
exports.getCategoryProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const categoryName = req.params.name.replace(/-/g, '_');
    
    const filter = { category: { $regex: new RegExp(`^${categoryName}$`, 'i') } };
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      category: categoryName,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category counts (utility)
// @route   POST /api/categories/sync-counts
exports.syncCounts = async (req, res) => {
  try {
    const categories = await Category.find();
    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat.name });
      cat.productCount = count;
      await cat.save();
    }
    res.json({ message: 'Category counts synced', count: categories.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
