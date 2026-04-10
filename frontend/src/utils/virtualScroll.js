/**
 * Virtual Scrolling Utility for React
 * Helps render only visible items in long lists for better performance
 */

/**
 * Calculate which items should be rendered based on scroll position
 */
export const calculateVisibleRange = (
  scrollTop,
  containerHeight,
  itemHeight,
  totalItems,
  bufferSize = 5
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endIndex = Math.min(totalItems, Math.ceil(scrollTop / containerHeight + visibleCount + bufferSize));

  return {
    startIndex,
    endIndex,
    visibleCount,
    offsetY: startIndex * itemHeight,
  };
};

/**
 * Virtual scroll container hook
 * Usage: const { visibleItems, containerRef, ...props } = useVirtualScroll(items)
 */
export const useVirtualScroll = (
  items = [],
  options = {}
) => {
  const {
    itemHeight = 80,
    containerHeight = 400,
    bufferSize = 5,
    onScroll = null,
  } = options;

  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = React.useMemo(() => {
    return calculateVisibleRange(
      scrollTop,
      containerHeight,
      itemHeight,
      items.length,
      bufferSize
    );
  }, [scrollTop, containerHeight, itemHeight, items.length, bufferSize]);

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange]);

  const handleScroll = (e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  const containerRef = React.useRef(null);

  return {
    visibleItems,
    visibleRange,
    containerRef,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.offsetY,
  };
};

/**
 * Virtual List Component
 */
export const VirtualList = ({
  items = [],
  itemHeight = 80,
  containerHeight = 400,
  renderItem,
  bufferSize = 5,
  className = '',
  onScroll = null,
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = React.useMemo(() => {
    return calculateVisibleRange(
      scrollTop,
      containerHeight,
      itemHeight,
      items.length,
      bufferSize
    );
  }, [scrollTop, containerHeight, itemHeight, items.length, bufferSize]);

  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex);

  const handleScroll = (e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  return (
    <div
      className={`virtual-list ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: items.length * itemHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${visibleRange.offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{
                height: itemHeight,
                position: 'absolute',
                top: (visibleRange.startIndex + index) * itemHeight - visibleRange.offsetY,
              }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Infinity scroll utility - detect when user scrolls to bottom
 */
export const useInfinityScroll = (options = {}) => {
  const {
    threshold = 0.9, // trigger at 90% scroll
    onLoadMore = null,
  } = options;

  const [isLoading, setIsLoading] = React.useState(false);
  const containerRef = React.useRef(null);

  const handleScroll = React.useCallback(() => {
    if (!containerRef.current || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage > threshold) {
      setIsLoading(true);
      onLoadMore?.().finally(() => setIsLoading(false));
    }
  }, [threshold, isLoading, onLoadMore]);

  return {
    containerRef,
    handleScroll,
    isLoading,
    setIsLoading,
  };
};

/**
 * Intersection Observer for lazy loading
 */
export const useLazyLoad = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    onIntersect = null,
  } = options;

  const ref = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          onIntersect?.();
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, onIntersect]);

  return {
    ref,
    isVisible,
  };
};

/**
 * Memoized list item for virtual scrolling
 */
export const VirtualListItem = React.memo(
  ({ item, index, renderContent, itemHeight }) => (
    <div
      style={{
        height: itemHeight,
        borderBottom: '1px solid #e0e0e0',
      }}
    >
      {renderContent(item, index)}
    </div>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.item._id === nextProps.item._id &&
      prevProps.index === nextProps.index
    );
  }
);

/**
 * Performance monitoring utilities
 */
export const measurePerformance = (label) => {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`${label}: ${duration.toFixed(2)}ms`);
      return duration;
    },
  };
};

/**
 * Debounce function for scroll events
 */
export const debounce = (func, wait = 250) => {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for frequent events
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;

  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export default {
  calculateVisibleRange,
  useVirtualScroll,
  VirtualList,
  useInfinityScroll,
  useLazyLoad,
  VirtualListItem,
  measurePerformance,
  debounce,
  throttle,
};
