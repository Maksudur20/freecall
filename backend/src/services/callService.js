// Call Service - Backend call management
import Call from '../models/Call.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export class CallService {
  /**
   * Create a new call
   * @param {string} callerId - Caller user ID
   * @param {string} receiverId - Receiver user ID
   * @param {string} type - Call type ('audio' or 'video')
   * @param {string} conversationId - Optional conversation ID
   * @returns {Promise<Call>} Created call object
   */
  static async createCall(callerId, receiverId, type = 'audio', conversationId = null) {
    try {
      const call = new Call({
        callerId,
        receiverId,
        type,
        status: 'initiated',
        conversationId,
        startTime: new Date(),
      });

      const savedCall = await call.save();
      return await savedCall
        .populate('callerId', 'username avatar')
        .populate('receiverId', 'username avatar')
        .populate('conversationId', 'name');
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  /**
   * Accept a call
   * @param {string} callId - Call ID
   * @returns {Promise<Call>} Updated call object
   */
  static async acceptCall(callId) {
    try {
      const call = await Call.findByIdAndUpdate(
        callId,
        { status: 'answered' },
        { new: true }
      )
        .populate('callerId', 'username avatar')
        .populate('receiverId', 'username avatar');

      return call;
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  /**
   * Decline/reject a call
   * @param {string} callId - Call ID
   * @param {string} reason - Decline reason
   * @returns {Promise<Call>} Updated call object
   */
  static async declineCall(callId, reason = 'Declined') {
    try {
      const call = await Call.findByIdAndUpdate(
        callId,
        { status: 'declined', declinedReason: reason },
        { new: true }
      );

      return call;
    } catch (error) {
      console.error('Error declining call:', error);
      throw error;
    }
  }

  /**
   * End a call
   * @param {string} callId - Call ID
   * @returns {Promise<Call>} Updated call object
   */
  static async endCall(callId) {
    try {
      const call = await Call.findByIdAndUpdate(
        callId,
        { status: 'ended', endTime: new Date() },
        { new: true }
      );

      return call;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  /**
   * Mark call as missed
   * @param {string} callId - Call ID
   * @returns {Promise<Call>} Updated call object
   */
  static async markCallAsMissed(callId) {
    try {
      const call = await Call.findByIdAndUpdate(
        callId,
        { status: 'missed', endTime: new Date() },
        { new: true }
      );

      return call;
    } catch (error) {
      console.error('Error marking call as missed:', error);
      throw error;
    }
  }

  /**
   * Get call history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of calls to fetch
   * @param {number} skip - Number of calls to skip (pagination)
   * @returns {Promise<Array>} Array of calls
   */
  static async getCallHistory(userId, limit = 20, skip = 0) {
    try {
      const calls = await Call.find({
        $or: [{ callerId: userId }, { receiverId: userId }],
      })
        .populate('callerId', 'username avatar')
        .populate('receiverId', 'username avatar')
        .populate('conversationId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return calls;
    } catch (error) {
      console.error('Error fetching call history:', error);
      throw error;
    }
  }

  /**
   * Get call history with user (both directions)
   * @param {string} userId - User ID
   * @param {string} otherUserId - Other user ID
   * @param {number} limit - Number of calls to fetch
   * @returns {Promise<Array>} Array of calls
   */
  static async getCallHistoryWithUser(userId, otherUserId, limit = 20) {
    try {
      const calls = await Call.find({
        $or: [
          { callerId: userId, receiverId: otherUserId },
          { callerId: otherUserId, receiverId: userId },
        ],
      })
        .populate('callerId', 'username avatar')
        .populate('receiverId', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return calls;
    } catch (error) {
      console.error('Error fetching call history with user:', error);
      throw error;
    }
  }

  /**
   * Get call statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Call statistics
   */
  static async getCallStats(userId) {
    try {
      // Total calls (incoming + outgoing)
      const totalCalls = await Call.countDocuments({
        $or: [{ callerId: userId }, { receiverId: userId }],
      });

      // Missed calls
      const missedCalls = await Call.countDocuments({
        receiverId: userId,
        status: 'missed',
      });

      // Declined calls
      const declinedCalls = await Call.countDocuments({
        receiverId: userId,
        status: 'declined',
      });

      // Completed calls
      const completedCalls = await Call.countDocuments({
        $or: [{ callerId: userId }, { receiverId: userId }],
        status: 'ended',
      });

      // Total duration (in seconds)
      const callsWithDuration = await Call.find(
        {
          $or: [{ callerId: userId }, { receiverId: userId }],
          status: 'ended',
          duration: { $exists: true, $gt: 0 },
        },
        { duration: 1 }
      ).lean();

      const totalDuration = callsWithDuration.reduce((sum, call) => sum + (call.duration || 0), 0);

      return {
        totalCalls,
        completedCalls,
        missedCalls,
        declinedCalls,
        totalDuration, // in seconds
        averageDuration: completedCalls > 0 ? totalDuration / completedCalls : 0,
      };
    } catch (error) {
      console.error('Error getting call stats:', error);
      throw error;
    }
  }

  /**
   * Create incoming call notification
   * @param {string} userId - User ID receiving notification
   * @param {string} callerId - Caller user ID
   * @param {string} callId - Call ID
   * @returns {Promise<Notification>} Created notification
   */
  static async createIncomingCallNotification(userId, callerId, callId) {
    try {
      const caller = await User.findById(callerId, 'username').lean();
      
      const notification = new Notification({
        userId,
        actorId: callerId,
        type: 'call_incoming',
        title: `Incoming call from ${caller?.username || 'Someone'}`,
        description: 'Incoming voice call',
        referenceId: callId,
        referenceModel: 'Call',
        actionUrl: `/call/${callId}`,
        metadata: {
          callId,
          callType: 'voice',
        },
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating incoming call notification:', error);
      throw error;
    }
  }

  /**
   * Create missed call notification
   * @param {string} userId - User ID
   * @param {string} callerId - Caller user ID
   * @param {string} callId - Call ID
   * @returns {Promise<Notification>} Created notification
   */
  static async createMissedCallNotification(userId, callerId, callId) {
    try {
      const caller = await User.findById(callerId, 'username').lean();
      
      const notification = new Notification({
        userId,
        actorId: callerId,
        type: 'call_missed',
        title: `Missed call from ${caller?.username || 'Someone'}`,
        description: 'You missed a voice call',
        referenceId: callId,
        referenceModel: 'Call',
        actionUrl: `/call-history`,
        metadata: {
          callId,
          callType: 'voice',
        },
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating missed call notification:', error);
      throw error;
    }
  }

  /**
   * Clean up stale calls (older than 24 hours with status 'initiated')
   * @returns {Promise<Object>} Deletion result
   */
  static async cleanupStaleCalls() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await Call.deleteMany({
        status: 'initiated',
        createdAt: { $lt: oneDayAgo },
      });

      return result;
    } catch (error) {
      console.error('Error cleaning up stale calls:', error);
      throw error;
    }
  }
}

export default CallService;
