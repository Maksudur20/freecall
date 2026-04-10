// Authentication Controller
import { body } from 'express-validator';
import AuthService from '../services/authService.js';
import User from '../models/User.js';

export const authController = {
  // Register
  register: [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    async (req, res, next) => {
      try {
        const { username, email, password } = req.body;
        
        const user = await AuthService.registerUser({ username, email, password });
        const accessToken = AuthService.generateAccessToken(user._id);
        const refreshToken = AuthService.generateRefreshToken(user._id);

        res.status(201).json({
          message: 'User registered successfully',
          user: user.toJSON(),
          accessToken,
          refreshToken,
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Login
  login: [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    async (req, res, next) => {
      try {
        const { email, password } = req.body;
        
        const result = await AuthService.loginUser(email, password);

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({
          message: 'Logged in successfully',
          user: result.user,
          accessToken: result.accessToken,
        });
      } catch (error) {
        res.status(401).json({ error: error.message });
      }
    },
  ],

  // Refresh Token
  refreshToken: async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token' });
      }

      const decoded = AuthService.verifyToken(refreshToken, true);
      const result = await AuthService.refreshAccessToken(decoded.id);

      res.json({
        message: 'Token refreshed',
        accessToken: result.accessToken,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  // Logout
  logout: (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  },

  // Get current user
  getCurrentUser: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user: user.toJSON() });
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
