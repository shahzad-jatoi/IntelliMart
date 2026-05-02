import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import RecommendedSection from '../components/RecommendedSection';
import { trackProductView } from '../utils/activity';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        trackProductView(data._id, data.category);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading product details..." />;
  if (!product) return <div className="container py-5 text-center"><h3 className="text-light">Product not found</h3></div>;

  const displayCategory = product.manualCategory || product.category;
  const confidence = Math.round((product.confidence || 0) * 100);

  const getConfidenceColor = (c) => {
    if (c >= 80) return 'var(--success)';
    if (c >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="product-detail-page">
      <div className="container">
        <nav className="breadcrumb-nav">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to="/products">Products</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/category/${product.category}`}>{product.category?.replace(/_/g, ' ')}</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{product.title?.slice(0, 40)}...</span>
        </nav>

        <div className="row g-4">
          {/* Product Image */}
          <div className="col-md-5">
            <div className="detail-image-container">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.title}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/500x400?text=No+Image'; }} />
              ) : (
                <div className="detail-no-image">No Image</div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="col-md-7">
            <div className="detail-info">
              <div className="detail-category-badge">
                {displayCategory?.replace(/_/g, ' ')}
              </div>
              {product.manualCategory && (
                <span className="manual-override-badge">Admin Override</span>
              )}
              <h1 className="detail-title">{product.title}</h1>
              {product.brand && <p className="detail-brand">by {product.brand}</p>}
              
              <div className="detail-price">
                {product.price > 0 ? `$${product.price.toFixed(2)}` : 'Price not available'}
              </div>

              {isAuthenticated && (
                <button className={`detail-add-cart ${addedToCart ? 'detail-added' : ''}`}
                  onClick={async () => {
                    if (addingToCart) return;
                    setAddingToCart(true);
                    try {
                      await addToCart(product._id);
                      setAddedToCart(true);
                      setTimeout(() => setAddedToCart(false), 2500);
                    } catch {} finally { setAddingToCart(false); }
                  }}
                  disabled={addingToCart}>
                  {addedToCart ? 'Added to Cart' : addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              )}

              {product.description && (
                <div className="detail-description">
                  <h3>Description</h3>
                  <p>{product.description}</p>
                </div>
              )}

              {/* ML Classification Card */}
              <div className="classification-card">
                <h3>ML Classification</h3>
                <div className="classification-details">
                  <div className="classification-row">
                    <span className="cl-label">Predicted Category</span>
                    <span className="cl-value">{product.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="classification-row">
                    <span className="cl-label">Confidence</span>
                    <div className="cl-confidence">
                      <div className="detail-confidence-bar">
                        <div className="detail-confidence-fill"
                          style={{
                            width: `${confidence}%`,
                            backgroundColor: getConfidenceColor(confidence),
                          }}
                        />
                      </div>
                      <span style={{ color: getConfidenceColor(confidence), fontWeight: 700 }}>
                        {confidence}%
                      </span>
                    </div>
                  </div>
                  <div className="classification-row">
                    <span className="cl-label">Model Used</span>
                    <span className="cl-value model-badge">
                      {product.modelUsed?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Alternative Categories */}
                {product.altCategories && product.altCategories.length > 0 && (
                  <div className="alt-categories">
                    <h4>Alternative Predictions</h4>
                    {product.altCategories.slice(0, 5).map((alt, i) => (
                      <div key={i} className="alt-category-row">
                        <span className="alt-name">{alt.name?.replace(/_/g, ' ')}</span>
                        <div className="alt-bar-container">
                          <div className="alt-bar"
                            style={{ width: `${Math.round(alt.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="alt-conf">{(alt.confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {product.asin && (
                <p className="detail-asin">ASIN: {product.asin}</p>
              )}
            </div>
          </div>
        </div>

        <RecommendedSection />
      </div>
    </div>
  );
};

export default ProductDetail;
