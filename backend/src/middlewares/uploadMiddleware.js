// Upload middleware - Handle file parsing with multer
import multer from 'multer';

// Configure multer to store files in memory (buffer)
const storage = multer.memoryStorage();

// Accept all file types, we'll validate in the service
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (largest allowed for videos)
  },
});

export default upload;

/**
 * Middleware to handle single file upload
 * @param {String} fieldName - Form field name for the file
 */
export const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

/**
 * Middleware to handle multiple file uploads
 * @param {String} fieldName - Form field name
 * @param {Number} maxFiles - Maximum number of files
 */
export const uploadMultiple = (fieldName = 'files', maxFiles = 10) => {
  return upload.array(fieldName, maxFiles);
};

/**
 * Middleware to handle both file and other fields
 */
export const uploadMixed = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 10 },
]);
