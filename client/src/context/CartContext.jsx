import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await api.post('/cart/add', { productId, quantity });
      setCart(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const { data } = await api.put(`/cart/item/${productId}`, { quantity });
      setCart(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const removeItem = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/item/${productId}`);
      setCart(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
    } catch {
      // Cart may already be cleared by order placement
    }
    setCart({ items: [], totalPrice: 0, totalItems: 0 });
  };

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartTotal = cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  const value = {
    cart,
    loading,
    cartItemCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
