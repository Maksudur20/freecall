// WebRTC Calling Socket handlers
import Call from '../models/Call.js';
import CallService from '../services/callService.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const setupCallSockets = (io) => {
  // Store active calls with connection details
  const activeCalls = new Map();
  // Store user socket connections
  const userSockets = new Map();

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;

    // Track user socket connection
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, []);
      }
      userSockets.get(userId).push(socket.id);
    }

    // Register user for call notifications
    socket.join(`user_${userId}`);

    // ==================== CALL INITIATION ====================
    socket.on('initiate_call', async (data) => {
      try {
        const { receiverId, type = 'audio', conversationId } = data;

        if (!receiverId) {
          socket.emit('call_error', { message: 'Receiver ID is required' });
          return;
        }

        // Create call record using service
        const call = await CallService.createCall(userId, receiverId, type, conversationId);

        // Store in active calls
        activeCalls.set(call._id.toString(), {
          callId: call._id,
          callerId: userId,
          receiverId,
          type,
          status: 'initiated',
          connectedAt: null,
          callerSocket: socket.id,
          receiverSocket: null,
          connectionStatus: 'initiating',
        });

        // Send incoming call notification to receiver
        io.to(`user_${receiverId}`).emit('incoming_call', {
          callId: call._id,
          callerId: userId,
          callerName: socket.handshake.auth.username || 'Unknown',
          type,
          conversationId,
          timestamp: new Date(),
        });

        // Emit success to caller
        socket.emit('call_initiated', {
          callId: call._id,
          status: 'waiting_for_acceptance',
        });

        // Create incoming call notification
        await CallService.createIncomingCallNotification(receiverId, userId, call._id);
      } catch (error) {
        console.error('Error initiating call:', error);
        socket.emit('call_error', { message: 'Failed to initiate call' });
      }
    });

    // ==================== CALL ACCEPTANCE ====================
    socket.on('accept_call', async (data) => {
      try {
        const { callId } = data;

        // Update call status
        const call = await CallService.acceptCall(callId);
        
        if (!call) {
          socket.emit('call_error', { message: 'Call not found' });
          return;
        }

        // Update active call
        const activeCall = activeCalls.get(callId);
        if (activeCall) {
          activeCall.status = 'answered';
          activeCall.receiverSocket = socket.id;
          activeCall.connectionStatus = 'connecting';
        }

        // Notify caller that call was accepted
        io.to(`user_${call.callerId}`).emit('call_accepted', {
          callId,
          receiverId: userId,
          receiverName: socket.handshake.auth.username || 'Unknown',
          timestamp: new Date(),
        });

        // Notify receiver that they accepted
        socket.emit('call_accepted_confirmed', {
          callId,
          callerId: call.callerId,
          callerName: call.callerId.username,
        });

        // Start WebRTC negotiation
        io.to(`user_${call.callerId}`).emit('start_webrtc_negotiation', {
          callId,
          receiverId: userId,
        });
      } catch (error) {
        console.error('Error accepting call:', error);
        socket.emit('call_error', { message: 'Failed to accept call' });
      }
    });

    // ==================== CALL REJECTION ====================
    socket.on('decline_call', async (data) => {
      try {
        const { callId, reason = 'Declined' } = data;

        // Update call status
        await CallService.declineCall(callId, reason);

        const activeCall = activeCalls.get(callId);
        if (activeCall) {
          // Notify caller
          io.to(`user_${activeCall.callerId}`).emit('call_declined', {
            callId,
            reason,
            timestamp: new Date(),
          });

          activeCalls.delete(callId);
        }

        socket.emit('call_declined_confirmed', { callId });
      } catch (error) {
        console.error('Error declining call:', error);
        socket.emit('call_error', { message: 'Failed to decline call' });
      }
    });

    // ==================== CALL TERMINATION ====================
    socket.on('end_call', async (data) => {
      try {
        const { callId } = data;

        // Update call status
        const call = await CallService.endCall(callId);

        const activeCall = activeCalls.get(callId);
        if (activeCall) {
          // Notify other party
          const otherUserId = activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId;
          io.to(`user_${otherUserId}`).emit('call_ended', {
            callId,
            endedBy: userId,
            duration: call.duration,
            timestamp: new Date(),
          });

          activeCalls.delete(callId);
        }

        socket.emit('call_ended_confirmed', { callId });
      } catch (error) {
        console.error('Error ending call:', error);
        socket.emit('call_error', { message: 'Failed to end call' });
      }
    });

    // ==================== CALL MISSED ====================
    socket.on('call_missed', async (data) => {
      try {
        const { callId } = data;

        // Update call status
        const call = await CallService.markCallAsMissed(callId);

        // Create missed call notification
        await CallService.createMissedCallNotification(userId, call.callerId, callId);

        const activeCall = activeCalls.get(callId);
        if (activeCall) {
          activeCalls.delete(callId);
        }
      } catch (error) {
        console.error('Error marking call as missed:', error);
      }
    });

    // ==================== CONNECTION STATUS ====================
    socket.on('connection_status', (data) => {
      const { callId, status } = data;
      // 'connecting', 'connected', 'disconnected', 'failed'

      const activeCall = activeCalls.get(callId);
      if (activeCall) {
        activeCall.connectionStatus = status;

        if (status === 'connected') {
          activeCall.connectedAt = new Date();
        }

        // Notify other party of connection status
        const otherUserId = activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId;
        io.to(`user_${otherUserId}`).emit('peer_connection_status', {
          callId,
          status,
          timestamp: new Date(),
        });
      }
    });

    // ==================== WEBRTC SIGNALING ====================
    socket.on('webrtc_offer', (data) => {
      const { callId, offer } = data;
      const activeCall = activeCalls.get(callId);

      if (activeCall) {
        const recipientId = activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId;
        io.to(`user_${recipientId}`).emit('webrtc_offer', {
          callId,
          offer,
          fromUserId: userId,
          timestamp: new Date(),
        });
      }
    });

    socket.on('webrtc_answer', (data) => {
      const { callId, answer } = data;
      const activeCall = activeCalls.get(callId);

      if (activeCall) {
        const recipientId = activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId;
        io.to(`user_${recipientId}`).emit('webrtc_answer', {
          callId,
          answer,
          fromUserId: userId,
          timestamp: new Date(),
        });
      }
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const { callId, candidate } = data;
      const activeCall = activeCalls.get(callId);

      if (activeCall) {
        const recipientId = activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId;
        io.to(`user_${recipientId}`).emit('webrtc_ice_candidate', {
          callId,
          candidate,
          fromUserId: userId,
        });
      }
    });

    // ==================== MEDIA CONTROLS ====================
    socket.on('toggle_mute', (data) => {
      const { callId, isMuted } = data;
      const activeCall = activeCalls.get(callId);

      if (activeCall) {
        const otherUserId = activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId;
        io.to(`user_${otherUserId}`).emit('user_mute_status', {
          callId,
          userId,
          isMuted,
          timestamp: new Date(),
        });
      }
    });

    socket.on('toggle_camera', (data) => {
      const { callId, isCameraOn } = data;
      const activeCall = activeCalls.get(callId);

      if (activeCall) {
        const otherUserId = activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId;
        io.to(`user_${otherUserId}`).emit('user_camera_status', {
          callId,
          userId,
          isCameraOn,
          timestamp: new Date(),
        });
      }
    });

    // ==================== DISCONNECTION HANDLING ====================
    socket.on('disconnect', () => {
      // Remove socket from user's socket list
      if (userId && userSockets.has(userId)) {
        const sockets = userSockets.get(userId);
        const index = sockets.indexOf(socket.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          userSockets.delete(userId);
        }
      }

      // Clean up active calls for this socket
      for (const [callId, callData] of activeCalls.entries()) {
        if (callData.callerSocket === socket.id || callData.receiverSocket === socket.id) {
          // Notify other party of disconnect
          const otherUserId = callData.callerSocket === socket.id ? callData.receiverId : callData.callerId;
          io.to(`user_${otherUserId}`).emit('peer_disconnected', {
            callId,
            timestamp: new Date(),
          });

          activeCalls.delete(callId);
        }
      }
    });
  });
};

export default setupCallSockets;
