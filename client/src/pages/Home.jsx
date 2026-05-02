import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import RecommendedSection from '../components/RecommendedSection';
import LoadingSpinner from '../components/LoadingSpinner';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get('/categories');
        setCategories(catRes.data.slice(0, 8));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Initializing IntelliMart..." />;

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-grid-bg"></div>
        <div className="container hero-content">
          <div className="hero-badge">AI-Powered Classification</div>
          <h1 className="hero-title">
            Intelligent Product<br/>
            <span className="gradient-text">Classification</span> System
          </h1>
          <p className="hero-subtitle">
            Streamline your inventory with our advanced ML pipeline for real-time 
            product categorization. 99.4% accuracy across 12,000+ taxonomies.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn-primary-glow">Browse Products</Link>
            <Link to="/register" className="btn-outline-glow">Start Selling</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="home-section">
        <div className="container">
          <div className="section-header-row">
            <h2 className="section-heading">Browse Categories</h2>
            <Link to="/categories" className="action-link">View All Categories &rarr;</Link>
          </div>
          <div className="row g-3">
            {categories.map((cat) => (
              <div key={cat._id} className="col-6 col-md-3">
                <Link to={`/category/${cat.name}`} className="cat-card glow-card">
                  <div className="cat-letter-bg">{cat.name?.charAt(0)}</div>
                  <span className="cat-icon-letter">{cat.name?.charAt(0)}</span>
                  <h4>{cat.name?.replace(/_/g, ' ')}</h4>
                  <span className="cat-count">{cat.productCount} products</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container"><RecommendedSection /></div>

      {/* How It Works */}
      <section className="home-section how-it-works">
        <div className="container">
          <h2 className="section-heading text-center">How It Works</h2>
          <div className="hiw-flow">
            {[
              { step: '01', title: 'Upload', icon: 'cloud_upload' },
              { step: '02', title: 'ML Classification', icon: 'psychology' },
              { step: '03', title: 'Confidence Check', icon: 'verified' },
              { step: '04', title: 'Auto-Categorized', icon: 'auto_awesome' },
            ].map((item, i) => (
              <div key={i} className="hiw-step">
                <span className="hiw-number">{item.step}</span>
                <span className="material-symbols-outlined hiw-icon">{item.icon}</span>
                <h4>{item.title}</h4>
                {i < 3 && <span className="hiw-connector"></span>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
