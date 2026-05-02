import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import SellerDashboard from './pages/SellerDashboard';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import CategoryPage from './pages/CategoryPage';
import CategoriesListPage from './pages/CategoriesListPage';
import SearchResults from './pages/SearchResults';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/BuyerDashboard';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderHistory from './pages/OrderHistory';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products" element={<ProductListing />} />
    <Route path="/products/:id" element={<ProductDetail />} />
    <Route path="/categories" element={<CategoriesListPage />} />
    <Route path="/category/:name" element={<CategoryPage />} />
    <Route path="/search" element={<SearchResults />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/about" element={<About />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Buyer routes */}
    <Route path="/buyer/dashboard" element={
      <ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>
    } />
    <Route path="/cart" element={
      <ProtectedRoute><CartPage /></ProtectedRoute>
    } />
    <Route path="/checkout" element={
      <ProtectedRoute><Checkout /></ProtectedRoute>
    } />
    <Route path="/order-success" element={
      <ProtectedRoute><OrderSuccess /></ProtectedRoute>
    } />
    <Route path="/orders" element={
      <ProtectedRoute><OrderHistory /></ProtectedRoute>
    } />

    {/* Seller routes */}
    <Route path="/seller/dashboard" element={
      <ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>
    } />

    {/* Admin routes */}
    <Route path="/admin" element={
      <ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>
    } />
  </Routes>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app-wrapper">
            <Navbar />
            <main className="app-main">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
