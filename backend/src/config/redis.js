/**
 * Redis Configuration and Connection
 * Handles connection to Redis/Upstash for caching and real-time features
 */

import { createClient } from 'redis';

let redisClient = null;
let isRedisConnected = false;

/**
 * Initialize Redis connection
 * Supports URL-based connection (Upstash) or standard Redis
 */
export const initRedis = async () => {
  try {
    // Check if Redis URL is provided (Upstash format)
    if (!process.env.REDIS_URL) {
      console.warn('⚠️  REDIS_URL not provided. Running without Redis caching.');
      isRedisConnected = false;
      return null;
    }

    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Max reconnection attempts reached');
            return new Error('Max Redis reconnection attempts');
          }
          return retries * 100;
        },
      },
    });

    // Handle errors
    redisClient.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    console.log('✅ Redis ping successful');

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    console.warn('⚠️  Application will run without Redis caching');
    isRedisConnected = false;
    return null;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is connected
 */
export const isRedisAvailable = () => {
  return isRedisConnected && redisClient !== null;
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.disconnect();
      console.log('✅ Redis disconnected');
    } catch (error) {
      console.error('❌ Error closing Redis:', error.message);
    }
  }
};

/**
 * Get value from Redis cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
export const getCacheValue = async (key) => {
  if (!isRedisAvailable()) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`❌ Cache Get Error (${key}):`, error.message);
    return null;
  }
};

/**
 * Set value in Redis cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 */
export const setCacheValue = async (key, value, ttl = 3600) => {
  if (!isRedisAvailable()) return false;

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`❌ Cache Set Error (${key}):`, error.message);
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 */
export const deleteCacheValue = async (key) => {
  if (!isRedisAvailable()) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`❌ Cache Delete Error (${key}):`, error.message);
    return false;
  }
};

/**
 * Clear all cache by pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'user:*')
 */
export const clearCacheByPattern = async (pattern) => {
  if (!isRedisAvailable()) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`❌ Cache Clear Error (${pattern}):`, error.message);
    return false;
  }
};

export default redisClient;
