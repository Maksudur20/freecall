// Presence Store
// Zustand store for managing user presence state across the application

import { create } from 'zustand';
import { socketPresence } from '../services/socket.js';

export const usePresenceStore = create((set, get) => ({
  // State
  onlineUsers: {}, // { userId: presenceInfo }
  userPresence: {}, // { userId: presenceInfo } - detailed presence info
  currentUserStatus: 'offline', // Current logged-in user's status
  isLoading: false,
  error: null,

  // Actions

  /**
   * Initialize presence listeners
   */
  initializePresenceListeners: () => {
    // Listen for status changes
    socketPresence.onUserStatusChanged((presenceInfo) => {
      set(state => ({
        onlineUsers: {
          ...state.onlineUsers,
          [presenceInfo.userId]: presenceInfo,
        },
      }));
    });

    // Listen for presence info responses
    socketPresence.onPresenceInfo((presenceInfoArray) => {
      set(state => {
        const newPresence = { ...state.userPresence };
        presenceInfoArray.forEach(info => {
          newPresence[info.userId] = info;
        });
        return { userPresence: newPresence };
      });
    });
  },

  /**
   * Fetch and update online users list
   */
  fetchOnlineUsers: () => {
    set({ isLoading: true, error: null });
    socketPresence.getOnlineUsers();
    
    socketPresence.onOnlineUsers((users) => {
      const onlineUsersMap = {};
      users.forEach(user => {
        onlineUsersMap[user._id] = {
          userId: user._id,
          username: user.username,
          status: user.status,
          lastSeen: user.lastSeen,
          lastSeenFormatted: user.lastSeenFormatted,
          profilePicture: user.profilePicture,
          sessionCount: user.sessionCount,
          isOnline: user.isOnline !== false,
        };
      });

      set({ onlineUsers: onlineUsersMap, isLoading: false });
    });
  },

  /**
   * Get presence info for specific user(s)
   */
  getPresence: (userIds) => {
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
    socketPresence.getPresence(userIdArray);
  },

  /**
   * Set current user's status
   */
  setCurrentUserStatus: (status) => {
    if (!['online', 'away', 'offline', 'dnd'].includes(status)) {
      set({ error: 'Invalid status' });
      return;
    }

    set({ currentUserStatus: status });

    // Emit to server
    if (status === 'online') {
      socketPresence.userOnline(localStorage.getItem('userId'));
    } else if (status === 'away') {
      socketPresence.userAway(localStorage.getItem('userId'));
    } else if (status === 'offline') {
      socketPresence.userOffline(localStorage.getItem('userId'));
    }
  },

  /**
   * Record user activity (prevents idle timeout)
   */
  recordActivity: () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      socketPresence.userActivity(userId);
    }
  },

  /**
   * Get presence info for a specific user
   */
  getUserPresence: (userId) => {
    return get().userPresence[userId] || null;
  },

  /**
   * Check if a user is online
   */
  isUserOnline: (userId) => {
    const presence = get().userPresence[userId];
    return presence ? presence.isOnline : false;
  },

  /**
   * Get formatted last seen for a user
   */
  getUserLastSeen: (userId) => {
    const presence = get().userPresence[userId];
    return presence ? presence.lastSeenFormatted : 'never';
  },

  /**
   * Get all online users as array
   */
  getOnlineUsersArray: () => {
    return Object.values(get().onlineUsers).filter(user => user.isOnline);
  },

  /**
   * Get away status users
   */
  getAwayUsers: () => {
    return Object.values(get().onlineUsers).filter(user => user.status === 'away');
  },

  /**
   * Clear all presence data
   */
  clearPresence: () => {
    set({
      onlineUsers: {},
      userPresence: {},
      currentUserStatus: 'offline',
      error: null,
    });
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Cleanup listeners
   */
  cleanupListeners: () => {
    socketPresence.offUserStatusChanged();
    socketPresence.offPresenceInfo();
    socketPresence.offOnlineUsers();
  },
}));
