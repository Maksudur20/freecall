// usePresence Hook
// Easy-to-use React hook for managing presence in components

import { useEffect, useCallback, useRef } from 'react';
import { usePresenceStore } from '../store/presenceStore.js';

/**
 * Hook to use presence features in a component
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoInit - Auto-initialize listeners on mount (default: true)
 * @param {boolean} options.fetchOnlineUsers - Fetch online users on mount (default: true)
 * @param {string|string[]} options.watchUsers - User ID(s) to watch for presence changes
 * @returns {Object} Presence API with state and actions
 */
export const usePresence = (options = {}) => {
  const {
    autoInit = true,
    fetchOnlineUsers: shouldFetchOnlineUsers = true,
    watchUsers = [],
  } = options;

  const initializedRef = useRef(false);
  const activityTimeoutRef = useRef(null);

  // Store actions and state
  const {
    onlineUsers,
    userPresence,
    currentUserStatus,
    isLoading,
    error,
    initializePresenceListeners,
    fetchOnlineUsers,
    getPresence,
    setCurrentUserStatus,
    recordActivity,
    getUserPresence,
    isUserOnline,
    getUserLastSeen,
    getOnlineUsersArray,
    getAwayUsers,
    clearPresence,
    clearError,
    cleanupListeners,
  } = usePresenceStore();

  // Initialize listeners on mount
  useEffect(() => {
    if (autoInit && !initializedRef.current) {
      initializePresenceListeners();
      initializedRef.current = true;

      if (shouldFetchOnlineUsers) {
        fetchOnlineUsers();
      }
    }

    return () => {
      // Cleanup on unmount
      cleanupListeners();
    };
  }, [autoInit, shouldFetchOnlineUsers, initializePresenceListeners, fetchOnlineUsers, cleanupListeners]);

  // Watch specific users
  useEffect(() => {
    if (watchUsers.length > 0) {
      getPresence(watchUsers);
    }
  }, [watchUsers, getPresence]);

  // Auto-record activity on user interaction
  const handleActivityWithDebounce = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Broadcast activity every 30 seconds max
    activityTimeoutRef.current = setTimeout(() => {
      recordActivity();
    }, 30000);
  }, [recordActivity]);

  // Setup activity listener
  useEffect(() => {
    const handleMouseMove = handleActivityWithDebounce;
    const handleKeyPress = handleActivityWithDebounce;
    const handleMouseClick = handleActivityWithDebounce;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('click', handleMouseClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('click', handleMouseClick);
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [handleActivityWithDebounce]);

  // Set current user's status
  const setStatus = useCallback((status) => {
    setCurrentUserStatus(status);
  }, [setCurrentUserStatus]);

  // Mark as online
  const goOnline = useCallback(() => {
    setCurrentUserStatus('online');
  }, [setCurrentUserStatus]);

  // Mark as away
  const goAway = useCallback(() => {
    setCurrentUserStatus('away');
  }, [setCurrentUserStatus]);

  // Mark as offline
  const goOffline = useCallback(() => {
    setCurrentUserStatus('offline');
  }, [setCurrentUserStatus]);

  // Mark as do not disturb
  const setDND = useCallback(() => {
    setCurrentUserStatus('dnd');
  }, [setCurrentUserStatus]);

  // Get status display text
  const getStatusLabel = useCallback((status) => {
    const labels = {
      online: 'Online',
      away: 'Away',
      offline: 'Offline',
      dnd: 'Do Not Disturb',
    };
    return labels[status] || 'Unknown';
  }, []);

  // Get status color for UI
  const getStatusColor = useCallback((status) => {
    const colors = {
      online: 'text-green-500',
      away: 'text-yellow-500',
      offline: 'text-gray-500',
      dnd: 'text-red-500',
    };
    return colors[status] || 'text-gray-400';
  }, []);

  // Get status badge color
  const getStatusBadgeColor = useCallback((status) => {
    const colors = {
      online: 'bg-green-500',
      away: 'bg-yellow-500',
      offline: 'bg-gray-500',
      dnd: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-400';
  }, []);

  // Check if user is online
  const checkUserOnline = useCallback((userId) => {
    return isUserOnline(userId);
  }, [isUserOnline]);

  // Refresh online users
  const refreshOnlineUsers = useCallback(() => {
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  return {
    // State
    onlineUsers,
    userPresence,
    currentUserStatus,
    isLoading,
    error,

    // Current user actions
    setStatus,
    goOnline,
    goAway,
    goOffline,
    setDND,
    recordActivity: handleActivityWithDebounce,

    // Status utilities
    getStatusLabel,
    getStatusColor,
    getStatusBadgeColor,

    // User presence queries
    getUserPresence,
    checkUserOnline,
    getUserLastSeen,
    getOnlineUsersArray,
    getAwayUsers,

    // List operations
    fetchOnlineUsers: refreshOnlineUsers,
    getPresenceForUsers: getPresence,

    // Cleanup
    clearPresence,
    clearError,
  };
};

export default usePresence;
