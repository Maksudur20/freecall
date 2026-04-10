// Cloudinary Service - Backend
import cloudinary from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryBackendService = {
  /**
   * Upload file to Cloudinary
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original file name
   * @param {string} conversationId - Conversation ID for organization
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(fileBuffer, originalName, conversationId) {
    try {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: `freecall/conversations/${conversationId}`,
            public_id: `${Date.now()}_${originalName.split('.').slice(0, -1).join('.')}`,
            overwrite: false,
            unique_filename: true,
            tags: ['freecall', 'chat', conversationId],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        // Convert buffer to stream
        const bufferStream = Readable.from(fileBuffer);
        bufferStream.pipe(stream);
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  },

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Public ID
   */
  async deleteFile(publicId) {
    try {
      const result = await cloudinary.v2.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  },

  /**
   * Get file metadata
   * @param {string} publicId - Public ID
   */
  async getMetadata(publicId) {
    try {
      const result = await cloudinary.v2.api.resource(publicId);
      return {
        width: result.width,
        height: result.height,
        duration: result.duration,
        format: result.format,
        resourceType: result.resource_type,
      };
    } catch (error) {
      console.error('Cloudinary metadata error:', error);
      return null;
    }
  },

  /**
   * Batch delete files
   * @param {string[]} publicIds - List of public IDs
   */
  async deleteMultiple(publicIds) {
    try {
      const promises = publicIds.map((id) => this.deleteFile(id));
      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      console.error('Batch delete error:', error);
      throw error;
    }
  },
};

export default cloudinaryBackendService;
