import redis from 'redis';
import { promisify } from 'util';

// Initialize Redis client
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

// Handle connection events
client.on('connect', () => {
  console.log('Redis connected');
});

client.on('error', (error) => {
  console.error('Redis error:', error);
});

client.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Promisify Redis commands
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);
const existsAsync = promisify(client.exists).bind(client);
const expireAsync = promisify(client.expire).bind(client);
const ttlAsync = promisify(client.ttl).bind(client);
const incrAsync = promisify(client.incr).bind(client);
const decrAsync = promisify(client.decr).bind(client);
const hgetAsync = promisify(client.hget).bind(client);
const hgetallAsync = promisify(client.hgetall).bind(client);
const hsetAsync = promisify(client.hset).bind(client);
const hdelAsync = promisify(client.hdel).bind(client);
const lpushAsync = promisify(client.lpush).bind(client);
const lrangeAsync = promisify(client.lrange).bind(client);
const llenAsync = promisify(client.llen).bind(client);
const ltrimAsync = promisify(client.ltrim).bind(client);

/**
 * Cache configurations
 */
const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  FRIENDS_LIST: 300,
  CONVERSATIONS: 600, // 10 minutes
  MESSAGES: 3600, // 1 hour
  NOTIFICATIONS: 300,
  ONLINE_USERS: 60, // 1 minute
  SEARCH_RESULTS: 600,
};

/**
 * Generate cache key
 */
const generateKey = (prefix, ...parts) => {
  return `${prefix}:${parts.join(':')}`;
};

/**
 * Get cached value
 */
export const get = async (key) => {
  try {
    const value = await getAsync(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

/**
 * Set cached value
 */
export const set = async (key, value, ttl = 3600) => {
  try {
    await setAsync(key, JSON.stringify(value));
    if (ttl) {
      await expireAsync(key, ttl);
    }
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete cache key
 */
export const del = async (key) => {
  try {
    await delAsync(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete multiple keys with pattern
 */
export const delPattern = async (pattern) => {
  try {
    const keys = await new Promise((resolve, reject) => {
      const stream = client.scanStream({ match: pattern });
      const keys = [];
      stream.on('data', (matchedKeys) => {
        if (matchedKeys.length) {
          keys.push(...matchedKeys);
        }
      });
      stream.on('end', () => resolve(keys));
      stream.on('error', reject);
    });

    if (keys.length > 0) {
      await delAsync(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error(`Cache delete pattern error for ${pattern}:`, error);
    return 0;
  }
};

/**
 * User profile cache
 */
export const getUserProfile = async (userId) => {
  const key = generateKey('user:profile', userId);
  return get(key);
};

export const setUserProfile = async (userId, profile) => {
  const key = generateKey('user:profile', userId);
  return set(key, profile, CACHE_TTL.USER_PROFILE);
};

export const invalidateUserProfile = async (userId) => {
  const key = generateKey('user:profile', userId);
  return del(key);
};

/**
 * Friends list cache
 */
export const getFriendsList = async (userId) => {
  const key = generateKey('friends:list', userId);
  return get(key);
};

export const setFriendsList = async (userId, friends) => {
  const key = generateKey('friends:list', userId);
  return set(key, friends, CACHE_TTL.FRIENDS_LIST);
};

export const invalidateFriendsList = async (userId, friendId) => {
  await del(generateKey('friends:list', userId));
  if (friendId) {
    await del(generateKey('friends:list', friendId));
  }
};

/**
 * Conversations cache
 */
export const getConversations = async (userId) => {
  const key = generateKey('conversations:list', userId);
  return get(key);
};

export const setConversations = async (userId, conversations) => {
  const key = generateKey('conversations:list', userId);
  return set(key, conversations, CACHE_TTL.CONVERSATIONS);
};

export const invalidateConversations = async (userId) => {
  const key = generateKey('conversations:list', userId);
  return del(key);
};

/**
 * Messages cache
 */
export const getMessages = async (conversationId, page = 1) => {
  const key = generateKey('messages:list', conversationId, page);
  return get(key);
};

export const setMessages = async (conversationId, page, messages) => {
  const key = generateKey('messages:list', conversationId, page);
  return set(key, messages, CACHE_TTL.MESSAGES);
};

export const invalidateMessages = async (conversationId) => {
  return delPattern(`messages:list:${conversationId}:*`);
};

/**
 * Online users cache
 */
export const getOnlineUsers = async () => {
  const key = 'online:users';
  return get(key);
};

export const setOnlineUsers = async (users) => {
  const key = 'online:users';
  return set(key, users, CACHE_TTL.ONLINE_USERS);
};

export const addOnlineUser = async (userId, userData) => {
  try {
    const key = generateKey('online:user', userId);
    await set(key, userData, CACHE_TTL.ONLINE_USERS);

    // Add to online users set
    const usersKey = 'online:users:set';
    await hsetAsync(usersKey, userId, JSON.stringify(userData));
    await expireAsync(usersKey, CACHE_TTL.ONLINE_USERS);
    return true;
  } catch (error) {
    console.error('Error adding online user:', error);
    return false;
  }
};

export const removeOnlineUser = async (userId) => {
  try {
    const key = generateKey('online:user', userId);
    await del(key);

    const usersKey = 'online:users:set';
    await hdelAsync(usersKey, userId);
    return true;
  } catch (error) {
    console.error('Error removing online user:', error);
    return false;
  }
};

/**
 * Notifications cache
 */
export const getNotifications = async (userId) => {
  const key = generateKey('notifications:list', userId);
  return get(key);
};

export const setNotifications = async (userId, notifications) => {
  const key = generateKey('notifications:list', userId);
  return set(key, notifications, CACHE_TTL.NOTIFICATIONS);
};

export const invalidateNotifications = async (userId) => {
  const key = generateKey('notifications:list', userId);
  return del(key);
};

/**
 * Unread count cache
 */
export const getUnreadCount = async (userId) => {
  const key = generateKey('unread:count', userId);
  const value = await get(key);
  return value || 0;
};

export const setUnreadCount = async (userId, count) => {
  const key = generateKey('unread:count', userId);
  return set(key, count, CACHE_TTL.NOTIFICATIONS);
};

/**
 * Rate limiting cache
 */
export const checkRateLimit = async (userId, action, limit = 10, window = 60) => {
  try {
    const key = generateKey('ratelimit', userId, action);
    const count = await incrAsync(key);

    if (count === 1) {
      await expireAsync(key, window);
    }

    return count <= limit;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error
  }
};

/**
 * Get rate limit remaining
 */
export const getRateLimitRemaining = async (userId, action, limit = 10) => {
  try {
    const key = generateKey('ratelimit', userId, action);
    const count = await getAsync(key);
    return Math.max(0, limit - (count ? parseInt(count) : 0));
  } catch (error) {
    console.error('Error getting rate limit:', error);
    return limit;
  }
};

/**
 * Clear all cache
 */
export const clearAll = async () => {
  try {
    client.flushdb();
    console.log('All cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Health check
 */
export const healthCheck = async () => {
  try {
    await setAsync('health:check', 'ok');
    const value = await getAsync('health:check');
    return value === 'ok';
  } catch (error) {
    console.error('Cache health check failed:', error);
    return false;
  }
};

export default {
  get,
  set,
  del,
  delPattern,
  getUserProfile,
  setUserProfile,
  invalidateUserProfile,
  getFriendsList,
  setFriendsList,
  invalidateFriendsList,
  getConversations,
  setConversations,
  invalidateConversations,
  getMessages,
  setMessages,
  invalidateMessages,
  getOnlineUsers,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  getNotifications,
  setNotifications,
  invalidateNotifications,
  getUnreadCount,
  setUnreadCount,
  checkRateLimit,
  getRateLimitRemaining,
  clearAll,
  healthCheck,
};
