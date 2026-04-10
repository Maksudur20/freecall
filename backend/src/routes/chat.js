// Chat routes
import express from 'express';
import chatController from '../controllers/chatController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Conversation routes
router.get('/conversations', chatController.getConversations);
router.get('/conversation/:userId', chatController.getOrCreateConversation);

// Message routes
router.get('/messages/:conversationId', chatController.getMessages);
router.post('/message/send', chatController.sendMessage);
router.put('/message/edit', chatController.editMessage);
router.delete('/message', chatController.deleteMessage);
router.post('/message/reaction', chatController.addReaction);
router.post('/messages/mark-seen', chatController.markMessagesSeen);

// Media upload routes
router.post('/upload', chatController.uploadMedia); // Legacy upload
router.post('/cloudinary-upload', chatController.cloudinaryUpload); // Cloudinary secure upload
router.post('/cloudinary-delete', chatController.cloudinaryDelete); // Cloudinary delete

export default router;
