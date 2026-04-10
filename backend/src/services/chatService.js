// Chat Service
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export class ChatService {
  // Create or get conversation
  static async getOrCreateConversation(userId1, userId2) {
    let conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] },
      isGroupChat: false,
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId1, userId2],
        isGroupChat: false,
      });
      await conversation.save();
    }

    return conversation;
  }

  // Get conversations
  static async getConversations(userId, limit = 20) {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'username profilePicture status lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .limit(limit);

    return conversations;
  }

  // Get messages
  static async getMessages(conversationId, limit = 50, skip = 0) {
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username profilePicture')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return messages.reverse();
  }

  // Send message
  static async sendMessage(conversationId, senderId, content, messageType = 'text') {
    const message = new Message({
      conversationId,
      senderId,
      content,
      messageType,
      status: 'sent',
    });

    await message.save();
    await message.populate('senderId', 'username profilePicture');

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessage: message._id },
      { new: true }
    );

    return message;
  }

  // Mark message as delivered
  static async markMessageDelivered(messageId) {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { status: 'delivered' },
      { new: true }
    );

    return message;
  }

  // Mark messages as seen
  static async markMessagesSeen(conversationId, userId) {
    const messages = await Message.find({
      conversationId,
      status: { $ne: 'seen' },
    });

    const updatePromises = messages.map(msg => {
      if (!msg.seenBy.find(s => s.userId.toString() === userId.toString())) {
        msg.seenBy.push({ userId, seenAt: new Date() });
        msg.status = 'seen';
      }
      return msg.save();
    });

    await Promise.all(updatePromises);
    return messages;
  }

  // Edit message
  static async editMessage(messageId, senderId, newContent) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId.toString() !== senderId) {
      throw new Error('Not authorized');
    }

    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return message;
  }

  // Delete message
  static async deleteMessage(messageId, senderId, deleteForEveryone = false) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId.toString() !== senderId) {
      throw new Error('Not authorized');
    }

    if (deleteForEveryone) {
      message.isDeleted = true;
      message.content = null;
      message.media = [];
    } else {
      message.deletedBy = {
        oneForMe: true,
        deletedAt: new Date(),
      };
    }

    await message.save();
    return message;
  }

  // Add reaction
  static async addReaction(messageId, userId, emoji) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

    if (reactionIndex > -1) {
      // Check if user already reacted
      const userIndex = message.reactions[reactionIndex].users.findIndex(
        u => u.toString() === userId
      );

      if (userIndex > -1) {
        // Remove reaction
        message.reactions[reactionIndex].users.splice(userIndex, 1);
        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        // Add reaction
        message.reactions[reactionIndex].users.push(userId);
      }
    } else {
      // New reaction
      message.reactions.push({
        emoji,
        users: [userId],
      });
    }

    await message.save();
    return message;
  }

  // Upload media
  static async uploadMedia(conversationId, senderId, files) {
    const uploadsDir = './uploads/media';
    await fs.mkdir(uploadsDir, { recursive: true });

    const media = [];

    for (const file of files) {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Process image (compress)
      if (file.mimetype.startsWith('image/')) {
        await sharp(file.buffer)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .toFile(filepath);
      } else {
        // Save other file types directly
        await fs.writeFile(filepath, file.buffer);
      }

      media.push({
        url: `/uploads/media/${filename}`,
        type: file.mimetype.startsWith('image/') ? 'image' : 'file',
        name: file.originalname,
        size: file.size,
      });
    }

    return media;
  }
}

export default ChatService;
