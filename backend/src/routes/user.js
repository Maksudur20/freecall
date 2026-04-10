// User routes
import express from 'express';
import userController from '../controllers/userController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Profile routes
router.get('/profile/:userId', userController.getProfile);
router.get('/profile', userController.getProfile); // Current user's profile
router.put('/profile', userController.updateProfile);
router.post('/profile/picture', userController.uploadProfilePicture);
router.delete('/account', userController.deleteAccount);

// Search & friends
router.get('/search', userController.searchUsers);
router.get('/friends', userController.getFriends);
router.get('/suggestions', userController.getFriendSuggestions);

// Block/unblock
router.post('/block', userController.blockUser);
router.post('/unblock', userController.unblockUser);

export default router;
