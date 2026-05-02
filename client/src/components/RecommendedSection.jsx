import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ProductCard from './ProductCard';
import './RecommendedSection.css';

const RecommendedSection = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [basedOn, setBasedOn] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(''); // 'personalized' | 'popular'

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (isAuthenticated) {
          // Logged in — get personalized recommendations from purchase + browsing history
          const { data } = await api.get('/orders/recommendations');
          if (data.recommendations?.length > 0) {
            setProducts(data.recommendations.slice(0, 8));
            setBasedOn(data.basedOn || []);
            setSource('personalized');
            setLoading(false);
            return;
          }
        }
        // Fallback: not logged in OR no purchase history — show top confidence products
        const { data } = await api.get('/products?limit=8&sort=-confidence');
        setProducts(data.products || []);
        setSource('popular');
      } catch {
        // Silent fallback — try popular products
        try {
          const { data } = await api.get('/products?limit=8&sort=-confidence');
          setProducts(data.products || []);
          setSource('popular');
        } catch { /* no products at all */ }
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <section className="recommended-section">
        <h2 className="section-title">Recommended For You</h2>
        <div className="rec-loading">
          <div className="rec-loading-dots">
            <span></span><span></span><span></span>
          </div>
          <p>Analyzing preferences...</p>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="recommended-section">
      <div className="rec-header">
        <div>
          <h2 className="section-title">
            <span className="material-symbols-outlined rec-icon">auto_awesome</span>
            {source === 'personalized' ? 'Recommended For You' : 'Popular Products'}
          </h2>
        </div>
        {source === 'personalized' && (
          <span className="rec-badge">
            <span className="material-symbols-outlined" style={{fontSize:'14px'}}>psychology</span>
            AI Personalized
          </span>
        )}
      </div>
      <div className="row g-3">
        {products.map(product => (
          <div key={product._id} className="col-6 col-md-3">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedSection;
