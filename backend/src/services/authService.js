// Authentication Service
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export class AuthService {
  // Generate Access Token
  static generateAccessToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  // Generate Refresh Token
  static generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d' }
    );
  }

  // Register new user
  static async registerUser(userData) {
    const { username, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      agreedToTerms: true,
      agreedToTermsAt: new Date(),
    });

    await user.save();
    return user;
  }

  // Login user
  static async loginUser(email, password) {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  static async refreshAccessToken(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = this.generateAccessToken(userId);
    return { accessToken };
  }

  // Verify token
  static verifyToken(token, isRefresh = false) {
    const secret = isRefresh 
      ? process.env.REFRESH_TOKEN_SECRET 
      : process.env.JWT_SECRET;

    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default AuthService;
