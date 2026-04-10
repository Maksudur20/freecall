// Socket.io handlers setup
import setupChatSockets from './chat.js';
import setupPresenceSockets from './presence.js';
import setupCallSockets from './call.js';
import setupNotificationSockets from './notifications.js';

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.id}`);

    // Store user ID in socket data
    socket.on('authenticate', (userId) => {
      socket.userId = userId;
      socket.join(`user_${userId}`);
      console.log(`✓ User ${userId} joined room`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`✗ User disconnected: ${socket.id}`);
    });
  });

  // Setup different socket handlers
  setupChatSockets(io);
  setupPresenceSockets(io);
  setupCallSockets(io);
  setupNotificationSockets(io);

  return io;
};

export default setupSocketHandlers;
