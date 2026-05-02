import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartItemCount, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: shipping, 2: payment, 3: review
  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Pakistan',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-empty">
            <h2>Your cart is empty</h2>
            <p>Add items to your cart before checkout</p>
            <Link to="/products" className="checkout-btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        shippingAddress: shipping,
        paymentMethod,
      });
      // Clear cart locally so badge updates immediately
      await clearCart();
      navigate('/order-success', { state: { order: data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">Checkout</h1>

        {/* Step Indicator */}
        <div className="checkout-steps">
          {['Shipping', 'Payment', 'Review'].map((label, i) => (
            <div key={i} className={`checkout-step ${step >= i + 1 ? 'active' : ''} ${step === i + 1 ? 'current' : ''}`}>
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>

        {error && <div className="checkout-error">{error}</div>}

        <div className="row g-4">
          <div className="col-lg-7">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="checkout-section">
                <h2>Shipping Address</h2>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-input" value={shipping.fullName}
                    onChange={e => setShipping({...shipping, fullName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Street Address</label>
                  <input type="text" className="form-input" placeholder="Street, apartment, suite"
                    value={shipping.address}
                    onChange={e => setShipping({...shipping, address: e.target.value})} required />
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="form-group">
                      <label>City</label>
                      <input type="text" className="form-input" value={shipping.city}
                        onChange={e => setShipping({...shipping, city: e.target.value})} required />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label>Postal Code</label>
                      <input type="text" className="form-input" value={shipping.postalCode}
                        onChange={e => setShipping({...shipping, postalCode: e.target.value})} required />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" className="form-input" value={shipping.country}
                    onChange={e => setShipping({...shipping, country: e.target.value})} />
                </div>
                <button className="checkout-btn-primary" disabled={!shipping.fullName || !shipping.address || !shipping.city || !shipping.postalCode}
                  onClick={() => setStep(2)}>Continue to Payment</button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="checkout-section">
                <h2>Payment Method</h2>
                <div className="payment-options">
                  {[
                    { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
                    { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, etc.' },
                    { value: 'jazzcash', label: 'JazzCash', desc: 'Pay via JazzCash mobile wallet' },
                    { value: 'easypaisa', label: 'EasyPaisa', desc: 'Pay via EasyPaisa mobile wallet' },
                  ].map(option => (
                    <label key={option.value} className={`payment-option ${paymentMethod === option.value ? 'selected' : ''}`}>
                      <input type="radio" name="payment" value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)} />
                      <div className="payment-option-content">
                        <span className="payment-option-label">{option.label}</span>
                        <span className="payment-option-desc">{option.desc}</span>
                      </div>
                      <span className="payment-radio-mark"></span>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'card' && (
                  <div className="card-form">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input type="text" className="form-input" placeholder="1234 5678 9012 3456" maxLength={19} />
                    </div>
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="form-group">
                          <label>Expiry</label>
                          <input type="text" className="form-input" placeholder="MM/YY" maxLength={5} />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-group">
                          <label>CVV</label>
                          <input type="text" className="form-input" placeholder="123" maxLength={3} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="checkout-nav-btns">
                  <button className="checkout-btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button className="checkout-btn-primary" onClick={() => setStep(3)}>Review Order</button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="checkout-section">
                <h2>Review Your Order</h2>
                <div className="review-block">
                  <h4>Shipping Address</h4>
                  <p>{shipping.fullName}<br/>{shipping.address}<br/>{shipping.city}, {shipping.postalCode}<br/>{shipping.country}</p>
                </div>
                <div className="review-block">
                  <h4>Payment Method</h4>
                  <p style={{textTransform: 'capitalize'}}>{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</p>
                </div>
                <div className="review-block">
                  <h4>Items ({cartItemCount})</h4>
                  <div className="review-items">
                    {cart.items.map(item => (
                      <div key={item._id} className="review-item">
                        <span className="review-item-name">{item.product?.title?.slice(0, 50)}</span>
                        <span className="review-item-qty">x{item.quantity}</span>
                        <span className="review-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="checkout-nav-btns">
                  <button className="checkout-btn-secondary" onClick={() => setStep(2)}>Back</button>
                  <button className="checkout-btn-primary" onClick={handlePlaceOrder} disabled={loading}>
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="col-lg-5">
            <div className="checkout-summary">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {cart.items.map(item => (
                  <div key={item._id} className="summary-item">
                    <div className="summary-item-img">
                      {item.product?.imageUrl ? (
                        <img src={item.product.imageUrl} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : null}
                    </div>
                    <div className="summary-item-info">
                      <span className="summary-item-name">{item.product?.title?.slice(0, 40)}</span>
                      <span className="summary-item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="summary-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
              <div className="summary-row"><span>Shipping</span><span className="summary-free">FREE</span></div>
              <div className="summary-divider"></div>
              <div className="summary-row summary-total"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
