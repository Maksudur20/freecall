/**
 * Performance Optimization Utilities
 */

// Debounce utility - delays function execution
export const debounce = (func, delay = 300) => {
  let timeoutId = null;
  
  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

// Throttle utility - limits function execution frequency
export const throttle = (func, delay = 300) => {
  let lastCall = 0;
  
  return function throttled(...args) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      func(...args);
      lastCall = now;
    }
  };
};

// Request cache with TTL
export class RequestCache {
  constructor(ttl = 60000) { // 1 minute default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }
}

// Request deduplication - prevents duplicate concurrent requests
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async execute(key, requestFn) {
    // If request already in progress, wait for it
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn()
      .then(result => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

export default {
  debounce,
  throttle,
  RequestCache,
  RequestDeduplicator,
};
