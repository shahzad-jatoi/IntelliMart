import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { trackSearch } from '../utils/activity';
import './SearchResults.css';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      trackSearch(query);
      fetchResults();
    }
  }, [query, selectedCategory]);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const fetchResults = async (page = 1) => {
    setLoading(true);
    try {
      const params = { search: query, page, limit: 12 };
      if (selectedCategory) params.category = selectedCategory;
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="search-results-page">
      <div className="container">
        <div className="search-header">
          <h1>Search Results</h1>
          <p>Showing {pagination.total} results for "<strong>{query}</strong>"</p>
        </div>

        <div className="search-filters">
          <span className="filter-label">Filter by category:</span>
          <button className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}>All</button>
          {categories.slice(0, 10).map(c => (
            <button key={c._id} className={`filter-chip ${selectedCategory === c.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c.name)}>
              {c.name?.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : products.length === 0 ? (
          <div className="no-results">

            <h3>No results found for "{query}"</h3>
            <p>Try different keywords or <Link to="/products">browse all products</Link></p>
          </div>
        ) : (
          <div className="row g-4">
            {products.map(p => (
              <div key={p._id} className="col-6 col-md-4 col-lg-3"><ProductCard product={p} /></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
