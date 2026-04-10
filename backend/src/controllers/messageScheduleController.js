import * as messageScheduleService from '../services/messageScheduleService.js';

/**
 * Schedule a message
 * POST /api/chat/message/schedule
 */
export const scheduleMessage = async (req, res) => {
  try {
    const { conversationId, content, scheduledTime, type = 'text', mediaUrl } = req.body;
    const userId = req.user.id;

    if (!conversationId || !content || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'conversationId, content, and scheduledTime are required',
      });
    }

    const schedule = await messageScheduleService.scheduleMessage(
      userId,
      conversationId,
      content,
      scheduledTime,
      type,
      mediaUrl
    );

    res.status(201).json({
      success: true,
      message: 'Message scheduled successfully',
      schedule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's scheduled messages
 * GET /api/chat/messages/scheduled
 */
export const getScheduledMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page = 1 } = req.query;

    const result = await messageScheduleService.getUserScheduledMessages(
      userId,
      parseInt(limit),
      parseInt(page)
    );

    res.status(200).json({
      success: true,
      schedules: result.schedules,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancel a scheduled message
 * DELETE /api/chat/message/schedule/:scheduleId
 */
export const cancelScheduledMessage = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user.id;

    const schedule = await messageScheduleService.cancelScheduledMessage(scheduleId, userId);

    res.status(200).json({
      success: true,
      message: 'Scheduled message cancelled',
      schedule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reschedule a message
 * PUT /api/chat/message/schedule/:scheduleId
 */
export const rescheduleMessage = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { newScheduledTime } = req.body;
    const userId = req.user.id;

    if (!newScheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'newScheduledTime is required',
      });
    }

    const schedule = await messageScheduleService.rescheduleMessage(
      scheduleId,
      newScheduledTime,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Message rescheduled successfully',
      schedule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get scheduling statistics
 * GET /api/chat/messages/schedule/stats
 */
export const getSchedulingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await messageScheduleService.getSchedulingStats(userId);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
