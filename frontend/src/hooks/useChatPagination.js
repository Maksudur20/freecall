/**
 * Pagination Hook for Chat History
 * Loads messages in chunks to improve performance
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const useChatPagination = (initialMessages = [], pageSize = 20) => {
  const [messages, setMessages] = useState(initialMessages);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  // Get paginated messages
  const paginatedMessages = messages.slice(
    0,
    (currentPage + 1) * pageSize
  );

  // Load next page of messages
  const loadMoreMessages = useCallback(
    async (fetchFunction) => {
      if (loadingRef.current || !hasMore) return;

      loadingRef.current = true;
      setIsLoading(true);

      try {
        const newMessages = await fetchFunction(currentPage + 1, pageSize);

        if (newMessages.length < pageSize) {
          setHasMore(false);
        }

        setMessages(prev => [...newMessages, ...prev]);
        setCurrentPage(prev => prev + 1);
      } catch (error) {
        console.error('Failed to load more messages:', error);
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [currentPage, pageSize, hasMore]
  );

  // Reset pagination
  const resetPagination = useCallback(() => {
    setMessages(initialMessages);
    setCurrentPage(0);
    setIsLoading(false);
    setHasMore(true);
    loadingRef.current = false;
  }, [initialMessages]);

  return {
    messages: paginatedMessages,
    currentPage,
    isLoading,
    hasMore,
    loadMoreMessages,
    resetPagination,
    totalMessages: messages.length,
  };
};

/**
 * Intersection Observer Hook for Lazy Loading
 * Triggers callback when element enters viewport
 */
export const useIntersectionObserver = (callback, options = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        rootMargin: '50px',
        ...options,
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
  }, [callback, options]);

  return ref;
};

export default {
  useChatPagination,
  useIntersectionObserver,
};
