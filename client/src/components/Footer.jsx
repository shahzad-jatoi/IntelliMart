import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="footer-brand">
              <span className="footer-icon">IM</span>
              <span className="footer-name">Intelli<span className="gradient-text">Mart</span></span>
            </div>
            <p className="footer-desc">
              AI-powered product classification and e-commerce platform. Upload products and let machine learning categorize them instantly.
            </p>
          </div>
          <div className="col-md-2">
            <h5 className="footer-heading">Navigate</h5>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5 className="footer-heading">Platform</h5>
            <ul className="footer-links">
              <li><Link to="/analytics">Analytics</Link></li>
              <li><Link to="/seller/dashboard">Seller Dashboard</Link></li>
              <li><Link to="/register">Get Started</Link></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5 className="footer-heading">Technology</h5>
            <div className="tech-badges">
              {['React', 'Express', 'MongoDB', 'scikit-learn', 'FastAPI'].map(t => (
                <span key={t} className="tech-badge">{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} IntelliMart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
