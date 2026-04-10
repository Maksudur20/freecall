// Notification Service
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export class NotificationService {
  // Get notifications
  static async getNotifications(userId, limit = 20, skip = 0) {
    const notifications = await Notification.find({ userId })
      .populate('actorId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments({ userId });

    return { notifications, total };
  }

  // Mark as read
  static async markAsRead(notificationId) {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    ).populate('actorId', 'username profilePicture');

    return notification;
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return count;
  }

  // Delete notification
  static async deleteNotification(notificationId) {
    await Notification.findByIdAndDelete(notificationId);
  }

  // Create notification
  static async createNotification(data) {
    const notification = new Notification(data);
    await notification.save();
    return notification.populate('actorId', 'username profilePicture');
  }

  // Create message notification
  static async createMessageNotification(userId, actorId, messageId, conversationId) {
    try {
      const actor = await User.findById(actorId).select('username');
      
      const notification = await this.createNotification({
        userId,
        actorId,
        type: 'message',
        title: `New message from ${actor.username}`,
        description: 'You have a new message',
        referenceId: messageId,
        referenceModel: 'Message',
        actionUrl: `/chat/${conversationId}`,
        metadata: { conversationId },
      });

      return notification;
    } catch (error) {
      console.error('Error creating message notification:', error);
      throw error;
    }
  }

  // Create friend request notification
  static async createFriendRequestNotification(senderId, recipientId, friendRequestId) {
    try {
      const sender = await User.findById(senderId).select('username');
      
      const notification = await this.createNotification({
        userId: recipientId,
        actorId: senderId,
        type: 'friend_request',
        title: `New friend request from ${sender.username}`,
        description: `${sender.username} sent you a friend request`,
        referenceId: friendRequestId,
        referenceModel: 'FriendRequest',
        actionUrl: '/friends/requests',
      });

      return notification;
    } catch (error) {
      console.error('Error creating friend request notification:', error);
      throw error;
    }
  }

  // Create friend accepted notification
  static async createFriendAcceptedNotification(userId, actorId) {
    try {
      const actor = await User.findById(actorId).select('username');
      
      const notification = await this.createNotification({
        userId,
        actorId,
        type: 'friend_accepted',
        title: `${actor.username} accepted your friend request`,
        description: `You are now friends with ${actor.username}`,
        actionUrl: '/friends',
      });

      return notification;
    } catch (error) {
      console.error('Error creating friend accepted notification:', error);
      throw error;
    }
  }

  // Create incoming call notification
  static async createIncomingCallNotification(userId, actorId, callId) {
    try {
      const actor = await User.findById(actorId).select('username');
      
      const notification = await this.createNotification({
        userId,
        actorId,
        type: 'call_incoming',
        title: `Incoming call from ${actor.username}`,
        description: `${actor.username} is calling...`,
        referenceId: callId,
        referenceModel: 'Call',
        actionUrl: `/call/${callId}`,
      });

      return notification;
    } catch (error) {
      console.error('Error creating incoming call notification:', error);
      throw error;
    }
  }

  // Create missed call notification
  static async createMissedCallNotification(userId, actorId) {
    try {
      const actor = await User.findById(actorId).select('username');
      
      const notification = await this.createNotification({
        userId,
        actorId,
        type: 'call_missed',
        title: `Missed call from ${actor.username}`,
        description: `You missed a call from ${actor.username}`,
        actionUrl: '/calls',
      });

      return notification;
    } catch (error) {
      console.error('Error creating missed call notification:', error);
      throw error;
    }
  }
}

export default NotificationService;
