// Auto Scroll Hook
import { useEffect, useRef } from 'react';

export const useAutoScroll = (dependency = null, enabled = true) => {
  const containerRef = useRef(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Check if user is scrolled near the bottom
    const container = containerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Only auto-scroll if user was already near bottom or not manually scrolling
    if (isNearBottom && !isUserScrolling.current) {
      // Use requestAnimationFrame for smooth scroll
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [dependency, enabled]);

  // Track user scroll
  const handleScroll = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    isUserScrolling.current = !isNearBottom;
  };

  return { containerRef, handleScroll, isUserScrolling };
};

export default useAutoScroll;
