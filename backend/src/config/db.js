// MongoDB connection configuration
import mongoose from 'mongoose';

/**
 * Connect to MongoDB using Mongoose
 * 
 * Priority order for URI:
 * 1. MONGODB_ATLAS_URI (for MongoDB Atlas)
 * 2. MONGODB_URI (for local MongoDB or fallback)
 * 
 * @returns {Promise<mongoose.Connection>} Mongoose connection instance
 * @throws {Error} If connection fails or URI is not provided
 */
const connectDB = async () => {
  try {
    // Determine which URI to use (Atlas or local)
    const uri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error(
        'MongoDB URI not provided. Set either MONGODB_ATLAS_URI or MONGODB_URI in .env file'
      );
    }

    // Connection options for best practices
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
      family: 4, // Use IPv4
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(uri, mongoOptions);

    // Log successful connection
    const dbName = connection.connection.db?.databaseName || 'unknown';
    const host = connection.connection.host || 'unknown';
    console.log(
      `✓ MongoDB connected successfully\n` +
      `  Database: ${dbName}\n` +
      `  Host: ${host}\n` +
      `  Environment: ${process.env.NODE_ENV || 'development'}`
    );

    // Enable query logging in development mode
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        console.log(`\n🔍 DB Query: ${collectionName}.${method}`);
        if (Object.keys(query).length > 0) {
          console.log('   Query:', JSON.stringify(query, null, 2));
        }
      });
    }

    // Set up connection event listeners
    setupConnectionEventListeners();

    return connection.connection;
  } catch (error) {
    console.error(
      '❌ MongoDB connection failed:\n' +
      `   Error: ${error.message}`
    );
    
    // Additional debugging info
    if (process.env.NODE_ENV === 'development') {
      const uri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
      console.error(`   URI format: ${uri?.substring(0, 50)}...`);
    }

    throw error;
  }
};

/**
 * Set up event listeners for Mongoose connection
 */
const setupConnectionEventListeners = () => {
  const connection = mongoose.connection;

  // Connection established
  connection.on('open', () => {
    console.log('📡 MongoDB connection: Open');
  });

  // Connection is connecting
  connection.on('connecting', () => {
    console.log('📡 MongoDB connection: Connecting...');
  });

  // Connection disconnected
  connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB connection: Disconnected');
  });

  // Connection reconnected
  connection.on('reconnected', () => {
    console.log('🔄 MongoDB connection: Reconnected');
  });

  // Connection error
  connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

  // Connection closed
  connection.on('close', () => {
    console.log('🔒 MongoDB connection: Closed');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    if (connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log('\n✓ MongoDB connection closed gracefully');
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
      }
    }
  });
};

export default connectDB;
