import api from './api';

// Generate a session ID for anonymous users
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Fire-and-forget activity logging
export const trackActivity = async (eventType, data = {}) => {
  try {
    await api.post('/activity', {
      eventType,
      sessionId: getSessionId(),
      ...data,
    });
  } catch {
    // Silently fail - activity tracking is non-critical
  }
};

export const trackProductView = (productId, category) => {
  trackActivity('view', { productId, category });
};

export const trackCategoryClick = (category) => {
  trackActivity('category_filter', { category });
};

export const trackSearch = (searchQuery) => {
  trackActivity('search', { searchQuery });
};
