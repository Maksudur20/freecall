// Upload service - Handle file uploads to Cloudinary
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

/**
 * File upload configuration
 */
export const UPLOAD_CONFIG = {
  // Image configuration
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    folder: 'freecall/images',
  },
  // Video configuration
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
    extensions: ['.mp4', '.mov', '.webm'],
    folder: 'freecall/videos',
  },
  // Profile picture configuration
  profilePicture: {
    maxSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    folder: 'freecall/profiles',
  },
  // Group/Conversation avatar
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    folder: 'freecall/avatars',
  },
};

/**
 * Validate file before upload
 * @param {Object} file - Express multer file object
 * @param {String} type - Upload type (image, video, profilePicture, avatar)
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateFile = (file, type = 'image') => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  const config = UPLOAD_CONFIG[type];
  if (!config) {
    return { isValid: false, error: `Invalid upload type: ${type}` };
  }

  // Check file size
  if (file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File size exceeds ${maxMB}MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  // Check MIME type
  if (!config.mimeTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${config.extensions.join(', ')}`,
    };
  }

  return { isValid: true };
};

/**
 * Upload file to Cloudinary
 * @param {Object} file - Express multer file object (from req.file or req.files)
 * @param {String} type - Upload type (image, video, profilePicture, avatar)
 * @returns {Promise<Object>} - { url, publicId, size, type }
 * @throws {Error} - If upload fails
 */
export const uploadToCloudinary = async (file, type = 'image') => {
  return new Promise((resolve, reject) => {
    const config = UPLOAD_CONFIG[type];

    // Determine resource type
    const resourceType = type === 'video' ? 'video' : 'image';

    const uploadOptions = {
      folder: config.folder,
      resource_type: resourceType,
      quality: 'auto',
      fetch_format: 'auto',
    };

    // For videos, add additional optimizations
    if (type === 'video') {
      uploadOptions.video_sampling = 20; // Sample video for better performance
    }

    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            size: result.bytes,
            type: result.resource_type,
            width: result.width,
            height: result.height,
            duration: result.duration, // For videos
          });
        }
      }
    );

    // Stream file buffer to Cloudinary
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of Express multer file objects
 * @param {String} type - Upload type (image, video, profilePicture, avatar)
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, type = 'image') => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file, type));
  return Promise.all(uploadPromises);
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID of the file
 * @param {String} resourceType - Type of resource (image or video)
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
  }
};

/**
 * Get file info from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @param {String} resourceType - Type of resource (image or video)
 * @returns {Promise<Object>} - File metadata
 */
export const getFileInfo = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

/**
 * Optimize image URL for different use cases
 * @param {String} url - Original Cloudinary URL
 * @param {String} optimization - Type of optimization (thumbnail, medium, banner)
 * @returns {String} - Optimized URL
 */
export const optimizeImageUrl = (url, optimization = 'medium') => {
  const optimizations = {
    thumbnail: '/w_150,h_150,c_fill,q_auto,f_auto/',
    medium: '/w_500,h_500,c_fill,q_auto,f_auto/',
    banner: '/w_1200,h_400,c_fill,q_auto,f_auto/',
    avatar: '/w_200,h_200,c_fill,g_face,q_auto,f_auto/',
  };

  const transform = optimizations[optimization] || optimizations.medium;
  return url.replace('/upload/', `/upload${transform}`);
};
