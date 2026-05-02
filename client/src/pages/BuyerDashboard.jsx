import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './BuyerDashboard.css';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const { cartItemCount } = useCart();
  const [orders, setOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, itemsBought: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, recRes] = await Promise.all([
          api.get('/orders'),
          api.get('/orders/recommendations'),
        ]);
        setOrders(ordersRes.data);
        setRecommendations(recRes.data.recommendations || []);

        const totalOrders = ordersRes.data.length;
        const totalSpent = ordersRes.data.reduce((sum, o) => sum + o.totalAmount, 0);
        const itemsBought = ordersRes.data.reduce(
          (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
        );
        setStats({ totalOrders, totalSpent, itemsBought });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  return (
    <div className="buyer-dashboard">
      <div className="container">
        {/* Header */}
        <div className="bd-header">
          <div>
            <h1>Welcome back, {user?.name}</h1>
            <p className="bd-subtitle">Your personal shopping dashboard</p>
          </div>
          <div className="bd-header-actions">
            <Link to="/cart" className="bd-action-btn">
              <span className="material-symbols-outlined">shopping_cart</span>
              Cart {cartItemCount > 0 && <span className="bd-badge">{cartItemCount}</span>}
            </Link>
            <Link to="/products" className="bd-action-btn bd-action-secondary">
              <span className="material-symbols-outlined">storefront</span>
              Browse Products
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="bd-stats-grid">
          {[
            { label: 'Total Orders', value: stats.totalOrders, icon: 'receipt_long', color: '#FCD535' },
            { label: 'Items Bought', value: stats.itemsBought, icon: 'inventory_2', color: '#3fe397' },
            { label: 'Total Spent', value: `$${stats.totalSpent.toFixed(2)}`, icon: 'payments', color: '#f6465d' },
            { label: 'Cart Items', value: cartItemCount, icon: 'shopping_cart', color: '#6C5CE7' },
          ].map((s, i) => (
            <div key={i} className="bd-stat-card">
              <div className="bd-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <div className="bd-stat-info">
                <span className="bd-stat-val">{s.value}</span>
                <span className="bd-stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <section className="bd-section">
          <div className="bd-section-header">
            <h2><span className="material-symbols-outlined">receipt_long</span>Recent Orders</h2>
            {orders.length > 0 && <Link to="/orders" className="bd-view-all">View All</Link>}
          </div>
          {orders.length === 0 ? (
            <div className="bd-empty-card">
              <span className="material-symbols-outlined bd-empty-icon">shopping_bag</span>
              <h3>No orders yet</h3>
              <p>Start shopping to see your orders here.</p>
              <Link to="/products" className="bd-action-btn">Browse Products</Link>
            </div>
          ) : (
            <div className="bd-orders-grid">
              {orders.slice(0, 4).map(order => (
                <div key={order._id} className="bd-order-card">
                  <div className="bd-order-top">
                    <span className="bd-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className={`bd-order-status bd-status-${order.orderStatus}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="bd-order-items">
                    {order.items.slice(0, 2).map((item, i) => (
                      <span key={i} className="bd-order-item">{item.title?.slice(0, 35)}</span>
                    ))}
                    {order.items.length > 2 && (
                      <span className="bd-order-more">+{order.items.length - 2} more</span>
                    )}
                  </div>
                  <div className="bd-order-bottom">
                    <span className="bd-order-total">${order.totalAmount.toFixed(2)}</span>
                    <span className="bd-order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recommendations */}
        <section className="bd-section">
          <div className="bd-section-header">
            <h2><span className="material-symbols-outlined">auto_awesome</span>Recommended For You</h2>
          </div>
          {recommendations.length === 0 ? (
            <div className="bd-empty-card">
              <span className="material-symbols-outlined bd-empty-icon">psychology</span>
              <h3>No recommendations yet</h3>
              <p>Browse and purchase products to get personalized recommendations.</p>
            </div>
          ) : (
            <div className="row g-3">
              {recommendations.slice(0, 8).map(product => (
                <div key={product._id} className="col-6 col-md-3">
                  <ProductCard product={product} showAddToCart />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BuyerDashboard;
