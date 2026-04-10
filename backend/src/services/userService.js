// User Service
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export class UserService {
  // Get user profile
  static async getUserProfile(userId) {
    const user = await User.findById(userId)
      .populate('blockedUsers', 'username profilePicture')
      .lean();
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update user profile
  static async updateUserProfile(userId, updateData) {
    const allowedFields = ['firstName', 'lastName', 'bio', 'phoneNumber', 'status'];
    const updates = {};

    allowedFields.forEach(field => {
      if (field in updateData) {
        updates[field] = updateData[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    return user;
  }

  // Upload profile picture
  static async uploadProfilePicture(userId, filePath) {
    const uploadsDir = './uploads/profiles';
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    // Compress and optimize image
    const filename = `${userId}-${Date.now()}.webp`;
    const optimizedPath = path.join(uploadsDir, filename);

    await sharp(filePath)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(optimizedPath);

    // Delete original temp file
    await fs.unlink(filePath);

    // Update user profile picture
    const user = await User.findById(userId);
    
    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPath = path.join('./uploads/profiles', path.basename(user.profilePicture));
      await fs.unlink(oldPath).catch(() => {}); // Ignore if file doesn't exist
    }

    user.profilePicture = `/uploads/profiles/${filename}`;
    await user.save();

    return user;
  }

  // Delete account - Comprehensive cleanup
  static async deleteAccount(userId, password) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    try {
      // 1. Update all messages from user - replace content with "User deleted"
      await Message.updateMany(
        { senderId: userId },
        {
          $set: {
            content: '[User deleted their account]',
            messageType: 'text',
            media: [],
            isDeleted: true,
            isEdited: true,
            editedAt: new Date(),
          },
        }
      );

      // 2. Delete all friend requests (sent and received)
      await FriendRequest.deleteMany({
        $or: [
          { senderId: userId },
          { recipientId: userId },
        ],
      });

      // 3. Remove user from all conversations
      const conversations = await Conversation.find({
        participants: userId,
      });

      for (const conversation of conversations) {
        if (conversation.participants.length === 1) {
          // Delete conversation if user is the only participant
          await Conversation.findByIdAndDelete(conversation._id);
        } else {
          // Remove user from conversation
          await Conversation.findByIdAndUpdate(
            conversation._id,
            { $pull: { participants: userId } }
          );
        }
      }

      // 4. Delete all notifications related to the user
      await Notification.deleteMany({
        $or: [
          { userId: userId },
          { actorId: userId },
        ],
      });

      // 5. Delete profile picture if exists
      if (user.profilePicture) {
        const picturePath = path.join(
          './uploads/profiles',
          path.basename(user.profilePicture)
        );
        await fs.unlink(picturePath).catch(() => {}); // Ignore if file doesn't exist
      }

      // 6. Delete cover photo if exists
      if (user.coverPhoto) {
        const coverPath = path.join(
          './uploads/covers',
          path.basename(user.coverPhoto)
        );
        await fs.unlink(coverPath).catch(() => {}); // Ignore if file doesn't exist
      }

      // 7. Soft delete the user account
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.username = `deleted_${userId}`;
      user.email = `deleted_${userId}@deleted.local`;
      user.password = null; // Remove password hash
      user.firstName = '[Deleted]';
      user.lastName = '[Deleted]';
      user.bio = null;
      user.phoneNumber = null;
      user.profilePicture = null;
      user.coverPhoto = null;
      user.blockedUsers = [];
      
      await user.save();

      return {
        message: 'Account deleted successfully. All your data has been deleted.',
        success: true,
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account. Please try again.');
    }
  }

  // Search users
  static async searchUsers(query, currentUserId, limit = 10) {
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
          ],
        },
        { isDeleted: false },
        { _id: { $ne: currentUserId } },
      ],
    })
      .select('username firstName lastName profilePicture status')
      .limit(limit)
      .lean();

    return users;
  }

  // Get friends list
  static async getFriends(userId) {
    const friendRequests = await FriendRequest.find({
      $or: [
        { senderId: userId, status: 'accepted' },
        { recipientId: userId, status: 'accepted' },
      ],
    })
      .populate({
        path: 'senderId',
        select: 'username firstName lastName profilePicture status lastSeen',
      })
      .populate({
        path: 'recipientId',
        select: 'username firstName lastName profilePicture status lastSeen',
      })
      .lean();

    const friends = friendRequests.map(fr => {
      return fr.senderId._id.toString() === userId
        ? fr.recipientId
        : fr.senderId;
    });

    return friends;
  }

  // Get friend suggestions
  static async getFriendSuggestions(userId, limit = 5) {
    const userFriends = await FriendRequest.find({
      $or: [
        { senderId: userId, status: 'accepted' },
        { recipientId: userId, status: 'accepted' },
      ],
    }).lean();

    const friendIds = userFriends.map(fr => 
      fr.senderId.toString() === userId ? fr.recipientId : fr.senderId
    );

    const suggestions = await User.find({
      $and: [
        { _id: { $nin: [...friendIds, userId] } },
        { isDeleted: false },
      ],
    })
      .select('username firstName lastName profilePicture status')
      .limit(limit)
      .lean();

    return suggestions;
  }

  // Block user
  static async blockUser(userId, blockUserId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { blockedUsers: blockUserId } },
      { new: true }
    );

    return user;
  }

  // Unblock user
  static async unblockUser(userId, blockUserId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { blockedUsers: blockUserId } },
      { new: true }
    );

    return user;
  }
}

export default UserService;
