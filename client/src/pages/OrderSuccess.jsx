import { useLocation, Link } from 'react-router-dom';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="order-success-page">
      <div className="container">
        <div className="success-card">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1>Order Placed Successfully</h1>
          <p className="success-subtitle">Thank you for your purchase! A confirmation email has been sent.</p>

          {order && (
            <div className="success-details">
              <div className="success-row">
                <span className="success-label">Order ID</span>
                <span className="success-value">#{order._id?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="success-row">
                <span className="success-label">Items</span>
                <span className="success-value">{order.items?.length} items</span>
              </div>
              <div className="success-row">
                <span className="success-label">Total</span>
                <span className="success-value success-total">${order.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="success-row">
                <span className="success-label">Payment</span>
                <span className="success-value" style={{textTransform: 'capitalize'}}>
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                </span>
              </div>
              <div className="success-row">
                <span className="success-label">Status</span>
                <span className="success-value bd-order-status bd-status-processing">Processing</span>
              </div>
            </div>
          )}

          <div className="success-actions">
            <Link to="/orders" className="success-btn-primary">View Orders</Link>
            <Link to="/products" className="success-btn-secondary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
