/**
 * Optimized API Service with Caching and Request Deduplication
 */

import { RequestCache, RequestDeduplicator } from '@utils/performance';

// Create cache instances
const queryCache = new RequestCache(300000); // 5 minutes
const requestDeduplicator = new RequestDeduplicator();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create cache key for GET requests
const createCacheKey = (endpoint, params = {}) => {
  const paramStr = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${paramStr}`;
};

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const method = options.method || 'GET';

  // Check cache for GET requests
  if (method === 'GET') {
    const cacheKey = createCacheKey(endpoint, options.params);
    const cached = queryCache.get(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return cached;
    }

    // Use deduplicator to prevent duplicate concurrent requests
    try {
      const result = await requestDeduplicator.execute(cacheKey, async () => {
        return await performApiCall(endpoint, options, token);
      });
      
      // Cache the successful result
      queryCache.set(cacheKey, result);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // For non-GET requests, just perform the call
  return performApiCall(endpoint, options, token);
};

const performApiCall = async (endpoint, options = {}, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiCall(endpoint, options);
      }
      // Log out user
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Cache invalidation functions
export const invalidateCache = (pattern) => {
  if (!pattern) {
    queryCache.clear();
    return;
  }
  // Implement pattern-based cache invalidation if needed
};

export const clearCache = () => {
  queryCache.clear();
};

export default apiCall;
