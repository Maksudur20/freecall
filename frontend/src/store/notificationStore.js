// Notification Store
import { create } from 'zustand';
import { notificationAPI } from '../services/api.js';
import { socketNotification } from '../services/socket.js';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  soundEnabled: localStorage.getItem('notificationSoundEnabled') !== 'false',
  badgeCount: 0,

  // Initialize listeners for real-time updates
  initializeNotificationListeners: () => {
    // Listen for new notifications in real-time
    socketNotification.onNotification((data) => {
      set(state => ({
        notifications: [data.data, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        badgeCount: state.badgeCount + 1,
      }));

      // Play sound if enabled
      if (get().soundEnabled) {
        get().playNotificationSound();
      }

      // Update document title with badge
      get().updateDocumentTitle();
    });

    // Listen for notification read
    socketNotification.onNotificationRead((data) => {
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === data.notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      get().updateDocumentTitle();
    });

    // Listen for all notifications marked as read
    socketNotification.onAllNotificationsRead(() => {
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
        badgeCount: 0,
      }));
      get().updateDocumentTitle();
    });

    // Listen for notification deleted
    socketNotification.onNotificationDeleted((data) => {
      set(state => ({
        notifications: state.notifications.filter(n => n._id !== data.notificationId),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      get().updateDocumentTitle();
    });

    // Sync across tabs using BroadcastChannel
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('notifications');
      
      channel.onmessage = (event) => {
        if (event.data.type === 'notification_added') {
          set(state => ({
            notifications: [event.data.notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
            badgeCount: state.badgeCount + 1,
          }));
        } else if (event.data.type === 'notification_read') {
          set(state => ({
            notifications: state.notifications.map(n =>
              n._id === event.data.notificationId ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));
        } else if (event.data.type === 'unread_count') {
          set({ unreadCount: event.data.count, badgeCount: event.data.count });
        }
      };

      // Store for cleanup
      get().broadcastChannel = channel;
    }
  },

  // Broadcast to other tabs
  broadcastToTabs: (message) => {
    if ('BroadcastChannel' in window && get().broadcastChannel) {
      get().broadcastChannel.postMessage(message);
    }
  },

  getNotifications: async (limit = 20, skip = 0) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationAPI.getNotifications(limit, skip);
      set({
        notifications: response.notifications,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      badgeCount: state.badgeCount + 1,
    }));

    // Broadcast to other tabs
    get().broadcastToTabs({
      type: 'notification_added',
      notification,
    });

    // Play sound if enabled
    if (get().soundEnabled) {
      get().playNotificationSound();
    }

    get().updateDocumentTitle();
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));

      // Broadcast to other tabs
      get().broadcastToTabs({
        type: 'notification_read',
        notificationId,
      });

      get().updateDocumentTitle();
    } catch (error) {
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
        badgeCount: 0,
      }));

      // Broadcast to other tabs
      get().broadcastToTabs({
        type: 'all_read',
      });

      get().updateDocumentTitle();
    } catch (error) {
      set({ error: error.message });
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      set(state => ({
        notifications: state.notifications.filter(n => n._id !== notificationId),
      }));

      // Broadcast to other tabs
      get().broadcastToTabs({
        type: 'notification_deleted',
        notificationId,
      });
    } catch (error) {
      set({ error: error.message });
    }
  },

  setUnreadCount: (count) => {
    set({ unreadCount: count, badgeCount: count });
    get().broadcastToTabs({
      type: 'unread_count',
      count,
    });
  },

  // Sound management
  playNotificationSound: () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Could not play notification sound:', err));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    localStorage.setItem('notificationSoundEnabled', enabled);
    
    if (enabled) {
      // Test the sound
      get().playNotificationSound();
    }
  },

  // Update document title with unread count
  updateDocumentTitle: () => {
    const { unreadCount, badgeCount } = get();
    if (badgeCount > 0) {
      document.title = `(${badgeCount}) FreeCall`;
    } else {
      document.title = 'FreeCall';
    }
  },

  // Get notifications by type
  getNotificationsByType: (type) => {
    return get().notifications.filter(n => n.type === type);
  },

  // Get unread notifications
  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.isRead);
  },

  // Get notification by ID
  getNotificationById: (id) => {
    return get().notifications.find(n => n._id === id);
  },

  // Clear all notifications (user action)
  clearAllNotifications: async () => {
    try {
      set({ notifications: [], unreadCount: 0, badgeCount: 0 });
      get().updateDocumentTitle();
    } catch (error) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),

  // Cleanup listeners
  cleanupListeners: () => {
    socketNotification.offNotification();
    socketNotification.offNotificationRead();
    socketNotification.offAllNotificationsRead();
    socketNotification.offNotificationDeleted();
    
    if (get().broadcastChannel) {
      get().broadcastChannel.close();
    }
  },
}));

