// Presence/Online status Socket handlers with multi-device/tab support
import User from '../models/User.js';
import presenceService from '../services/presenceService.js';

const setupPresenceSockets = (io) => {
  io.on('connection', (socket) => {
    // When user connects, register their session
    socket.on('authenticate', async (userId) => {
      try {
        // Extract device info from user agent (simplified)
        const userAgent = socket.handshake.headers['user-agent'] || '';
        const deviceInfo = {
          type: 'web',
          userAgent,
        };

        // Register this socket/tab as a new session
        const sessionId = presenceService.registerSession(userId, socket.id, deviceInfo);
        socket.sessionId = sessionId;
        socket.userId = userId;

        // Join user-specific room for targeted updates
        socket.join(`user_${userId}`);

        // Update user status to online
        const result = await presenceService.updateUserStatus(userId, 'online');

        // Broadcast user came online to all users (with presence info)
        const presenceInfo = await presenceService.getPresenceInfo(userId);
        io.emit('user_status_changed', {
          ...presenceInfo,
          sessionCount: result.sessionCount,
        });

        console.log(`✓ User ${userId} connected (Session: ${sessionId}, Active sessions: ${result.sessionCount})`);
      } catch (error) {
        console.error('Error handling authenticate:', error);
      }
    });

    // User came online (explicit event from frontend)
    socket.on('user_online', async (userId) => {
      try {
        const result = await presenceService.updateUserStatus(userId, 'online');
        const presenceInfo = await presenceService.getPresenceInfo(userId);

        // Broadcast to all users
        io.emit('user_status_changed', {
          ...presenceInfo,
          sessionCount: result.sessionCount,
        });

        console.log(`📍 User ${userId} marked as online (Sessions: ${result.sessionCount})`);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    });

    // User went away/idle
    socket.on('user_away', async (userId) => {
      try {
        const result = await presenceService.updateUserStatus(userId, 'away');
        const presenceInfo = await presenceService.getPresenceInfo(userId);

        io.emit('user_status_changed', {
          ...presenceInfo,
          sessionCount: result.sessionCount,
        });

        console.log(`💤 User ${userId} marked as away (Sessions: ${result.sessionCount})`);
      } catch (error) {
        console.error('Error updating away status:', error);
      }
    });

    // User explicitly went offline
    socket.on('user_offline', async (userId) => {
      try {
        const result = await presenceService.updateUserStatus(userId, 'offline');
        const presenceInfo = await presenceService.getPresenceInfo(userId);

        io.emit('user_status_changed', {
          ...presenceInfo,
          sessionCount: 0,
        });

        console.log(`🔴 User ${userId} marked as offline (Sessions: ${result.sessionCount})`);
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    });

    // Get online users with full presence info
    socket.on('get_online_users', async () => {
      try {
        const onlineUsers = await User.find(
          { status: { $in: ['online', 'away'] }, isDeleted: false },
          '_id username status lastSeen profilePicture'
        ).lean();

        // Enrich with session counts and formatted last seen
        const enrichedUsers = onlineUsers.map(user => {
          const sessions = presenceService.getActiveSessions(user._id.toString());
          return {
            ...user,
            lastSeenFormatted: presenceService.formatLastSeen(user.lastSeen),
            sessionCount: sessions.length,
            isOnline: sessions.length > 0,
          };
        });

        socket.emit('online_users', enrichedUsers);
      } catch (error) {
        console.error('Error getting online users:', error);
        socket.emit('error', { message: 'Failed to fetch online users' });
      }
    });

    // Get presence info for specific user(s)
    socket.on('get_presence', async (userIds) => {
      try {
        const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
        const presenceInfo = await presenceService.getBulkPresenceInfo(userIdArray);
        socket.emit('presence_info', presenceInfo);
      } catch (error) {
        console.error('Error getting presence info:', error);
        socket.emit('error', { message: 'Failed to fetch presence info' });
      }
    });

    // Track user activity (prevents idle timeout)
    socket.on('user_activity', (userId) => {
      try {
        if (socket.userId === userId && socket.sessionId) {
          presenceService.recordActivity(userId, socket.sessionId);
        }
      } catch (error) {
        console.error('Error recording activity:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId;
        const sessionId = socket.sessionId;

        if (userId && sessionId) {
          // Unregister this session
          presenceService.unregisterSession(userId, sessionId);

          const sessions = presenceService.getActiveSessions(userId);

          // Only update as offline if no other sessions exist
          if (sessions.length === 0) {
            const presenceInfo = await presenceService.getPresenceInfo(userId);
            io.emit('user_status_changed', {
              ...presenceInfo,
              sessionCount: 0,
            });

            console.log(`🔴 User ${userId} fully offline (No active sessions)`);
          } else {
            console.log(`👤 User ${userId} session ended (${sessions.length} sessions remaining)`);
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
};

export default setupPresenceSockets;
