/**
 * Performance Monitoring Hook
 * Tracks component rendering performance and helps identify bottlenecks
 */

import { useEffect, useRef } from 'react';

export const useRenderMetrics = (componentName) => {
  const renderCountRef = useRef(0);
  const renderStartRef = useRef(Date.now());
  const renderTimesRef = useRef([]);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = Date.now() - renderStartRef.current;
    renderTimesRef.current.push(renderTime);

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      const avgRenderTime =
        renderTimesRef.current.reduce((a, b) => a + b, 0) /
        renderTimesRef.current.length;

      if (renderCountRef.current % 10 === 0) {
        console.log(
          `[${componentName}] Renders: ${renderCountRef.current}, Avg Time: ${avgRenderTime.toFixed(2)}ms`
        );
      }

      // Alert if render time exceeds 16ms (60fps threshold)
      if (renderTime > 16) {
        console.warn(
          `[${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms`
        );
      }
    }
  });

  return {
    renderCount: renderCountRef.current,
    averageRenderTime:
      renderTimesRef.current.reduce((a, b) => a + b, 0) /
      renderTimesRef.current.length,
  };
};

// Measure function execution time
export const measureAsync = async (label, fn) => {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`[${label}] took ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(
      `[${label}] failed after ${(end - start).toFixed(2)}ms`,
      error
    );
    throw error;
  }
};

// Get current memory usage (if available)
export const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
      percentage: (
        (performance.memory.usedJSHeapSize /
          performance.memory.jsHeapSizeLimit) *
        100
      ).toFixed(2),
    };
  }
  return null;
};

export default {
  useRenderMetrics,
  measureAsync,
  getMemoryUsage,
};
