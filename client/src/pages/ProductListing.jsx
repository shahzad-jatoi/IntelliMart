import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { trackSearch } from '../utils/activity';
import './ProductListing.css';

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 12,
        ...(searchParams.get('search') && { search: searchParams.get('search') }),
        ...(searchParams.get('category') && { category: searchParams.get('category') }),
        ...(searchParams.get('sort') && { sort: searchParams.get('sort') }),
      };
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (searchParams.get('search') || '')) {
        const params = new URLSearchParams(searchParams);
        if (searchInput) {
          params.set('search', searchInput);
          trackSearch(searchInput);
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        setSearchParams(params);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryFilter = (category) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSort = (sort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="product-listing-page">
      <div className="container">
        <div className="listing-header">
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">
            {pagination.total} products across {categories.length} categories
          </p>
        </div>

        {/* Search & Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
              id="search-input"
            />
            {searchInput && (
              <button className="search-clear" onClick={() => setSearchInput('')}>✕</button>
            )}
            <span className="search-icon">
              <span className="material-symbols-outlined">search</span>
            </span>
          </div>

          <div className="filter-controls">
            <select
              className="filter-select"
              value={searchParams.get('category') || ''}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              id="category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name?.replace(/_/g, ' ')} ({cat.productCount})
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={searchParams.get('sort') || '-createdAt'}
              onChange={(e) => handleSort(e.target.value)}
              id="sort-filter"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="-confidence">Highest Confidence</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <LoadingSpinner message="Loading products..." />
        ) : products.length === 0 ? (
          <div className="no-results">
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="row g-4">
            {products.map((product) => (
              <div key={product._id} className="col-6 col-md-4 col-lg-3">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination-bar">
            <button
              className="page-btn"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              ← Prev
            </button>
            <div className="page-numbers">
              {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                let pageNum;
                if (pagination.pages <= 7) {
                  pageNum = i + 1;
                } else if (pagination.page <= 4) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 3) {
                  pageNum = pagination.pages - 6 + i;
                } else {
                  pageNum = pagination.page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`page-num ${pagination.page === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              className="page-btn"
              disabled={pagination.page >= pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListing;
