import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { trackCategoryClick } from '../utils/activity';
import './CategoryPage.css';

const CategoryPage = () => {
  const { name } = useParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackCategoryClick(name);
    fetchProducts(1);
  }, [name]);

  const fetchProducts = async (page) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/categories/${name}/products`, { params: { page, limit: 12 } });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="category-page">
      <div className="container">
        <nav className="breadcrumb-nav">
          <Link to="/">Home</Link><span className="breadcrumb-sep">›</span>
          <Link to="/categories">Categories</Link><span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{name?.replace(/_/g, ' ')}</span>
        </nav>

        <div className="category-header">
          <h1>{name?.replace(/_/g, ' ')}</h1>
          <p>{pagination.total} products in this category</p>
        </div>

        {loading ? <LoadingSpinner /> : products.length === 0 ? (
          <div className="text-center py-5"><h3 className="text-light">No products in this category</h3></div>
        ) : (
          <div className="row g-4">
            {products.map(p => (
              <div key={p._id} className="col-6 col-md-4 col-lg-3"><ProductCard product={p} /></div>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="pagination-bar">
            {[...Array(Math.min(pagination.pages, 10))].map((_, i) => (
              <button key={i+1} className={`page-num ${pagination.page === i+1 ? 'active' : ''}`}
                onClick={() => fetchProducts(i+1)}>{i+1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
