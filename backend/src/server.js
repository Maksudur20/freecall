// Backend entry point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import chatRoutes from './routes/chat.js';
import friendRoutes from './routes/friend.js';
import notificationRoutes from './routes/notification.js';
import uploadRoutes from './routes/upload.js';
import webrtcRoutes from './routes/webrtc.js';

// Import Socket.io handlers
import setupSocketHandlers from './sockets/index.js';

// Import middleware
import errorHandler from './middlewares/errorHandler.js';
import connectDB from './config/db.js';
import { initRedis, closeRedis, isRedisAvailable } from './config/redis.js';
import iceServerService from './services/iceServerService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Socket.io configuration with Redis adapter for scaling
let redisClient = null;
let redisPubClient = null;

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(url => url.trim()) || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
});

// ============ MIDDLEWARE ============
app.use(compression()); // Compress responses with gzip
app.use(helmet());

// CORS Configuration - allows frontend and local development
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssClean());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// ============ ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webrtc', webrtcRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ SOCKET.IO ============
setupSocketHandlers(io);

// ============ ERROR HANDLING ============
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============ SERVER STARTUP ============
const startServer = async () => {
  try {
    // Initialize ICE server configuration for WebRTC (STUN/TURN)
    await iceServerService.initialize();
    const iceServerDiag = iceServerService.getDiagnostics();
    console.log('🌐 ICE Server Configuration:', iceServerDiag);

    // Connect to MongoDB
    await connectDB();

    // Initialize Redis for caching and Socket.io scaling
    const redis = await initRedis();

    // Setup Socket.io Redis adapter for horizontal scaling
    if (redis && isRedisAvailable()) {
      try {
        // Create Redis clients for pub/sub
        redisClient = createClient({ url: process.env.REDIS_URL });
        redisPubClient = redisClient.duplicate();

        await Promise.all([redisClient.connect(), redisPubClient.connect()]);

        // Attach Redis adapter to Socket.io
        io.adapter(createAdapter(redisPubClient, redisClient));
        console.log('✅ Socket.io Redis adapter configured for scaling');
      } catch (error) {
        console.warn('⚠️  Could not setup Redis adapter:', error.message);
        console.log('ℹ️  Socket.io will work locally without Redis adapter');
      }
    } else {
      console.log('ℹ️  Running Socket.io without Redis adapter (single instance mode)');
    }

    // Start HTTP server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📡 WebSocket ready for connections`);
      console.log(`🌐 WebRTC ICE Servers: ${iceServerDiag.hasTurn ? '✓ STUN + TURN' : '⚠ STUN only'}`);
      console.log(`🔄 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Periodic TURN credential refresh (every 30 minutes)
    setInterval(async () => {
      try {
        await iceServerService.refreshIfNeeded();
      } catch (error) {
        console.error('[ICE Server] Error in refresh cycle:', error.message);
      }
    }, 30 * 60 * 1000);
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down gracefully...');
  
  // Close Redis connections
  if (redisClient) {
    await redisClient.disconnect();
  }
  if (redisPubClient) {
    await redisPubClient.disconnect();
  }
  
  // Close main Redis connection
  await closeRedis();
  
  httpServer.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

export { app, io };
