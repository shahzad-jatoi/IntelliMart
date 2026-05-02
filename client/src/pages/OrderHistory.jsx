import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading your orders..." />;

  return (
    <div className="order-history-page">
      <div className="container">
        <div className="oh-header">
          <h1>Order History</h1>
          <p>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
        </div>

        {orders.length === 0 ? (
          <div className="oh-empty">
            <h2>No orders yet</h2>
            <p>Your order history will appear here after you make a purchase.</p>
            <Link to="/products" className="oh-browse-btn">Browse Products</Link>
          </div>
        ) : (
          <div className="oh-list">
            {orders.map(order => (
              <div key={order._id} className="oh-order">
                <div className="oh-order-header">
                  <div className="oh-order-left">
                    <span className="oh-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className="oh-order-date">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="oh-order-right">
                    <span className={`oh-status oh-status-${order.orderStatus}`}>
                      {order.orderStatus}
                    </span>
                    <span className="oh-payment">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
                  </div>
                </div>

                <div className="oh-items">
                  {order.items.map((item, i) => (
                    <div key={i} className="oh-item">
                      <div className="oh-item-img">
                        {item.product?.imageUrl && (
                          <img src={item.product.imageUrl} alt=""
                            onError={(e) => { e.target.style.display = 'none'; }} />
                        )}
                      </div>
                      <div className="oh-item-info">
                        <Link to={`/products/${item.product?._id || ''}`} className="oh-item-title">
                          {item.title}
                        </Link>
                        <span className="oh-item-cat">{item.category?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="oh-item-qty">x{item.quantity}</div>
                      <div className="oh-item-price">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="oh-order-footer">
                  <div className="oh-shipping">
                    <span className="oh-shipping-label">Shipping to:</span>
                    <span>{order.shippingAddress?.fullName}, {order.shippingAddress?.city}</span>
                  </div>
                  <div className="oh-total">
                    <span className="oh-total-label">Total:</span>
                    <span className="oh-total-value">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
