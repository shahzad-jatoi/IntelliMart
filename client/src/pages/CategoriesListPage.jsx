import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './CategoriesListPage.css';

const CategoriesListPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then(res => { setCategories(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="categories-list-page">
      <div className="container">
        <h1 className="page-title">All Categories</h1>
        <p className="page-subtitle">{categories.length} categories with ML-classified products</p>
        <div className="row g-4">
          {categories.map(cat => (
            <div key={cat._id} className="col-6 col-md-4 col-lg-3">
              <Link to={`/category/${cat.name}`} className="cat-list-card">
                <span className="cat-list-icon">{cat.name?.charAt(0)}</span>
                <h3>{cat.name?.replace(/_/g, ' ')}</h3>
                <p className="cat-list-desc">{cat.description}</p>
                <span className="cat-list-count">{cat.productCount} products</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesListPage;
