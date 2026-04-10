// Notification Controller
import NotificationService from '../services/notificationService.js';

export const notificationController = {
  // Get notifications
  getNotifications: async (req, res, next) => {
    try {
      const { limit = 20, skip = 0 } = req.query;
      const result = await NotificationService.getNotifications(
        req.user.id,
        parseInt(limit),
        parseInt(skip)
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Mark as read
  markAsRead: async (req, res, next) => {
    try {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID required' });
      }

      await NotificationService.markAsRead(notificationId);
      res.json({ message: 'Marked as read' });
    } catch (error) {
      next(error);
    }
  },

  // Mark all as read
  markAllAsRead: async (req, res, next) => {
    try {
      await NotificationService.markAllAsRead(req.user.id);
      res.json({ message: 'All marked as read' });
    } catch (error) {
      next(error);
    }
  },

  // Get unread count
  getUnreadCount: async (req, res, next) => {
    try {
      const count = await NotificationService.getUnreadCount(req.user.id);
      res.json({ unreadCount: count });
    } catch (error) {
      next(error);
    }
  },

  // Delete notification
  deleteNotification: async (req, res, next) => {
    try {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID required' });
      }

      await NotificationService.deleteNotification(notificationId);
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  },
};

export default notificationController;
