// Friend Controller
import FriendService from '../services/friendService.js';

export const friendController = {
  // Send friend request
  sendRequest: async (req, res, next) => {
    try {
      const { recipientId, message = '' } = req.body;

      if (!recipientId) {
        return res.status(400).json({ error: 'Recipient ID required' });
      }

      const request = await FriendService.sendFriendRequest(
        req.user.id,
        recipientId,
        message
      );

      res.status(201).json({
        message: 'Friend request sent',
        friendRequest: request,
      });
    } catch (error) {
      if (error.message === 'Friend request already exists') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  // Accept friend request
  acceptRequest: async (req, res, next) => {
    try {
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'Request ID required' });
      }

      const request = await FriendService.acceptFriendRequest(requestId, req.user.id);

      res.json({
        message: 'Friend request accepted',
        friendRequest: request,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Reject friend request
  rejectRequest: async (req, res, next) => {
    try {
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'Request ID required' });
      }

      const request = await FriendService.rejectFriendRequest(requestId, req.user.id);

      res.json({
        message: 'Friend request rejected',
        friendRequest: request,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get pending requests
  getPending: async (req, res, next) => {
    try {
      const requests = await FriendService.getPendingRequests(req.user.id);
      res.json({ friendRequests: requests });
    } catch (error) {
      next(error);
    }
  },

  // Get sent requests
  getSent: async (req, res, next) => {
    try {
      const requests = await FriendService.getSentRequests(req.user.id);
      res.json({ sentRequests: requests });
    } catch (error) {
      next(error);
    }
  },

  // Remove friend
  removeFriend: async (req, res, next) => {
    try {
      const { friendId } = req.body;

      if (!friendId) {
        return res.status(400).json({ error: 'Friend ID required' });
      }

      await FriendService.removeFriend(req.user.id, friendId);

      res.json({ message: 'Friend removed' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

export default friendController;
