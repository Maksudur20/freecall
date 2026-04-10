// Message Input Component
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from '@utils/performance';
import EmojiPicker from 'emoji-picker-react';
import { RippleButton } from '../animations';
import MediaPreview from './MediaPreview';
import DragDropZone from './DragDropZone';
import cloudinaryService from '../../services/cloudinaryService';
import { v4 as uuidv4 } from 'uuid';

const MessageInput = memo(({ onSendMessage, onTyping, disabled = false, replyingTo = null, onCancelReply = null, conversationId = null }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showDragDrop, setShowDragDrop] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const debouncedTypingRef = useRef(null);

  // Initialize debounced typing indicator
  useEffect(() => {
    debouncedTypingRef.current = debounce(() => {
      onTyping?.();
    }, 300);

    return () => {
      if (debouncedTypingRef.current) {
        debouncedTypingRef.current = null;
      }
    };
  }, [onTyping]);

  // Handle typing indicator with debounce
  useEffect(() => {
    if (message && !isComposing) {
      debouncedTypingRef.current?.();
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        // Call stop typing
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isComposing]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const createPreview = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(async (files) => {
    const newMedia = [];

    for (const file of files) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        console.warn(`Unsupported file type: ${file.type}`);
        continue;
      }

      // Create preview
      const preview = await createPreview(file);

      newMedia.push({
        id: uuidv4(),
        file,
        name: file.name,
        type: isImage ? 'image' : 'video',
        size: file.size,
        preview,
        progress: 0,
        uploading: false,
        url: null,
        publicId: null,
      });
    }

    setMediaFiles(prev => [...prev, ...newMedia]);
  }, [createPreview]);

  const handleRemoveMedia = useCallback((fileId) => {
    setMediaFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const removed = prev.find(f => f.id === fileId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  }, []);

  const uploadMedia = useCallback(async () => {
    if (mediaFiles.length === 0) return;

    setUploading(true);
    const uploadedMedia = [];

    try {
      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];

        // Update uploading state
        setMediaFiles(prev =>
          prev.map((f, idx) =>
            idx === i ? { ...f, uploading: true } : f
          )
        );

        try {
          const result = await cloudinaryService.uploadToCloudinary(
            mediaFile.file,
            {
              conversationId,
              onProgress: (percent) => {
                setMediaFiles(prev =>
                  prev.map((f, idx) =>
                    idx === i ? { ...f, progress: percent } : f
                  )
                );
              },
            }
          );

          uploadedMedia.push({
            type: 'media',
            content: result.url,
            mediaType: result.type,
            fileName: result.name,
            fileSize: result.size,
            publicId: result.publicId,
            dimensions: {
              width: result.width,
              height: result.height,
              duration: result.duration,
            },
          });

          // Update file with URL
          setMediaFiles(prev =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    uploading: false,
                    progress: 100,
                    url: result.url,
                    publicId: result.publicId,
                  }
                : f
            )
          );
        } catch (error) {
          console.error(`Failed to upload ${mediaFile.name}:`, error);
          setMediaFiles(prev =>
            prev.map((f, idx) =>
              idx === i ? { ...f, uploading: false, error: error.message } : f
            )
          );
        }
      }

      // Send message with media
      if (uploadedMedia.length > 0) {
        const mediaContent = uploadedMedia
          .map(m => `[${m.mediaType.toUpperCase()}] ${m.content}`)
          .join('\n');
        
        const fullMessage = message.trim()
          ? `${message}\n\n${mediaContent}`
          : mediaContent;

        onSendMessage(fullMessage, replyingTo?._id, uploadedMedia);
        
        // Clear media and message
        setMediaFiles([]);
        setMessage('');
      }
    } finally {
      setUploading(false);
    }
  }, [mediaFiles, message, replyingTo, onSendMessage, conversationId]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();

    // If media files exist, upload them first
    if (mediaFiles.length > 0) {
      uploadMedia();
      return;
    }

    if (message.trim()) {
      onSendMessage(message, replyingTo?._id);
      setMessage('');
      setShowEmojiPicker(false);
      onCancelReply?.();
    }
  }, [message, replyingTo, onSendMessage, onCancelReply, mediaFiles, uploadMedia]);

  const handleEmojiSelect = useCallback((emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  const canSend = message.trim() || mediaFiles.length > 0;

  return (
    <div className="border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4">
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-3 p-2 bg-gray-100 dark:bg-dark-700 rounded border-l-4 border-blue-500 flex justify-between items-start"
          >
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                Replying to message
              </p>
              <p className="text-sm text-gray-800 dark:text-white">
                {replyingTo.content?.substring(0, 50)}...
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCancelReply}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview */}
      <MediaPreview
        files={mediaFiles}
        onRemove={handleRemoveMedia}
        uploading={uploading}
      />

      {/* Drag and Drop Zone */}
      <AnimatePresence>
        {showDragDrop && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-3"
          >
            <DragDropZone
              onFilesSelected={(files) => {
                handleFileSelect(files);
                setShowDragDrop(false);
              }}
              disabled={uploading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSendMessage} className="flex items-end gap-3">
        {/* Emoji picker button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition text-xl"
          title="Emoji"
          disabled={disabled || uploading}
        >
          😊
        </motion.button>

        {/* File upload button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => {
            if (showDragDrop) {
              setShowDragDrop(false);
            } else if (!uploading) {
              fileInputRef.current?.click();
            }
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition relative"
          title="Attach media"
          disabled={disabled || uploading}
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.485 8.485l-6.414-6.414"
            />
          </svg>
          {mediaFiles.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {mediaFiles.length}
            </span>
          )}
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(Array.from(e.target.files))}
          className="hidden"
          accept="image/*,video/*"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <motion.textarea
            initial={{ borderColor: 'transparent' }}
            whileFocus={{ borderColor: '#3b82f6' }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Type a message..."
            disabled={disabled || uploading}
            rows="1"
            className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-2xl border border-transparent focus:border-blue-500 focus:outline-none resize-none max-h-32 transition disabled:opacity-50"
          />

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-16 left-0 z-50"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  theme="dark"
                  height={400}
                  width={320}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Send button with ripple effect */}
        <RippleButton
          type="submit"
          disabled={disabled || !canSend || uploading}
          onClick={handleSendMessage}
          className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition relative"
          title={uploading ? 'Uploading...' : 'Send message'}
        >
          {uploading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5"
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </motion.div>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9-9m-9 9l-9-9m9 9V5"
              />
            </svg>
          )}
        </RippleButton>
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
