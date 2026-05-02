import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark intellimart-nav">
      <div className="container">
        <Link className="navbar-brand brand-link" to="/">
          <span className="brand-icon">IM</span>
          <span className="brand-text">Intelli<span className="brand-accent">Mart</span></span>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/products">Products</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/categories">Categories</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/analytics">Analytics</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/about">About</Link></li>
          </ul>

          <ul className="navbar-nav ms-auto">
            {isAuthenticated ? (
              <>
                {/* Cart Icon */}
                <li className="nav-item">
                  <Link className="nav-link nav-cart-link" to="/cart">
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {cartItemCount > 0 && <span className="nav-cart-badge">{cartItemCount}</span>}
                  </Link>
                </li>

                {/* Role-specific dashboard links */}
                {user?.role === 'buyer' && (
                  <li className="nav-item">
                    <Link className="nav-link nav-dashboard" to="/buyer/dashboard">My Dashboard</Link>
                  </li>
                )}
                {(user?.role === 'seller' || user?.role === 'admin') && (
                  <li className="nav-item">
                    <Link className="nav-link nav-dashboard" to="/seller/dashboard">Dashboard</Link>
                  </li>
                )}
                {user?.role === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin">Admin</Link>
                  </li>
                )}
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle nav-user" href="#" role="button" data-bs-toggle="dropdown">
                    {user?.name}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                    {user?.role === 'buyer' && (
                      <>
                        <li><Link className="dropdown-item" to="/buyer/dashboard">My Dashboard</Link></li>
                        <li><Link className="dropdown-item" to="/orders">Order History</Link></li>
                        <li><hr className="dropdown-divider" /></li>
                      </>
                    )}
                    <li><button className="dropdown-item" onClick={handleLogout}>Sign Out</button></li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">Sign In</Link></li>
                <li className="nav-item">
                  <Link className="nav-link nav-cta" to="/register">Get Started</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
