// Animation Configurations and Variants
export const animationVariants = {
  // Message animations
  messageEnter: {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  messageExit: {
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeIn' },
  },
  messageHover: {
    whileHover: { scale: 1.02 },
    transition: { duration: 0.2 },
  },

  // Button animations
  buttonScale: {
    whileHover: { scale: 1.08 },
    whileTap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  buttonBounce: {
    whileHover: { y: -2 },
    whileTap: { y: 0 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },

  // Container animations
  containerStagger: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },

  // Icon animations
  iconSpin: {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },
  iconBounce: {
    animate: { y: [0, -3, 0] },
    transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
  },

  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  fadeInScale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3 },
  },

  // Slide animations
  slideInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3 },
  },
  slideInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },

  // Tooltip animations
  tooltipEnter: {
    initial: { opacity: 0, scale: 0.8, y: -5 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: -5 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },

  // Loading animations
  pulse: {
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  shimmer: {
    animate: { backgroundPosition: ['200% 0', '-200% 0'] },
    transition: { duration: 2, repeat: Infinity, ease: 'linear' },
  },
};

// Stagger container for lists
export const staggerContainer = {
  initial: 'hidden',
  animate: 'visible',
  variants: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};

// Item variants for stagger
export const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  },
};

export default animationVariants;
