import { useState, useEffect } from 'react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPanel.css';

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', price: '', imageUrl: '' });

  useEffect(() => {
    fetchProducts();
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const fetchProducts = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...(search && { search }) };
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (productId) => {
    if (!editCategory) return;
    try {
      await api.put(`/products/${productId}`, { manualCategory: editCategory });
      setProducts(products.map(p => p._id === productId ? { ...p, manualCategory: editCategory } : p));
      setEditingId(null);
    } catch (error) { alert('Error: ' + (error.response?.data?.message || error.message)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      setProducts(products.filter(p => p._id !== deleteTarget._id));
    } catch (error) { alert('Error: ' + (error.response?.data?.message || error.message)); }
    setDeleteTarget(null);
  };

  const handleReclassify = async (productId) => {
    try {
      const { data } = await api.post(`/products/${productId}/reclassify`);
      setProducts(products.map(p => p._id === productId ? data.product : p));
    } catch (error) { alert('Error: ' + (error.response?.data?.message || error.message)); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const { data } = await api.post('/products', {
        title: uploadForm.title,
        description: uploadForm.description,
        price: parseFloat(uploadForm.price) || 0,
        imageUrl: uploadForm.imageUrl,
      });
      setUploadForm({ title: '', description: '', price: '', imageUrl: '' });
      setShowUpload(false);
      fetchProducts(1, searchTerm);
    } catch (error) { alert('Error: ' + (error.response?.data?.message || error.message)); }
    finally { setUploading(false); }
  };

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Admin Panel</h1>
            <p>Manage products, override classifications, and monitor the system.</p>
          </div>
          <button className="btn-upload-admin" onClick={() => setShowUpload(!showUpload)}>
            <span className="material-symbols-outlined">add_circle</span>
            {showUpload ? 'Close' : 'Add Product'}
          </button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="admin-upload-card">
            <h3><span className="material-symbols-outlined">cloud_upload</span>Upload New Product</h3>
            <form onSubmit={handleUpload}>
              <div className="admin-upload-grid">
                <div className="form-group">
                  <label>Product Title *</label>
                  <input type="text" className="form-input" placeholder="e.g. Samsung Galaxy S24 Ultra"
                    value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} required minLength={3} />
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input type="number" className="form-input" placeholder="0.00" step="0.01"
                    value={uploadForm.price} onChange={e => setUploadForm({...uploadForm, price: e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Image URL</label>
                  <input type="url" className="form-input" placeholder="https://example.com/image.jpg"
                    value={uploadForm.imageUrl} onChange={e => setUploadForm({...uploadForm, imageUrl: e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Description</label>
                  <textarea className="form-input" rows={3} placeholder="Product description..."
                    value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-upload" disabled={uploading || !uploadForm.title}>
                <span className="material-symbols-outlined">{uploading ? 'hourglass_top' : 'rocket_launch'}</span>
                {uploading ? 'Classifying...' : 'Upload & Classify'}
              </button>
            </form>
          </div>
        )}

        <div className="admin-stats-row">
          <div className="admin-stat"><span className="admin-stat-number">{pagination.total}</span><span className="admin-stat-label">Total Products</span></div>
          <div className="admin-stat"><span className="admin-stat-number">{categories.length}</span><span className="admin-stat-label">Categories</span></div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); fetchProducts(1, searchTerm); }} className="admin-search">
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input" id="admin-search" />
          <button type="submit" className="btn-search"><span className="material-symbols-outlined" style={{fontSize:'18px',verticalAlign:'middle'}}>search</span></button>
        </form>
        {loading ? <LoadingSpinner /> : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead><tr><th>Title</th><th>ML Category</th><th>Override</th><th>Confidence</th><th>Model</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td className="admin-title-cell"><a href={`/products/${p._id}`}>{p.title?.slice(0, 55)}{p.title?.length > 55 ? '...' : ''}</a></td>
                    <td><span className="admin-category-badge">{p.category?.replace(/_/g, ' ')}</span></td>
                    <td>
                      {editingId === p._id ? (
                        <div className="override-inline">
                          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="override-select">
                            <option value="">Select...</option>
                            {categories.map(c => <option key={c._id} value={c.name}>{c.name?.replace(/_/g, ' ')}</option>)}
                          </select>
                          <button className="btn-sm btn-confirm" onClick={() => handleOverride(p._id)}>OK</button>
                          <button className="btn-sm btn-cancel" onClick={() => setEditingId(null)}>x</button>
                        </div>
                      ) : (
                        <span className={p.manualCategory ? 'override-active' : 'override-none'}>{p.manualCategory?.replace(/_/g, ' ') || '—'}</span>
                      )}
                    </td>
                    <td><span className="admin-confidence" style={{ color: (p.confidence*100) >= 80 ? 'var(--success)' : (p.confidence*100) >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{Math.round(p.confidence*100)}%</span></td>
                    <td><span className="model-tag-sm">{p.modelUsed === 'logistic_regression' ? 'LR' : p.modelUsed === 'ensemble_blend' ? 'ENS' : p.modelUsed === 'naive_bayes_fallback' ? 'NB' : p.modelUsed?.slice(0,4)}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action" onClick={() => { setEditingId(p._id); setEditCategory(''); }} title="Override">
                          <span className="material-symbols-outlined">edit</span>Edit
                        </button>
                        <button className="btn-action" onClick={() => handleReclassify(p._id)} title="Re-classify">
                          <span className="material-symbols-outlined">psychology</span>Re-classify
                        </button>
                        <button className="btn-action btn-danger-action" onClick={() => setDeleteTarget(p)} title="Delete">
                          <span className="material-symbols-outlined">delete</span>Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="pagination-bar">
            {[...Array(Math.min(pagination.pages, 10))].map((_, i) => (
              <button key={i+1} className={`page-num ${pagination.page === i+1 ? 'active' : ''}`} onClick={() => fetchProducts(i+1, searchTerm)}>{i+1}</button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="dialog-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="dialog-box" onClick={e => e.stopPropagation()}>
            <div className="dialog-icon">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete <strong>"{deleteTarget.title?.slice(0, 50)}"</strong>? This action cannot be undone.</p>
            <div className="dialog-actions">
              <button className="dialog-btn dialog-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="dialog-btn dialog-confirm" onClick={confirmDelete}>
                <span className="material-symbols-outlined">delete</span>Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
