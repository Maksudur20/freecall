// Skeleton Loader Component
import { motion } from 'framer-motion';

const shimmer = {
  initial: { backgroundPosition: '200% 0' },
  animate: { backgroundPosition: '-200% 0' },
};

export const SkeletonLoader = ({ variant = 'message', count = 1 }) => {
  const variants = {
    message: (
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        transition={{ duration: 2, repeat: Infinity }}
        className="h-16 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded-lg mb-3"
        style={{ backgroundSize: '200% 100%' }}
      />
    ),
    conversation: (
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600"
          style={{ backgroundSize: '200% 100%' }}
        />
        <div className="flex-1 space-y-2">
          <div
            className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded"
            style={{ backgroundSize: '200% 100%', width: '60%' }}
          />
          <div
            className="h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded"
            style={{ backgroundSize: '200% 100%', width: '40%' }}
          />
        </div>
      </motion.div>
    ),
    user: (
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        transition={{ duration: 2, repeat: Infinity }}
        className="flex flex-col items-center gap-3 p-4"
      >
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600"
          style={{ backgroundSize: '200% 100%' }}
        />
        <div className="w-32 h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded"
          style={{ backgroundSize: '200% 100%' }}
        />
      </motion.div>
    ),
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {variants[variant] || variants.message}
        </motion.div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
