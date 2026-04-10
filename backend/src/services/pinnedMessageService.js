import PinnedMessage from '../models/PinnedMessage.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

/**
 * Pin a message in a conversation
 */
export const pinMessage = async (conversationId, messageId, userId, reason = null) => {
  try {
    // Verify message exists and belongs to conversation
    const message = await Message.findOne({
      _id: messageId,
      conversationId,
    });

    if (!message) {
      throw new Error('Message not found in this conversation');
    }

    // Check if already pinned
    const existing = await PinnedMessage.findOne({
      conversationId,
      messageId,
    });

    if (existing) {
      throw new Error('Message is already pinned');
    }

    // Get the highest order
    const highest = await PinnedMessage.findOne({ conversationId }).sort({ order: -1 });
    const newOrder = (highest?.order || 0) + 1;

    // Create pin
    const pin = new PinnedMessage({
      conversationId,
      messageId,
      pinnedBy: userId,
      reason,
      order: newOrder,
    });

    await pin.save();
    return pin.populate('messageId pinnedBy', 'content senderId username profilePicture');
  } catch (error) {
    throw new Error(`Failed to pin message: ${error.message}`);
  }
};

/**
 * Unpin a message
 */
export const unpinMessage = async (conversationId, messageId, userId) => {
  try {
    const pin = await PinnedMessage.findOne({
      conversationId,
      messageId,
    });

    if (!pin) {
      throw new Error('Pinned message not found');
    }

    await PinnedMessage.deleteOne({ _id: pin._id });

    // Reorder remaining pins
    const remaining = await PinnedMessage.find({ conversationId }).sort({ order: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].order = i + 1;
      await remaining[i].save();
    }

    return { success: true, messageId };
  } catch (error) {
    throw new Error(`Failed to unpin message: ${error.message}`);
  }
};

/**
 * Get pinned messages in a conversation
 */
export const getPinnedMessages = async (conversationId, limit = 20) => {
  try {
    const pins = await PinnedMessage.find({ conversationId })
      .populate('messageId', 'content senderId type mediaUrl createdAt')
      .populate('pinnedBy', 'username profilePicture')
      .sort({ order: 1 })
      .limit(limit);

    return pins;
  } catch (error) {
    throw new Error(`Failed to get pinned messages: ${error.message}`);
  }
};

/**
 * Reorder pinned messages
 */
export const reorderPins = async (conversationId, pinOrder) => {
  try {
    // pinOrder should be array of messageIds in desired order
    for (let i = 0; i < pinOrder.length; i++) {
      await PinnedMessage.updateOne(
        {
          conversationId,
          messageId: pinOrder[i],
        },
        { order: i + 1 }
      );
    }

    return getPinnedMessages(conversationId);
  } catch (error) {
    throw new Error(`Failed to reorder pins: ${error.message}`);
  }
};

/**
 * Check if message is pinned
 */
export const isMessagePinned = async (conversationId, messageId) => {
  try {
    const pin = await PinnedMessage.findOne({
      conversationId,
      messageId,
    });

    return !!pin;
  } catch (error) {
    return false;
  }
};

/**
 * Get pinned message count
 */
export const getPinnedCount = async (conversationId) => {
  try {
    return await PinnedMessage.countDocuments({ conversationId });
  } catch (error) {
    throw new Error(`Failed to get pinned count: ${error.message}`);
  }
};

/**
 * Clear all pins in conversation
 */
export const clearAllPins = async (conversationId) => {
  try {
    const result = await PinnedMessage.deleteMany({ conversationId });
    return result.deletedCount;
  } catch (error) {
    throw new Error(`Failed to clear pins: ${error.message}`);
  }
};
