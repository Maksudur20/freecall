// Socket.io handlers setup
import setupChatSockets from './chat.js';
import setupPresenceSockets from './presence.js';
import setupCallSockets from './call.js';
import setupNotificationSockets from './notifications.js';
import { addOnlineUser, removeOnlineUser, getOnlineUsers } from '../services/cache.js';

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.id}`);

    // Store user ID in socket data
    socket.on('authenticate', async (userId) => {
      socket.userId = userId;
      socket.join(`user_${userId}`);
      
      // Add user to online users cache
      await addOnlineUser(userId, socket.id);
      
      // Get and broadcast updated online users list
      const onlineUsers = await getOnlineUsers();
      io.emit('users:online', onlineUsers);
      
      console.log(`✓ User ${userId} authenticated and joined room`);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      if (socket.userId) {
        // Remove user from online users cache
        await removeOnlineUser(socket.userId);
        
        // Get and broadcast updated online users list
        const onlineUsers = await getOnlineUsers();
        io.emit('users:online', onlineUsers);
        
        console.log(`✗ User ${socket.userId} disconnected`);
      } else {
        console.log(`✗ Socket ${socket.id} disconnected`);
      }
    });

    // Get online users
    socket.on('online:users:get', async () => {
      try {
        const onlineUsers = await getOnlineUsers();
        socket.emit('users:online', onlineUsers);
      } catch (error) {
        console.error('Error getting online users:', error.message);
      }
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
