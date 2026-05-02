const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'title imageUrl category brand price confidence');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out items where product was deleted
    cart.items = cart.items.filter(item => item.product);

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if product already in cart
    const existingIdx = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price || 0,
      });
    }

    await cart.save();

    // Populate and return
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'title imageUrl category brand price confidence');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/item/:productId
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();

    const updated = await Cart.findById(cart._id)
      .populate('items.product', 'title imageUrl category brand price confidence');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:productId
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.product.toString() !== productId);
    await cart.save();

    const updated = await Cart.findById(cart._id)
      .populate('items.product', 'title imageUrl category brand price confidence');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
