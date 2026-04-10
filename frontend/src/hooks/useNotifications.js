// useNotifications Hook
// Easy-to-use React hook for managing notifications in components

import { useEffect, useCallback, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore.js';
import { socketNotification } from '../services/socket.js';

/**
 * Hook to use notifications in a component
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoInit - Auto-initialize listeners on mount (default: true)
 * @param {boolean} options.fetchOnMount - Fetch notifications on mount (default: true)
 * @param {boolean} options.soundEnabled - Enable notification sounds (default: true)
 * @returns {Object} Notifications API with state and actions
 */
export const useNotifications = (options = {}) => {
  const {
    autoInit = true,
    fetchOnMount = true,
    soundEnabled = true,
  } = options;

  const initializedRef = useRef(false);

  // Store actions and state
  const {
    notifications,
    unreadCount,
    badgeCount,
    isLoading,
    error,
    soundEnabled: storeSoundEnabled,
    initializeNotificationListeners,
    getNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    setSoundEnabled,
    playNotificationSound,
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationById,
    clearError,
    cleanupListeners,
    broadcastToTabs,
  } = useNotificationStore();

  // Initialize listeners on mount
  useEffect(() => {
    if (autoInit && !initializedRef.current) {
      initializeNotificationListeners();
      initializedRef.current = true;

      if (fetchOnMount) {
        getNotifications(20, 0);
      }

      if (soundEnabled) {
        setSoundEnabled(true);
      }
    }

    return () => {
      // Cleanup on unmount
      // Note: Don't cleanup on unmount to maintain cross-tab sync
      // cleanupListeners();
    };
  }, [autoInit, fetchOnMount, soundEnabled, initializeNotificationListeners, getNotifications, setSoundEnabled]);

  // Get unread count from server (useful for initial load)
  const fetchUnreadCount = useCallback(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      socketNotification.getUnreadCount(userId);
    }
  }, []);

  // Mark notification as read
  const readNotification = useCallback((notificationId) => {
    markAsRead(notificationId);
    socketNotification.markNotificationRead(notificationId);
  }, [markAsRead]);

  // Mark all as read
  const readAllNotifications = useCallback(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      markAllAsRead();
      socketNotification.markAllRead(userId);
    }
  }, [markAllAsRead]);

  // Delete a notification
  const removeNotification = useCallback((notificationId) => {
    deleteNotification(notificationId);
    socketNotification.deleteNotification(notificationId);
  }, [deleteNotification]);

  // Get notifications of a specific type
  const getByType = useCallback((type) => {
    return getNotificationsByType(type);
  }, [getNotificationsByType]);

  // Get unread notifications only
  const getUnread = useCallback(() => {
    return getUnreadNotifications();
  }, [getUnreadNotifications]);

  // Get a specific notification
  const getById = useCallback((id) => {
    return getNotificationById(id);
  }, [getNotificationById]);

  // Test notification sound
  const testSound = useCallback(() => {
    playNotificationSound();
  }, [playNotificationSound]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setSoundEnabled(!storeSoundEnabled);
      socketNotification.setNotificationSound(userId, !storeSoundEnabled);
    }
  }, [storeSoundEnabled, setSoundEnabled]);

  // Get notification type label
  const getTypeLabel = useCallback((type) => {
    const labels = {
      message: 'Message',
      friend_request: 'Friend Request',
      friend_accepted: 'Friend Accepted',
      call_incoming: 'Incoming Call',
      call_missed: 'Missed Call',
      mention: 'Mention',
      reaction: 'Reaction',
      system: 'System',
    };
    return labels[type] || type;
  }, []);

  // Get notification icon
  const getTypeIcon = useCallback((type) => {
    const icons = {
      message: '💬',
      friend_request: '👥',
      friend_accepted: '✅',
      call_incoming: '📞',
      call_missed: '📭',
      mention: '@',
      reaction: '😊',
      system: 'ℹ️',
    };
    return icons[type] || '🔔';
  }, []);

  // Get notification color
  const getTypeColor = useCallback((type) => {
    const colors = {
      message: 'bg-blue-100 border-blue-300',
      friend_request: 'bg-purple-100 border-purple-300',
      friend_accepted: 'bg-green-100 border-green-300',
      call_incoming: 'bg-yellow-100 border-yellow-300',
      call_missed: 'bg-red-100 border-red-300',
      mention: 'bg-orange-100 border-orange-300',
      reaction: 'bg-pink-100 border-pink-300',
      system: 'bg-gray-100 border-gray-300',
    };
    return colors[type] || 'bg-gray-100 border-gray-300';
  }, []);

  return {
    // State
    notifications,
    unreadCount,
    badgeCount,
    isLoading,
    error,
    soundEnabled: storeSoundEnabled,

    // Query methods
    getByType,
    getUnread,
    getById,

    // Action methods
    fetchUnreadCount,
    readNotification,
    readAllNotifications,
    removeNotification,
    clearAllNotifications,

    // Sound methods
    testSound,
    toggleSound,

    // Utility methods
    getTypeLabel,
    getTypeIcon,
    getTypeColor,

    // Cross-tab sync
    broadcastToTabs,

    // Cleanup
    clearError,
    cleanupListeners,
  };
};

export default useNotifications;
