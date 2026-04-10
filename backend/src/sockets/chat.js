// Chat Socket handlers
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import NotificationService from '../services/notificationService.js';

const setupChatSockets = (io) => {
  io.on('connection', (socket) => {
    // Join conversation room
    socket.on('join_conversation', (conversationId, userId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId, userId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Send message (real-time)
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, content, messageType = 'text' } = data;

        const message = new Message({
          conversationId,
          senderId,
          content,
          messageType,
          status: 'sent',
        });

        await message.save();
        await message.populate('senderId', 'username profilePicture');

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        // Broadcast to all users in conversation
        io.to(`conversation_${conversationId}`).emit('new_message', message.toObject());

        // Send notification to participants
        const conversation = await Conversation.findById(conversationId);
        const otherParticipants = conversation.participants.filter(
          p => p.toString() !== senderId
        );

        for (const participantId of otherParticipants) {
          // Create notification using service
          const notification = await NotificationService.createMessageNotification(
            participantId,
            senderId,
            message._id,
            conversationId
          );

          // Emit notification event to user's room
          io.to(`user_${participantId}`).emit('notification', {
            type: 'new_notification',
            data: notification,
            badge: {
              type: 'message',
              count: 1, // Client will aggregate
            },
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Typing indicator
    socket.on('user_typing', (conversationId, userId, username) => {
      io.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        username,
      });
    });

    // Stop typing
    socket.on('user_stop_typing', (conversationId, userId) => {
      io.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        userId,
      });
    });

    // Message delivered
    socket.on('message_delivered', (messageId) => {
      io.emit('message_status_update', {
        messageId,
        status: 'delivered',
      });
    });

    // Message seen
    socket.on('message_seen', async (conversationId, userId) => {
      io.to(`conversation_${conversationId}`).emit('message_seen', { userId });
    });

    // Edit message (real-time)
    socket.on('edit_message', (data) => {
      const { messageId, content, conversationId } = data;
      io.to(`conversation_${conversationId}`).emit('message_edited', {
        messageId,
        content,
      });
    });

    // Delete message (real-time)
    socket.on('delete_message', (data) => {
      const { messageId, conversationId, deleteForEveryone } = data;
      io.to(`conversation_${conversationId}`).emit('message_deleted', {
        messageId,
        deleteForEveryone,
      });
    });

    // Add reaction (real-time)
    socket.on('add_reaction', (data) => {
      const { messageId, emoji, userId, conversationId } = data;
      io.to(`conversation_${conversationId}`).emit('reaction_added', {
        messageId,
        emoji,
        userId,
      });
    });
  });
};

export default setupChatSockets;
