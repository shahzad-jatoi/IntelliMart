const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderEmail } = require('../utils/email');

// @desc    Create order from cart
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'title category price');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Build order items from cart
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      title: item.product.title,
      category: item.product.category,
      quantity: item.quantity,
      price: item.price,
    }));

    const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
    });

    // Clear cart after order
    cart.items = [];
    await cart.save();

    // Send order confirmation email (async, don't block)
    const user = await User.findById(req.user._id);
    if (user?.email) {
      sendOrderEmail(user.email, order).catch(() => {});
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'title imageUrl category');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.find({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'title imageUrl category');

    if (!order || order.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get buyer recommendations based on purchase history
// @route   GET /api/orders/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    // Get user's order history to find preferred categories
    const orders = await Order.find({ user: req.user._id });

    // Count category frequency from purchases
    const categoryCount = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.category) {
          categoryCount[item.category] = (categoryCount[item.category] || 0) + item.quantity;
        }
      });
    });

    // Get user's activity (viewed products, searched categories)
    const UserActivity = require('../models/UserActivity');
    const activities = await UserActivity.find({ userId: req.user._id.toString() })
      .sort('-timestamp').limit(50);

    activities.forEach(act => {
      if (act.type === 'category_click' && act.data) {
        categoryCount[act.data] = (categoryCount[act.data] || 0) + 2;
      }
      if (act.type === 'product_view' && act.metadata?.category) {
        categoryCount[act.metadata.category] = (categoryCount[act.metadata.category] || 0) + 1;
      }
    });

    // Sort categories by preference
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    let recommendations = [];

    if (topCategories.length > 0) {
      // Get products from top categories, excluding already purchased
      const purchasedIds = orders.flatMap(o => o.items.map(i => i.product));

      recommendations = await Product.find({
        category: { $in: topCategories },
        _id: { $nin: purchasedIds },
      })
        .sort('-confidence')
        .limit(12);
    }

    // If not enough recommendations, fill with top confidence products
    if (recommendations.length < 8) {
      const existingIds = recommendations.map(p => p._id);
      const filler = await Product.find({
        _id: { $nin: existingIds },
      })
        .sort('-confidence')
        .limit(12 - recommendations.length);

      recommendations = [...recommendations, ...filler];
    }

    res.json({
      recommendations,
      basedOn: topCategories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
