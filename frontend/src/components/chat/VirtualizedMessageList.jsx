/**
 * Virtualized Message List Component
 * Renders only visible messages for better performance with long chats
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';

export const VirtualizedMessageList = ({
  messages = [],
  isOwn,
  onReply,
  onDelete,
  onEdit,
  onReact,
  containerRef,
  onScroll,
  isLoading = false,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 120; // Approximate height of each message
  const containerHeight = window.innerHeight - 200; // Approximate visible height
  const bufferSize = 3; // Number of items to render outside viewport

  // Calculate which messages should be visible
  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - bufferSize
    );
    const endIndex = Math.min(
      messages.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
    );

    return {
      startIndex,
      endIndex,
      visibleCount,
    };
  }, [scrollTop, messages.length, containerHeight]);

  // Get only visible messages
  const visibleMessages = useMemo(
    () => messages.slice(visibleRange.startIndex, visibleRange.endIndex),
    [messages, visibleRange]
  );

  // Calculate offset for items before visible range
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback(
    (e) => {
      const newScrollTop = e.target.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  const totalHeight = messages.length * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-dark-900"
      style={{ height: containerHeight }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gray-600 dark:text-gray-400"
          >
            Loading messages...
          </motion.div>
        </div>
      ) : messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center h-full"
        >
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No messages yet. Start the conversation!
            </p>
          </div>
        </motion.div>
      ) : (
        // Virtual scroll container
        <div style={{ height: totalHeight }}>
          {/* Spacer before visible items */}
          <div style={{ height: offsetY }} />

          {/* Visible messages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
          >
            {visibleMessages.map((message, idx) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={isOwn(message)}
                onReply={onReply}
                onDelete={onDelete}
                onEdit={onEdit}
                onReact={onReact}
              />
            ))}
          </motion.div>

          {/* Spacer after visible items */}
          <div
            style={{
              height: Math.max(0, totalHeight - offsetY - visibleMessages.length * itemHeight),
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VirtualizedMessageList;
