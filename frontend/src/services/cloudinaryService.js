// Cloudinary Service for handling media uploads
import { v4 as uuidv4 } from 'uuid';

// Configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const cloudinaryService = {
  /**
   * Compress image before upload
   * @param {File} file - Image file
   * @param {number} maxWidth - Max width in pixels
   * @param {number} maxHeight - Max height in pixels
   * @param {number} quality - Quality 0-1
   * @returns {Promise<Blob>}
   */
  async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate dimensions
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas compression failed'));
              } else {
                resolve(blob);
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => {
          reject(new Error('Image load failed'));
        };

        img.src = event.target.result;
      };

      reader.onerror = () => {
        reject(new Error('File read failed'));
      };

      reader.readAsDataURL(file);
    });
  },

  /**
   * Get file type and category
   */
  getFileType(file) {
    if (file.type.startsWith('image/')) {
      return { type: 'image', category: 'image' };
    }
    if (file.type.startsWith('video/')) {
      return { type: 'video', category: 'video' };
    }
    return { type: 'file', category: 'raw' };
  },

  /**
   * Upload media through secure backend route
   * @param {File} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result { url, type, name, size, publicId }
   */
  async uploadToCloudinary(file, options = {}) {
    const { onProgress = null, conversationId = null } = options;

    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Check file size (max 100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size exceeds 100MB limit`);
      }

      const fileType = this.getFileType(file);
      const fileBlob = file;

      // Compress image if needed
      let processedFile = fileBlob;
      if (fileType.type === 'image' && file.size > 2 * 1024 * 1024) {
        // Compress if larger than 2MB
        const compressedBlob = await this.compressImage(
          file,
          1920,
          1080,
          0.85
        );
        processedFile = compressedBlob;
      }

      // Upload through secure backend endpoint
      const formData = new FormData();
      formData.append('file', processedFile, file.name);
      formData.append('conversationId', conversationId);

      const response = await fetch(`${BACKEND_URL}/api/chat/cloudinary-upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      return {
        url: result.url,
        publicId: result.publicId,
        type: fileType.type,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  },

  /**
   * Upload multiple files
   * @param {File[]} files - Files to upload
   * @param {Object} options - Options
   * @returns {Promise<Object[]>}
   */
  async uploadMultiple(files, options = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadToCloudinary(files[i], {
          ...options,
          onProgress: (percent) => {
            options.onProgress?.({
              index: i,
              total: files.length,
              percent,
              fileName: files[i].name,
            });
          },
        });
        results.push(result);
      } catch (error) {
        errors.push({
          file: files[i].name,
          error: error.message,
        });
      }
    }

    if (errors.length > 0) {
      console.warn('Some files failed to upload:', errors);
    }

    return {
      successful: results,
      failed: errors,
      hasErrors: errors.length > 0,
    };
  },

  /**
   * Generate preview URL for image/video
   * @param {string} publicId - Cloudinary public ID
   * @param {string} type - 'image' or 'video'
   * @param {number} width - Thumbnail width
   * @param {number} height - Thumbnail height
   */
  getPreviewUrl(publicId, type = 'image', width = 300, height = 300) {
    if (type === 'image') {
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
    }
    if (type === 'video') {
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/w_${width},h_${height},c_fill,so_0/${publicId}.jpg`;
    }
    return null;
  },

  /**
   * Delete media from Cloudinary
   * @param {string} publicId - Public ID to delete
   */
  async deleteMedia(publicId) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/chat/cloudinary-delete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  /**
   * Get Cloudinary URL with transformations
   */
  getOptimizedUrl(publicId, type = 'image', options = {}) {
    const {
      width = 800,
      height = 600,
      quality = 'auto',
      format = 'auto',
      crop = 'fill',
    } = options;

    if (type === 'image') {
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
    }

    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/w_${width},h_${height}/${publicId}`;
  },
};

export default cloudinaryService;
