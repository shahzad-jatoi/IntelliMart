import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product, showAddToCart }) => {
  const confidence = Math.round((product.confidence || 0) * 100);
  const displayCategory = product.manualCategory || product.category;
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || adding) return;
    setAdding(true);
    try {
      await addToCart(product._id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // silent fail
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="product-card glow-card">
      <div className="pc-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }} />
        ) : (
          <div className="pc-no-image">
            <span className="pc-placeholder-icon">&#9634;</span>
          </div>
        )}
        <span className="pc-category">{displayCategory?.replace(/_/g, ' ')}</span>
      </div>
      <div className="pc-body">
        <h3 className="pc-title">{product.title?.slice(0, 55)}{product.title?.length > 55 ? '...' : ''}</h3>
        {product.brand && <p className="pc-brand">{product.brand}</p>}
        <div className="pc-footer">
          <span className="pc-price">
            {product.price > 0 ? `$${product.price.toFixed(2)}` : 'N/A'}
          </span>
          <div className="pc-confidence">
            <div className="pc-conf-bar">
              <div className="pc-conf-fill" style={{
                width: `${confidence}%`,
                background: confidence >= 80 ? 'var(--success)' : confidence >= 50 ? 'var(--warning)' : 'var(--danger)',
              }} />
            </div>
            <span className="pc-conf-text" style={{
              color: confidence >= 80 ? 'var(--success)' : confidence >= 50 ? 'var(--warning)' : 'var(--danger)',
            }}>{confidence}%</span>
          </div>
        </div>
        {isAuthenticated && (
          <button className={`pc-add-cart ${added ? 'pc-added' : ''}`}
            onClick={handleAddToCart} disabled={adding}>
            {added ? 'Added' : adding ? '...' : 'Add to Cart'}
          </button>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
