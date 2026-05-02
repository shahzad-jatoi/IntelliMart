import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './CartPage.css';

const CartPage = () => {
  const { cart, loading, cartItemCount, cartTotal, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <span className="material-symbols-outlined cart-empty-icon">lock</span>
            <h2>Please sign in to view your cart</h2>
            <Link to="/login" className="cart-btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading your cart..." />;

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1><span className="material-symbols-outlined">shopping_cart</span>Shopping Cart</h1>
          <span className="cart-count">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</span>
        </div>

        {!cart || cart.items?.length === 0 ? (
          <div className="cart-empty">
            <span className="material-symbols-outlined cart-empty-icon">remove_shopping_cart</span>
            <h2>Your cart is empty</h2>
            <p>Browse products and add them to your cart</p>
            <Link to="/products" className="cart-btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-items-section">
              <div className="cart-items-list">
                {cart.items.map(item => {
                  const unitPrice = item.product?.price || item.price || 0;
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div key={item.product?._id || item._id} className="cart-item">
                      <div className="cart-item-image">
                        {item.product?.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.title}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; }} />
                        ) : (
                          <div className="cart-item-placeholder">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <div className="cart-item-details">
                        <Link to={`/products/${item.product?._id}`} className="cart-item-title">
                          {item.product?.title || 'Product'}
                        </Link>
                        <div className="cart-item-meta">
                          <span className="cart-item-category">
                            {item.product?.category?.replace(/_/g, ' ')}
                          </span>
                          {item.product?.brand && (
                            <span className="cart-item-brand">{item.product.brand}</span>
                          )}
                        </div>
                        <span className="cart-item-unit-price">${unitPrice.toFixed(2)} each</span>
                      </div>
                      <div className="cart-item-controls">
                        <div className="cart-qty-group">
                          <button className="qty-btn"
                            onClick={() => updateQuantity(item.product?._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}>−</button>
                          <span className="qty-value">{item.quantity}</span>
                          <button className="qty-btn"
                            onClick={() => updateQuantity(item.product?._id, item.quantity + 1)}>+</button>
                        </div>
                        <span className="cart-line-total">${lineTotal.toFixed(2)}</span>
                        <button className="cart-item-remove"
                          onClick={() => removeItem(item.product?._id)}
                          title="Remove item">
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cart-actions">
                <Link to="/products" className="cart-continue">
                  <span className="material-symbols-outlined">arrow_back</span>Continue Shopping
                </Link>
                <button className="cart-clear" onClick={clearCart}>
                  <span className="material-symbols-outlined">delete_sweep</span>Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="cart-summary-section">
              <div className="cart-summary">
                <h3>Order Summary</h3>
                <div className="summary-lines">
                  {cart.items.map(item => {
                    const unitPrice = item.product?.price || item.price || 0;
                    return (
                      <div key={item._id} className="summary-line-item">
                        <span className="sli-name">{item.product?.title?.slice(0, 30)}{item.product?.title?.length > 30 ? '...' : ''}</span>
                        <span className="sli-qty">×{item.quantity}</span>
                        <span className="sli-price">${(unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row">
                  <span>Subtotal ({cartItemCount} items)</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="summary-free">FREE</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row summary-total">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <Link to="/checkout" className="cart-checkout-btn">
                  <span className="material-symbols-outlined">lock</span>
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
