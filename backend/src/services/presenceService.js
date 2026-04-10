// Presence Service
// Handles user presence tracking with multi-device/tab support and last-seen formatting

import User from '../models/User.js';

/**
 * Store for tracking active sessions per user
 * Format: { userId: { sessionId: { socketId, deviceInfo, connectedAt, lastActivity } } }
 */
const activeSessions = new Map();

/**
 * Store for tracking idle timers per user session
 * Format: { sessionId: timeoutId }
 */
const idleTimers = new Map();

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_BROADCAST_THRESHOLD = 1000; // 1 second minimum between activity broadcasts

/**
 * Generate unique session ID (per tab/device connection)
 */
export const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Register a new session for a user
 */
export const registerSession = (userId, socketId, deviceInfo = {}) => {
  const sessionId = generateSessionId();

  if (!activeSessions.has(userId)) {
    activeSessions.set(userId, {});
  }

  activeSessions.get(userId)[sessionId] = {
    socketId,
    deviceInfo: {
      type: deviceInfo.type || 'web', // 'web', 'mobile', 'desktop'
      browser: deviceInfo.browser || 'unknown',
      os: deviceInfo.os || 'unknown',
      userAgent: deviceInfo.userAgent || '',
    },
    connectedAt: new Date(),
    lastActivity: new Date(),
  };

  return sessionId;
};

/**
 * Unregister a session for a user
 */
export const unregisterSession = (userId, sessionId) => {
  if (activeSessions.has(userId)) {
    delete activeSessions.get(userId)[sessionId];
    
    // Clean up idle timer
    if (idleTimers.has(sessionId)) {
      clearTimeout(idleTimers.get(sessionId));
      idleTimers.delete(sessionId);
    }

    // Remove user entry if no sessions left
    if (Object.keys(activeSessions.get(userId)).length === 0) {
      activeSessions.delete(userId);
    }
  }
};

/**
 * Get active session count for a user
 */
export const getActiveSessions = (userId) => {
  if (!activeSessions.has(userId)) return [];
  
  return Object.entries(activeSessions.get(userId) || {}).map(([sessionId, session]) => ({
    sessionId,
    ...session,
  }));
};

/**
 * Update user status across all sessions
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const sessions = getActiveSessions(userId);
    const isOnline = status === 'online' || status === 'away';

    // If user has active sessions, status is "online"
    // If no sessions, status is "offline"
    const actualStatus = sessions.length > 0 ? status : 'offline';

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        status: actualStatus,
        lastSeen: new Date(),
      },
      { new: true }
    ).select('_id username status lastSeen profilePicture');

    return {
      userId,
      status: actualStatus,
      sessionCount: sessions.length,
      user: updatedUser,
    };
  } catch (error) {
    console.error(`Error updating status for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Handle user activity with debouncing
 */
export const recordActivity = (userId, sessionId) => {
  if (!activeSessions.has(userId)) return;

  const sessions = activeSessions.get(userId);
  if (!sessions[sessionId]) return;

  sessions[sessionId].lastActivity = new Date();

  // Clear existing idle timer
  if (idleTimers.has(sessionId)) {
    clearTimeout(idleTimers.get(sessionId));
  }

  // Set new idle timer
  const timer = setTimeout(() => {
    handleSessionIdle(userId, sessionId);
  }, IDLE_TIMEOUT);

  idleTimers.set(sessionId, timer);
};

/**
 * Handle session becoming idle
 */
export const handleSessionIdle = async (userId, sessionId) => {
  if (!activeSessions.has(userId)) return;

  const sessions = activeSessions.get(userId);
  if (sessions[sessionId]) {
    sessions[sessionId].idleSince = new Date();
  }

  // Check if all sessions are idle
  const userSessions = Object.values(sessions);
  const allIdle = userSessions.every(s => s.idleSince);

  if (allIdle) {
    try {
      await User.findByIdAndUpdate(userId, { status: 'away' });
    } catch (error) {
      console.error(`Error marking user ${userId} as away:`, error);
    }
  }
};

/**
 * Format last seen timestamp for display
 */
export const formatLastSeen = (lastSeenDate) => {
  if (!lastSeenDate) return 'never';

  const now = new Date();
  const diffMs = now - new Date(lastSeenDate);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older timestamps, show the actual date
  return new Date(lastSeenDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(now.getFullYear() !== new Date(lastSeenDate).getFullYear() && {
      year: 'numeric',
    }),
  });
};

/**
 * Get presence info for a user
 */
export const getPresenceInfo = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      '_id username status lastSeen profilePicture'
    );

    if (!user) return null;

    const sessions = getActiveSessions(userId);
    const isOnline = sessions.length > 0;

    return {
      userId: user._id,
      username: user.username,
      status: isOnline ? user.status : 'offline',
      lastSeen: user.lastSeen,
      lastSeenFormatted: formatLastSeen(user.lastSeen),
      isOnline,
      sessionCount: sessions.length,
      profilePicture: user.profilePicture,
    };
  } catch (error) {
    console.error(`Error getting presence info for user ${userId}:`, error);
    return null;
  }
};

/**
 * Get presence info for multiple users
 */
export const getBulkPresenceInfo = async (userIds) => {
  try {
    const users = await User.find({ _id: { $in: userIds } }).select(
      '_id username status lastSeen profilePicture'
    );

    return users.map(user => {
      const sessions = getActiveSessions(user._id.toString());
      const isOnline = sessions.length > 0;

      return {
        userId: user._id,
        username: user.username,
        status: isOnline ? user.status : 'offline',
        lastSeen: user.lastSeen,
        lastSeenFormatted: formatLastSeen(user.lastSeen),
        isOnline,
        sessionCount: sessions.length,
        profilePicture: user.profilePicture,
      };
    });
  } catch (error) {
    console.error('Error getting bulk presence info:', error);
    return [];
  }
};

/**
 * Clean up all data (useful for testing or shutdown)
 */
export const cleanup = () => {
  idleTimers.forEach(timer => clearTimeout(timer));
  idleTimers.clear();
  activeSessions.clear();
};

export default {
  generateSessionId,
  registerSession,
  unregisterSession,
  getActiveSessions,
  updateUserStatus,
  recordActivity,
  handleSessionIdle,
  formatLastSeen,
  getPresenceInfo,
  getBulkPresenceInfo,
  cleanup,
};
