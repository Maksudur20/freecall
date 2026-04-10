import MessageSchedule from '../models/MessageSchedule.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

/**
 * Schedule a message to be sent at a specific time
 */
export const scheduleMessage = async (
  senderId,
  conversationId,
  content,
  scheduledTime,
  messageType = 'text',
  mediaUrl = null
) => {
  try {
    // Validate scheduled time is in the future
    if (new Date(scheduledTime) <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    // Check conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(senderId)) {
      throw new Error('Conversation not found or user is not a participant');
    }

    const schedule = new MessageSchedule({
      senderId,
      conversationId,
      content,
      type: messageType,
      mediaUrl,
      scheduledTime,
      status: 'scheduled',
    });

    await schedule.save();
    return schedule;
  } catch (error) {
    throw new Error(`Failed to schedule message: ${error.message}`);
  }
};

/**
 * Get all scheduled messages for a user
 */
export const getUserScheduledMessages = async (userId, limit = 20, page = 1) => {
  try {
    const skip = (page - 1) * limit;

    const schedules = await MessageSchedule.find({
      senderId: userId,
      status: { $in: ['scheduled', 'failed'] },
    })
      .populate('conversationId', 'name isGroup')
      .sort({ scheduledTime: 1 })
      .limit(limit)
      .skip(skip);

    const total = await MessageSchedule.countDocuments({
      senderId: userId,
      status: { $in: ['scheduled', 'failed'] },
    });

    return { schedules, total };
  } catch (error) {
    throw new Error(`Failed to get scheduled messages: ${error.message}`);
  }
};

/**
 * Cancel a scheduled message
 */
export const cancelScheduledMessage = async (scheduleId, userId) => {
  try {
    const schedule = await MessageSchedule.findById(scheduleId);

    if (!schedule) {
      throw new Error('Scheduled message not found');
    }

    if (schedule.senderId.toString() !== userId) {
      throw new Error('Unauthorized to cancel this scheduled message');
    }

    if (schedule.status !== 'scheduled') {
      throw new Error('Only scheduled messages can be cancelled');
    }

    schedule.status = 'cancelled';
    await schedule.save();

    return schedule;
  } catch (error) {
    throw new Error(`Failed to cancel scheduled message: ${error.message}`);
  }
};

/**
 * Process scheduled messages (should be called by a cron job or scheduler)
 * This is the worker function that sends pending scheduled messages
 */
export const processScheduledMessages = async (io = null) => {
  try {
    const now = new Date();

    // Find all messages that should be sent
    const pendingMessages = await MessageSchedule.find({
      scheduledTime: { $lte: now },
      status: 'scheduled',
    }).populate('senderId conversationId');

    for (const schedule of pendingMessages) {
      try {
        // Create the actual message
        const message = new Message({
          conversationId: schedule.conversationId._id,
          senderId: schedule.senderId._id,
          content: schedule.content,
          type: schedule.type,
          mediaUrl: schedule.mediaUrl,
          isScheduled: true,
          status: 'sent',
        });

        await message.save();

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(
          schedule.conversationId._id,
          {
            lastMessage: message._id,
            lastMessageAt: new Date(),
          },
          { new: true }
        );

        // Update schedule record
        schedule.status = 'sent';
        schedule.messageId = message._id;
        schedule.isDelivered = true;
        await schedule.save();

        // Emit real-time event if Socket.io is available
        if (io) {
          io.to(`conversation_${schedule.conversationId._id}`).emit('scheduled-message-delivered', {
            message: message.toObject(),
            scheduleId: schedule._id,
          });
        }
      } catch (messageError) {
        // Mark as failed but keep the schedule for retry
        schedule.status = 'failed';
        schedule.failureReason = messageError.message;
        await schedule.save();

        console.error(
          `Failed to send scheduled message ${schedule._id}: ${messageError.message}`
        );
      }
    }

    return {
      processed: pendingMessages.length,
      timestamp: new Date(),
    };
  } catch (error) {
    throw new Error(`Failed to process scheduled messages: ${error.message}`);
  }
};

/**
 * Reschedule a message
 */
export const rescheduleMessage = async (scheduleId, newScheduledTime, userId) => {
  try {
    const schedule = await MessageSchedule.findById(scheduleId);

    if (!schedule) {
      throw new Error('Scheduled message not found');
    }

    if (schedule.senderId.toString() !== userId) {
      throw new Error('Unauthorized to reschedule this message');
    }

    if (schedule.status !== 'scheduled') {
      throw new Error('Only pending scheduled messages can be rescheduled');
    }

    if (new Date(newScheduledTime) <= new Date()) {
      throw new Error('New scheduled time must be in the future');
    }

    schedule.scheduledTime = newScheduledTime;
    await schedule.save();

    return schedule;
  } catch (error) {
    throw new Error(`Failed to reschedule message: ${error.message}`);
  }
};

/**
 * Get scheduling statistics for a user
 */
export const getSchedulingStats = async (userId) => {
  try {
    const stats = await MessageSchedule.aggregate([
      { $match: { senderId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await MessageSchedule.countDocuments({ senderId: userId });
    const scheduled = await MessageSchedule.countDocuments({
      senderId: userId,
      status: 'scheduled',
    });
    const sent = await MessageSchedule.countDocuments({ senderId: userId, status: 'sent' });
    const failed = await MessageSchedule.countDocuments({
      senderId: userId,
      status: 'failed',
    });

    return {
      total,
      scheduled,
      sent,
      failed,
      byStatus: stats,
    };
  } catch (error) {
    throw new Error(`Failed to get scheduling stats: ${error.message}`);
  }
};
