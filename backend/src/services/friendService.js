// Friend Service
import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export class FriendService {
  // Send friend request
  static async sendFriendRequest(senderId, recipientId, message = '') {
    // Check if already friends or request exists
    const existing = await FriendRequest.findOne({
      $or: [
        { senderId, recipientId, status: { $in: ['pending', 'accepted'] } },
        { senderId: recipientId, recipientId: senderId, status: { $in: ['pending', 'accepted'] } },
      ],
    });

    if (existing) {
      throw new Error('Friend request already exists');
    }

    const friendRequest = new FriendRequest({
      senderId,
      recipientId,
      message,
    });

    await friendRequest.save();

    // Create notification
    const recipient = await User.findById(recipientId);
    const sender = await User.findById(senderId);

    await Notification.create({
      userId: recipientId,
      actorId: senderId,
      type: 'friend_request',
      title: `${sender.username} sent you a friend request`,
      referenceId: friendRequest._id,
      referenceModel: 'FriendRequest',
    });

    return friendRequest;
  }

  // Accept friend request
  static async acceptFriendRequest(requestId, userId) {
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    if (friendRequest.recipientId.toString() !== userId) {
      throw new Error('Not authorized');
    }

    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    // Create notification for sender
    const sender = await User.findById(friendRequest.senderId);
    const recipient = await User.findById(userId);

    await Notification.create({
      userId: friendRequest.senderId,
      actorId: userId,
      type: 'friend_accepted',
      title: `${recipient.username} accepted your friend request`,
      referenceId: friendRequest._id,
    });

    return friendRequest;
  }

  // Reject friend request
  static async rejectFriendRequest(requestId, userId) {
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    if (friendRequest.recipientId.toString() !== userId) {
      throw new Error('Not authorized');
    }

    friendRequest.status = 'rejected';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    return friendRequest;
  }

  // Get pending friend requests
  static async getPendingRequests(userId) {
    const requests = await FriendRequest.find({
      recipientId: userId,
      status: 'pending',
    })
      .populate('senderId', 'username firstName lastName profilePicture status')
      .sort({ createdAt: -1 });

    return requests;
  }

  // Get sent friend requests
  static async getSentRequests(userId) {
    const requests = await FriendRequest.find({
      senderId: userId,
      status: 'pending',
    })
      .populate('recipientId', 'username firstName lastName profilePicture status')
      .sort({ createdAt: -1 });

    return requests;
  }

  // Remove friend
  static async removeFriend(userId, friendId) {
    const friendRequest = await FriendRequest.findOneAndUpdate(
      {
        $or: [
          { senderId: userId, recipientId: friendId },
          { senderId: friendId, recipientId: userId },
        ],
        status: 'accepted',
      },
      { status: 'rejected' },
      { new: true }
    );

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    return friendRequest;
  }
}

export default FriendService;
