// Upload controller - Handle file upload requests
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  validateFile,
} from '../services/uploadService.js';

/**
 * Upload profile picture
 * PUT /api/upload/profile-picture
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file
    const validation = validateFile(req.file, 'profilePicture');
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Delete old profile picture if exists
    const user = await User.findById(req.user.userId);
    if (user?.profilePicturePublicId) {
      try {
        await deleteFromCloudinary(user.profilePicturePublicId, 'image');
      } catch (error) {
        console.warn('Failed to delete old profile picture:', error.message);
      }
    }

    // Upload new profile picture
    const uploadResult = await uploadToCloudinary(req.file, 'profilePicture');

    // Update user's profile picture in database
    user.profilePicture = uploadResult.url;
    user.profilePicturePublicId = uploadResult.publicId;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      },
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile picture' });
  }
};

/**
 * Upload group/conversation avatar
 * PUT /api/upload/avatar/:conversationId
 */
export const uploadConversationAvatar = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;

    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file
    const validation = validateFile(req.file, 'avatar');
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Verify conversation exists and user has access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is admin/owner
    if (conversation.admin?.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only admin can change group avatar' });
    }

    // Delete old avatar if exists
    if (conversation.groupAvatarPublicId) {
      try {
        await deleteFromCloudinary(conversation.groupAvatarPublicId, 'image');
      } catch (error) {
        console.warn('Failed to delete old avatar:', error.message);
      }
    }

    // Upload new avatar
    const uploadResult = await uploadToCloudinary(req.file, 'avatar');

    // Update conversation
    conversation.groupAvatar = uploadResult.url;
    conversation.groupAvatarPublicId = uploadResult.publicId;
    await conversation.save();

    res.json({
      success: true,
      message: 'Group avatar uploaded successfully',
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar' });
  }
};

/**
 * Upload media files (images/videos for chat messages)
 * POST /api/upload/media
 */
export const uploadMedia = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if files are provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Limit number of files
    if (req.files.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 files per upload' });
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Determine file type (image or video)
      const isVideo = file.mimetype.startsWith('video');
      const uploadType = isVideo ? 'video' : 'image';

      // Validate file
      const validation = validateFile(file, uploadType);
      if (!validation.isValid) {
        errors.push({
          filename: file.originalname,
          error: validation.error,
        });
        continue;
      }

      try {
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(file, uploadType);
        uploadedFiles.push({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          type: isVideo ? 'video' : 'image',
          size: uploadResult.size,
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
        });
      } catch (uploadError) {
        errors.push({
          filename: file.originalname,
          error: uploadError.message,
        });
      }
    }

    // Return results
    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        error: 'No files were successfully uploaded',
        details: errors,
      });
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload media' });
  }
};

/**
 * Delete uploaded file
 * DELETE /api/upload/:publicId
 */
export const deleteUploadedFile = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { publicId } = req.params;

    // Determine resource type (simple check - improve if needed)
    const resourceType = publicId.includes('videos') ? 'video' : 'image';

    // Delete from Cloudinary
    const result = await deleteFromCloudinary(publicId, resourceType);

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
};

export default {
  uploadProfilePicture,
  uploadConversationAvatar,
  uploadMedia,
  deleteUploadedFile,
};
