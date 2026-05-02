import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    brand: '',
  });

  useEffect(() => {
    if (user?._id) {
      fetchMyProducts();
    }
  }, [user]);

  const fetchMyProducts = async () => {
    try {
      const { data } = await api.get(`/products/seller/${user._id}?limit=50`);
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching seller products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setClassificationResult(null);

    try {
      const { data } = await api.post('/products', {
        ...form,
        price: parseFloat(form.price) || 0,
      });

      setClassificationResult(data.classification);
      setProducts([data.product, ...products]);
      setForm({ title: '', description: '', price: '', imageUrl: '', brand: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating product');
    } finally {
      setSubmitting(false);
    }
  };

  const confidence = classificationResult 
    ? Math.round(classificationResult.confidence * 100) 
    : 0;

  return (
    <div className="seller-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Seller Dashboard</h1>
          <p>Welcome, {user?.name}! Upload products and let AI classify them.</p>
        </div>

        <div className="row g-4">
          {/* Upload Form */}
          <div className="col-lg-5">
            <div className="upload-card">
              <h3><span className="material-symbols-outlined">cloud_upload</span>Upload New Product</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="product-title">Product Title *</label>
                  <input
                    id="product-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Sony WH-1000XM5 Wireless Headphones"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    minLength={3}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="product-description">Description</label>
                  <textarea
                    id="product-description"
                    className="form-input"
                    rows={4}
                    placeholder="Detailed product description for better classification..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="form-group">
                      <label htmlFor="product-price">Price ($)</label>
                      <input
                        id="product-price"
                        type="number"
                        className="form-input"
                        placeholder="29.99"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label htmlFor="product-brand">Brand</label>
                      <input
                        id="product-brand"
                        type="text"
                        className="form-input"
                        placeholder="Sony"
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="product-image">Image URL</label>
                  <input
                    id="product-image"
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/image.jpg"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-upload" disabled={submitting}>
                  {submitting ? (
                    <><span className="material-symbols-outlined">hourglass_top</span>Classifying...</>
                  ) : (
                    <><span className="material-symbols-outlined">rocket_launch</span>Upload & Classify</>
                  )}
                </button>
              </form>
            </div>

            {/* Classification Result */}
            {classificationResult && (
              <div className="result-card">
                <h3>Classification Result</h3>
                <div className="result-category">
                  <span className="result-label">Category:</span>
                  <span className="result-value">{classificationResult.category?.replace(/_/g, ' ')}</span>
                </div>
                <div className="result-confidence">
                  <span className="result-label">Confidence:</span>
                  <div className="result-bar">
                    <div className="result-fill" style={{ 
                      width: `${confidence}%`,
                      backgroundColor: confidence >= 80 ? 'var(--success)' : confidence >= 50 ? 'var(--warning)' : 'var(--danger)',
                    }} />
                  </div>
                  <span className="result-pct">{confidence}%</span>
                </div>
                <div className="result-model">
                  <span className="result-label">Model:</span>
                  <span className="model-tag">{classificationResult.modelUsed?.replace(/_/g, ' ')}</span>
                </div>
                {classificationResult.alternatives?.length > 0 && (
                  <div className="result-alternatives">
                    <span className="result-label">Top Alternatives:</span>
                    <div className="alt-list">
                      {classificationResult.alternatives.slice(1, 4).map((alt, i) => (
                        <span key={i} className="alt-tag">
                          {alt.name?.replace(/_/g, ' ')} ({(alt.confidence * 100).toFixed(1)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* My Products */}
          <div className="col-lg-7">
            <div className="my-products-card">
              <h3>My Products ({products.length})</h3>
              {loading ? (
                <LoadingSpinner message="Loading your products..." />
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <p>No products yet. Upload your first product!</p>
                </div>
              ) : (
                <div className="products-table-container">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Confidence</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p._id}>
                          <td className="table-title">
                            <a href={`/products/${p._id}`}>{p.title?.slice(0, 50)}{p.title?.length > 50 ? '...' : ''}</a>
                          </td>
                          <td>
                            <span className="table-badge">{p.category?.replace(/_/g, ' ')}</span>
                          </td>
                          <td>
                            <span className="table-confidence" style={{
                              color: (p.confidence * 100) >= 80 ? 'var(--success)' : (p.confidence * 100) >= 50 ? 'var(--warning)' : 'var(--danger)',
                            }}>
                              {Math.round(p.confidence * 100)}%
                            </span>
                          </td>
                          <td>${p.price?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
