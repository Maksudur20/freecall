/**
 * Redis Caching Service
 * Handles caching of users, chats, and online user tracking
 */

import {
  getCacheValue,
  setCacheValue,
  deleteCacheValue,
  clearCacheByPattern,
  isRedisAvailable,
  getRedisClient
} from '../config/redis.js';

// Cache key prefixes
const KEYS = {
  USER: (id) => `user:${id}`,
  USER_PROFILE: (id) => `user:profile:${id}`,
  CHAT: (id) => `chat:${id}`,
  CHAT_MESSAGES: (id) => `chat:messages:${id}`,
  ONLINE_USERS: 'online:users',
  USER_SESSIONS: (userId) => `session:${userId}`,
  FRIENDS_LIST: (userId) => `friends:${userId}`,
};

// Cache TTLs (Time to Live in seconds)
const TTL = {
  USER: 3600, // 1 hour
  CHAT: 1800, // 30 minutes
  MESSAGES: 1200, // 20 minutes
  SESSION: 86400, // 24 hours
  FRIENDS: 7200, // 2 hours
};

/**
 * Cache user data
 */
export const cacheUser = async (userId, userData) => {
  if (!isRedisAvailable()) return false;
  return setCacheValue(KEYS.USER(userId), userData, TTL.USER);
};

/**
 * Get cached user
 */
export const getCachedUser = async (userId) => {
  return getCacheValue(KEYS.USER(userId));
};

/**
 * Invalidate user cache
 */
export const invalidateUserCache = async (userId) => {
  await deleteCacheValue(KEYS.USER(userId));
  await deleteCacheValue(KEYS.USER_PROFILE(userId));
  await deleteCacheValue(KEYS.FRIENDS_LIST(userId));
};

/**
 * Cache chat data
 */
export const cacheChat = async (chatId, chatData) => {
  if (!isRedisAvailable()) return false;
  return setCacheValue(KEYS.CHAT(chatId), chatData, TTL.CHAT);
};

/**
 * Get cached chat
 */
export const getCachedChat = async (chatId) => {
  return getCacheValue(KEYS.CHAT(chatId));
};

/**
 * Cache chat messages
 */
export const cacheChatMessages = async (chatId, messages) => {
  if (!isRedisAvailable()) return false;
  return setCacheValue(KEYS.CHAT_MESSAGES(chatId), messages, TTL.MESSAGES);
};

/**
 * Get cached chat messages
 */
export const getCachedChatMessages = async (chatId) => {
  return getCacheValue(KEYS.CHAT_MESSAGES(chatId));
};

/**
 * Invalidate chat cache
 */
export const invalidateChatCache = async (chatId) => {
  await deleteCacheValue(KEYS.CHAT(chatId));
  await deleteCacheValue(KEYS.CHAT_MESSAGES(chatId));
};

/**
 * Add user to online users set
 * Stores user info: { userId, socketId, timestamp }
 */
export const addOnlineUser = async (userId, socketId) => {
  if (!isRedisAvailable()) return false;

  try {
    const client = getRedisClient();
    const userData = {
      userId,
      socketId,
      timestamp: new Date().toISOString(),
    };

    // Add to sorted set with timestamp as score for FIFO
    await client.zAdd(KEYS.ONLINE_USERS, {
      score: Date.now(),
      value: JSON.stringify(userData),
    });

    // Also set individual user session
    await setCacheValue(KEYS.USER_SESSIONS(userId), { socketId, timestamp: new Date().toISOString() }, TTL.SESSION);

    return true;
  } catch (error) {
    console.error('❌ Error adding online user:', error.message);
    return false;
  }
};

/**
 * Remove user from online users
 */
export const removeOnlineUser = async (userId) => {
  if (!isRedisAvailable()) return false;

  try {
    const client = getRedisClient();
    
    // Get all online users and remove matching userId
    const onlineUsers = await client.zRange(KEYS.ONLINE_USERS, 0, -1);
    const updatedUsers = onlineUsers.filter(user => {
      const userData = JSON.parse(user);
      return userData.userId !== userId;
    });

    // Clear and reset
    await client.del(KEYS.ONLINE_USERS);
    if (updatedUsers.length > 0) {
      const members = updatedUsers.map((user, index) => ({
        score: index,
        value: user,
      }));
      await client.zAdd(KEYS.ONLINE_USERS, members);
    }

    // Remove session
    await deleteCacheValue(KEYS.USER_SESSIONS(userId));

    return true;
  } catch (error) {
    console.error('❌ Error removing online user:', error.message);
    return false;
  }
};

/**
 * Get all online users
 */
export const getOnlineUsers = async () => {
  if (!isRedisAvailable()) return [];

  try {
    const client = getRedisClient();
    const onlineUsers = await client.zRange(KEYS.ONLINE_USERS, 0, -1);
    return onlineUsers.map(user => JSON.parse(user));
  } catch (error) {
    console.error('❌ Error getting online users:', error.message);
    return [];
  }
};

/**
 * Check if user is online
 */
export const isUserOnline = async (userId) => {
  if (!isRedisAvailable()) return false;

  try {
    const session = await getCacheValue(KEYS.USER_SESSIONS(userId));
    return !!session;
  } catch (error) {
    console.error('❌ Error checking if user online:', error.message);
    return false;
  }
};

/**
 * Get user's socket ID
 */
export const getUserSocketId = async (userId) => {
  if (!isRedisAvailable()) return null;

  try {
    const session = await getCacheValue(KEYS.USER_SESSIONS(userId));
    return session?.socketId || null;
  } catch (error) {
    console.error('❌ Error getting user socket ID:', error.message);
    return null;
  }
};

/**
 * Cache friends list
 */
export const cacheFriendsList = async (userId, friends) => {
  if (!isRedisAvailable()) return false;
  return setCacheValue(KEYS.FRIENDS_LIST(userId), friends, TTL.FRIENDS);
};

/**
 * Get cached friends list
 */
export const getCachedFriendsList = async (userId) => {
  return getCacheValue(KEYS.FRIENDS_LIST(userId));
};

/**
 * Clear all caches
 */
export const clearAllCaches = async () => {
  if (!isRedisAvailable()) return false;

  try {
    await clearCacheByPattern('user:*');
    await clearCacheByPattern('chat:*');
    await clearCacheByPattern('session:*');
    await clearCacheByPattern('friends:*');
    console.log('✅ All caches cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing caches:', error.message);
    return false;
  }
};

export default {
  cacheUser,
  getCachedUser,
  invalidateUserCache,
  cacheChat,
  getCachedChat,
  cacheChatMessages,
  getCachedChatMessages,
  invalidateChatCache,
  addOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
  isUserOnline,
  getUserSocketId,
  cacheFriendsList,
  getCachedFriendsList,
  clearAllCaches,
};
