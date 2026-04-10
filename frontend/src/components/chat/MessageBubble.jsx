// Message Bubble Component
import { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const MessageBubble = memo(({ message, isOwn, onReply, onDelete, onEdit, onReact }) => {
  const [showActions, setShowActions] = useState(false);
  
  // Memoize formatted time to avoid recalculation on every render
  const formattedTime = useMemo(
    () => format(new Date(message.createdAt), 'HH:mm'),
    [message.createdAt]
  );

  // Memoize callbacks to prevent re-creation on every render
  const handleReply = useCallback(() => onReply(message), [message, onReply]);
  const handleEdit = useCallback(() => onEdit(message), [message, onEdit]);
  const handleDelete = useCallback(() => onDelete(message._id), [message._id, onDelete]);
  const handleReact = useCallback(
    (emoji) => onReact(message._id, emoji),
    [message._id, onReact]
  );

  // Memoize reactions to prevent re-ordering
  const reactions = useMemo(() => message.reactions || [], [message.reactions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
    >
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl break-words transition-all ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-dark-700 text-gray-900 dark:text-white rounded-bl-none'
        } ${showActions ? 'shadow-lg' : 'shadow-sm'}`}
      >
        {message.replyTo && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="mb-2 pb-2 border-b border-opacity-50 border-current"
          >
            <p className="text-xs opacity-75">
              Replying to: {message.replyTo.content?.substring(0, 30)}...
            </p>
          </motion.div>
        )}

        {message.messageType === 'image' && message.media?.[0] && (
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={message.media[0].url}
            alt="Message"
            className="rounded-lg mb-2 max-w-xs cursor-pointer hover:shadow-md transition"
          />
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="text-sm"
        >
          {message.content}
        </motion.p>

        {message.reactions?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="flex gap-1 mt-2 flex-wrap"
          >
            {reactions.map((reaction, idx) => (
              <motion.button
                key={reaction.emoji}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReact(reaction.emoji)}
                className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full hover:bg-opacity-30 transition"
              >
                {reaction.emoji} {reaction.users.length}
              </motion.button>
            ))}
          </motion.div>
        )}

        <div className="flex items-center justify-between mt-1 gap-2">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-xs opacity-75"
          >
            {formattedTime}
          </motion.span>
          {isOwn && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-xs opacity-75"
            >
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'seen' && '✓✓'}
            </motion.span>
          )}
        </div>

        {isOwn && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={showActions ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2 mt-2 pt-2 border-t border-opacity-50 border-current"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReply}
              className="text-xs hover:opacity-75 transition"
              title="Reply"
            >
              ↵ Reply
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEdit}
              className="text-xs hover:opacity-75 transition"
              title="Edit"
            >
              ✎ Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="text-xs hover:opacity-75 transition"
              title="Delete"
            >
              ✕ Delete
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - return true if props are equal (don't re-render)
  return (
    prevProps.message._id === nextProps.message._id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.reactions?.length === nextProps.message.reactions?.length &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.onReply === nextProps.onReply &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onReact === nextProps.onReact
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
