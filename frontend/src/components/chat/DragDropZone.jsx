// Drag and Drop Zone Component
import { useState } from 'react';
import { motion } from 'framer-motion';

export const DragDropZone = ({ onFilesSelected, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        borderColor: isDragging ? '#3b82f6' : '#e5e7eb',
        backgroundColor: isDragging ? '#eff6ff' : 'transparent',
      }}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
        isDragging ? 'dark:bg-dark-700/50 dark:border-blue-500' : 'dark:border-dark-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <svg
        className="w-12 h-12 mx-auto mb-2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="text-gray-600 dark:text-gray-300 font-medium">
        Drop media here to upload
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        or click the attachment button
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Images, videos (max 100MB)
      </p>
    </motion.div>
  );
};

export default DragDropZone;
