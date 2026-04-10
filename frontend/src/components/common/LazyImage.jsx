/**
 * Lazy Image Component
 * Loads images only when they enter the viewport
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = '/placeholder-image.png',
  onLoad = null,
  width,
  height,
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // Use Intersection Observer to detect when image enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  // Load image when it comes into view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad?.();
    };
    img.onerror = () => {
      setImageSrc(placeholder);
      setIsLoading(false);
    };
  }, [isInView, src, placeholder, onLoad]);

  return (
    <motion.div
      ref={imgRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity ${
          isLoading ? 'opacity-50' : 'opacity-100'
        }`}
        loading="lazy"
      />
      {isLoading && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-gray-300 dark:bg-dark-700"
        />
      )}
    </motion.div>
  );
};

export default LazyImage;
