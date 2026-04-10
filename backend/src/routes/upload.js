// Upload routes
import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { uploadSingle, uploadMultiple } from '../middlewares/uploadMiddleware.js';
import uploadController from '../controllers/uploadController.js';

const router = express.Router();

/**
 * Upload profile picture
 * PUT /api/upload/profile-picture
 * Body: form-data with 'file' field containing image
 */
router.put(
  '/profile-picture',
  verifyToken,
  uploadSingle('file'),
  uploadController.uploadProfilePicture
);

/**
 * Upload group/conversation avatar
 * PUT /api/upload/avatar/:conversationId
 * Body: form-data with 'file' field containing image
 */
router.put(
  '/avatar/:conversationId',
  verifyToken,
  uploadSingle('file'),
  uploadController.uploadConversationAvatar
);

/**
 * Upload media files (images/videos for chat messages)
 * POST /api/upload/media
 * Body: form-data with 'files' field (multiple files)
 * Max 10 files per request
 */
router.post(
  '/media',
  verifyToken,
  uploadMultiple('files', 10),
  uploadController.uploadMedia
);

/**
 * Delete uploaded file
 * DELETE /api/upload/:publicId
 * Requires: Authentication
 */
router.delete(
  '/:publicId',
  verifyToken,
  uploadController.deleteUploadedFile
);

export default router;
