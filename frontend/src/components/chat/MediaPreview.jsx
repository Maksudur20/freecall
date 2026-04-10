// Media Preview Component - Shows previews before sending
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const MediaPreview = ({ files, onRemove, uploading = false }) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 border-t border-gray-200 dark:border-dark-700 pt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          Media to Send ({files.length})
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        <AnimatePresence>
          {files.map((file, index) => (
            <motion.div
              key={file.id || index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative group"
            >
              {/* Media Preview */}
              <div className="relative w-full aspect-square bg-gray-200 dark:bg-dark-700 rounded-lg overflow-hidden">
                {file.type === 'image' ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : file.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      <path d="M6.5 12.5a1 1 0 100-2 1 1 0 000 2z" />
                      <path d="M10 12.5a1 1 0 100-2 1 1 0 000 2z" />
                      <path d="M13.5 12.5a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-dark-700">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Loading Overlay */}
                {uploading && file.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                      <span className="text-xs text-white font-semibold">
                        {file.progress || 0}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                {!uploading && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    onClick={() => onRemove(file.id || index)}
                    title="Remove"
                  >
                    ✕
                  </motion.button>
                )}
              </div>

              {/* File Name */}
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                {file.name}
              </p>

              {/* File Size */}
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MediaPreview;
