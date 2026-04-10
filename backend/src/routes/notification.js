// Notification routes
import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', notificationController.getNotifications);
router.post('/mark-read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.get('/unread-count', notificationController.getUnreadCount);
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
