// Notification Socket handlers
import NotificationService from '../services/notificationService.js';

const setupNotificationSockets = (io) => {
  io.on('connection', (socket) => {
    // Get unread notification count
    socket.on('get_unread_count', async (userId) => {
      try {
        const count = await NotificationService.getUnreadCount(userId);
        socket.emit('unread_count', { count });
      } catch (error) {
        console.error('Error getting unread count:', error);
        socket.emit('error', { message: 'Failed to get unread count' });
      }
    });

    // Get notifications with pagination
    socket.on('get_notifications', async (userId, limit = 20, skip = 0) => {
      try {
        const { notifications, total } = await NotificationService.getNotifications(
          userId,
          limit,
          skip
        );
        socket.emit('notifications_list', { notifications, total, skip, limit });
      } catch (error) {
        console.error('Error getting notifications:', error);
        socket.emit('error', { message: 'Failed to fetch notifications' });
      }
    });

    // Mark notification as read
    socket.on('mark_notification_read', async (notificationId) => {
      try {
        const notification = await NotificationService.markAsRead(notificationId);
        
        // Broadcast to user's room that notification was read
        const userId = socket.userId;
        io.to(`user_${userId}`).emit('notification_read', {
          notificationId,
          notification,
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark as read' });
      }
    });

    // Mark all notifications as read
    socket.on('mark_all_notifications_read', async (userId) => {
      try {
        await NotificationService.markAllAsRead(userId);
        
        // Broadcast to user's room
        io.to(`user_${userId}`).emit('all_notifications_read');
      } catch (error) {
        console.error('Error marking all as read:', error);
        socket.emit('error', { message: 'Failed to mark all as read' });
      }
    });

    // Delete notification
    socket.on('delete_notification', async (notificationId) => {
      try {
        await NotificationService.deleteNotification(notificationId);
        
        const userId = socket.userId;
        io.to(`user_${userId}`).emit('notification_deleted', { notificationId });
      } catch (error) {
        console.error('Error deleting notification:', error);
        socket.emit('error', { message: 'Failed to delete notification' });
      }
    });

    // Sound preference
    socket.on('set_notification_sound', (userId, enabled) => {
      // Store in memory or you could persist to user settings
      socket.notificationSoundEnabled = enabled;
    });
  });
};

export default setupNotificationSockets;
