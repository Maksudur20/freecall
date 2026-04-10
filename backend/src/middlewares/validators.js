// Input Validation Schemas using express-validator
import { body, param, query } from 'express-validator';

// ==================== AUTH VALIDATION ====================
export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and numbers'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Invalid password format'),
];

// ==================== USER VALIDATION ====================
export const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be 500 characters or less'),
  
  body('status')
    .optional()
    .isIn(['online', 'away', 'idle', 'offline'])
    .withMessage('Invalid status value'),
];

export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and numbers'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const validateUserIdParam = [
  param('userId')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Invalid user ID format')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid user ID format'),
];

// ==================== MESSAGE & CHAT VALIDATION ====================
export const validateSendMessage = [
  body('conversationId')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Invalid conversation ID')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid conversation ID format'),
  
  body('text')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
  
  body('mediaUrls')
    .optional()
    .isArray()
    .withMessage('Media URLs must be an array')
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error('Cannot send more than 10 media files');
      }
      return true;
    }),
];

export const validateCreateConversation = [
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required')
    .custom((value) => {
      if (value.length > 100) {
        throw new Error('Cannot create conversation with more than 100 participants');
      }
      value.forEach(id => {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error('Invalid participant ID format');
        }
      });
      return true;
    }),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Conversation name must be 1-255 characters'),
];

export const validateConversationIdParam = [
  param('conversationId')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Invalid conversation ID')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid conversation ID format'),
];

export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// ==================== FRIEND VALIDATION ====================
export const validateSendFriendRequest = [
  body('recipientId')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Invalid recipient ID')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid recipient ID format')
    .custom((value, { req }) => {
      if (value === req.user?.id) {
        throw new Error('Cannot send friend request to yourself');
      }
      return true;
    }),
];

export const validateFriendRequestResponse = [
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage('Action must be accept or reject'),
];

export const validateFriendRequestIdParam = [
  param('requestId')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Invalid request ID')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid request ID format'),
];

// ==================== NOTIFICATION VALIDATION ====================
export const validateNotificationIdParam = [
  param('notificationId')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Invalid notification ID')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid notification ID format'),
];

// ==================== SEARCH VALIDATION ====================
export const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Search query must be 1-255 characters')
    .escape() // Escape HTML characters to prevent XSS
    .withMessage('Invalid characters in search query'),
  
  query('type')
    .optional()
    .isIn(['user', 'message', 'conversation'])
    .withMessage('Invalid search type'),
];

// ==================== CALL VALIDATION ====================
export const validateInitiateCall = [
  body('receiverId')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Invalid receiver ID')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid receiver ID format'),
  
  body('type')
    .isIn(['audio', 'video'])
    .withMessage('Call type must be audio or video'),
];

export const validateCallIdParam = [
  param('callId')
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage('Invalid call ID')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid call ID format'),
];

// ==================== FILE UPLOAD VALIDATION ====================
export const validateFileUpload = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
];

// Media file validation (for multer)
export const validateMediaFile = (file) => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
  ];

  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 50MB limit');
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }

  return true;
};

export default {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validatePasswordChange,
  validateUserIdParam,
  validateSendMessage,
  validateCreateConversation,
  validateConversationIdParam,
  validatePaginationQuery,
  validateSendFriendRequest,
  validateFriendRequestResponse,
  validateFriendRequestIdParam,
  validateNotificationIdParam,
  validateSearch,
  validateInitiateCall,
  validateCallIdParam,
  validateFileUpload,
  validateMediaFile,
};
