// Chat Controller
import ChatService from '../services/chatService.js';
import cloudinaryBackendService from '../services/cloudinaryService.js';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, files: 10 }, // 100MB per file, max 10 files
});

export const chatController = {
  // Get conversations
  getConversations: async (req, res, next) => {
    try {
      const { limit = 20 } = req.query;
      const conversations = await ChatService.getConversations(req.user.id, parseInt(limit));
      res.json({ conversations });
    } catch (error) {
      next(error);
    }
  },

  // Get or create conversation
  getOrCreateConversation: async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const conversation = await ChatService.getOrCreateConversation(req.user.id, userId);
      res.json({ conversation });
    } catch (error) {
      next(error);
    }
  },

  // Get messages
  getMessages: async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      const messages = await ChatService.getMessages(
        conversationId,
        parseInt(limit),
        parseInt(skip)
      );

      res.json({ messages });
    } catch (error) {
      next(error);
    }
  },

  // Send message
  sendMessage: async (req, res, next) => {
    try {
      const { conversationId, content, messageType = 'text', replyTo } = req.body;

      if (!conversationId || !content) {
        return res.status(400).json({ error: 'Conversation ID and content required' });
      }

      const message = await ChatService.sendMessage(
        conversationId,
        req.user.id,
        content,
        messageType
      );

      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  },

  // Edit message
  editMessage: async (req, res, next) => {
    try {
      const { messageId, content } = req.body;

      if (!messageId || !content) {
        return res.status(400).json({ error: 'Message ID and content required' });
      }

      const message = await ChatService.editMessage(messageId, req.user.id, content);
      res.json({ message });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete message
  deleteMessage: async (req, res, next) => {
    try {
      const { messageId, deleteForEveryone = false } = req.body;

      if (!messageId) {
        return res.status(400).json({ error: 'Message ID required' });
      }

      const message = await ChatService.deleteMessage(messageId, req.user.id, deleteForEveryone);
      res.json({ message });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Add reaction
  addReaction: async (req, res, next) => {
    try {
      const { messageId, emoji } = req.body;

      if (!messageId || !emoji) {
        return res.status(400).json({ error: 'Message ID and emoji required' });
      }

      const message = await ChatService.addReaction(messageId, req.user.id, emoji);
      res.json({ message });
    } catch (error) {
      next(error);
    }
  },

  // Mark as seen
  markMessagesSeen: async (req, res, next) => {
    try {
      const { conversationId } = req.body;

      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID required' });
      }

      await ChatService.markMessagesSeen(conversationId, req.user.id);
      res.json({ message: 'Messages marked as seen' });
    } catch (error) {
      next(error);
    }
  },

  // Upload media
  uploadMedia: [
    upload.array('files', 10),
    async (req, res, next) => {
      try {
        const { conversationId } = req.body;

        if (!conversationId || !req.files || req.files.length === 0) {
          return res.status(400).json({ error: 'Conversation ID and files required' });
        }

        const media = await ChatService.uploadMedia(conversationId, req.user.id, req.files);
        res.json({ media });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Upload to Cloudinary (secure route)
  cloudinaryUpload: [
    upload.single('file'),
    async (req, res, next) => {
      try {
        const { conversationId } = req.body;

        if (!conversationId || !req.file) {
          return res.status(400).json({ error: 'Conversation ID and file required' });
        }

        // Validate file size
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (req.file.size > maxSize) {
          return res.status(400).json({ error: 'File size exceeds 100MB limit' });
        }

        // Upload to Cloudinary
        const result = await cloudinaryBackendService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          conversationId
        );

        // Get metadata
        const metadata = await cloudinaryBackendService.getMetadata(result.public_id);

        // Return upload result
        res.json({
          url: result.secure_url,
          publicId: result.public_id,
          type: result.resource_type,
          name: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          width: metadata?.width,
          height: metadata?.height,
          duration: metadata?.duration,
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  // Delete from Cloudinary
  cloudinaryDelete: async (req, res, next) => {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json({ error: 'Public ID required' });
      }

      await cloudinaryBackendService.deleteFile(publicId);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

export default chatController;
