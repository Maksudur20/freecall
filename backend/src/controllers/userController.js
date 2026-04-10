// User Controller
import UserService from '../services/userService.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/temp');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export const userController = {
  // Get profile
  getProfile: async (req, res, next) => {
    try {
      const userId = req.params.userId || req.user.id;
      const user = await UserService.getUserProfile(userId);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  updateProfile: async (req, res, next) => {
    try {
      const { firstName, lastName, bio, phoneNumber, status } = req.body;
      
      const user = await UserService.updateUserProfile(req.user.id, {
        firstName,
        lastName,
        bio,
        phoneNumber,
        status,
      });

      res.json({
        message: 'Profile updated successfully',
        user: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  },

  // Upload profile picture
  uploadProfilePicture: [
    upload.single('profilePicture'),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file provided' });
        }

        const user = await UserService.uploadProfilePicture(req.user.id, req.file.path);
        res.json({
          message: 'Profile picture updated',
          user: user.toJSON(),
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Delete account
  deleteAccount: async (req, res, next) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: 'Password required' });
      }

      const result = await UserService.deleteAccount(req.user.id, password);
      res.clearCookie('refreshToken');
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  // Search users
  searchUsers: async (req, res, next) => {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters' });
      }

      const users = await UserService.searchUsers(q, req.user.id, parseInt(limit));
      res.json({ users });
    } catch (error) {
      next(error);
    }
  },

  // Get friends list
  getFriends: async (req, res, next) => {
    try {
      const friends = await UserService.getFriends(req.user.id);
      res.json({ friends });
    } catch (error) {
      next(error);
    }
  },

  // Get friend suggestions
  getFriendSuggestions: async (req, res, next) => {
    try {
      const { limit = 5 } = req.query;
      const suggestions = await UserService.getFriendSuggestions(req.user.id, parseInt(limit));
      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  },

  // Block user
  blockUser: async (req, res, next) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const user = await UserService.blockUser(req.user.id, userId);
      res.json({ message: 'User blocked', user: user.toJSON() });
    } catch (error) {
      next(error);
    }
  },

  // Unblock user
  unblockUser: async (req, res, next) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const user = await UserService.unblockUser(req.user.id, userId);
      res.json({ message: 'User unblocked', user: user.toJSON() });
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
