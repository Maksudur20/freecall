// Loading Screen Component
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const textVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-900 dark:to-dark-800">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="text-center"
      >
        {/* Spinner with dots */}
        <motion.div
          variants={itemVariants}
          className="w-16 h-16 mx-auto mb-6 relative"
        >
          <motion.div
            variants={spinnerVariants}
            animate="animate"
            className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-blue-300 border-r-blue-300"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 rounded-full border-4 border-transparent border-l-indigo-500 border-b-indigo-500"
          />
        </motion.div>

        {/* App name */}
        <motion.h1
          variants={itemVariants}
          className="text-2xl font-bold text-gray-800 dark:text-white mb-2"
        >
          FreeCall
        </motion.h1>

        {/* Loading text with animation */}
        <motion.p
          variants={itemVariants}
          animate="animate"
          className="text-gray-600 dark:text-gray-300"
        >
          <motion.span variants={textVariants} animate="animate">
            Loading...
          </motion.span>
        </motion.p>

        {/* Dots animation */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-1 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
