import * as pinnedMessageService from '../services/pinnedMessageService.js';

/**
 * Pin a message
 * POST /api/chat/message/pin
 */
export const pinMessage = async (req, res) => {
  try {
    const { conversationId, messageId, reason } = req.body;
    const userId = req.user.id;

    if (!conversationId || !messageId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId and messageId are required',
      });
    }

    const pin = await pinnedMessageService.pinMessage(
      conversationId,
      messageId,
      userId,
      reason
    );

    res.status(201).json({
      success: true,
      message: 'Message pinned successfully',
      pin,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Unpin a message
 * DELETE /api/chat/message/pin/:conversationId/:messageId
 */
export const unpinMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const userId = req.user.id;

    const result = await pinnedMessageService.unpinMessage(conversationId, messageId, userId);

    res.status(200).json({
      success: true,
      message: 'Message unpinned successfully',
      result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get pinned messages
 * GET /api/chat/:conversationId/pinned?limit=20
 */
export const getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 20 } = req.query;

    const pins = await pinnedMessageService.getPinnedMessages(conversationId, parseInt(limit));

    res.status(200).json({
      success: true,
      pins,
      count: pins.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reorder pinned messages
 * PUT /api/chat/:conversationId/pins/reorder
 */
export const reorderPins = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { pinOrder } = req.body;

    if (!Array.isArray(pinOrder)) {
      return res.status(400).json({
        success: false,
        message: 'pinOrder must be an array of messageIds',
      });
    }

    const pins = await pinnedMessageService.reorderPins(conversationId, pinOrder);

    res.status(200).json({
      success: true,
      message: 'Pins reordered successfully',
      pins,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get pinned count
 * GET /api/chat/:conversationId/pinned/count
 */
export const getPinnedCount = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const count = await pinnedMessageService.getPinnedCount(conversationId);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
