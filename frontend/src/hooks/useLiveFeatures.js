// useLiveFeatures Hook
// Easy-to-use React hook for live chat features

import { useEffect, useCallback, useRef } from 'react';
import liveFeatures from '../services/liveFeatures.js';

/**
 * Hook to initialize and use live features in a component
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoInit - Auto-initialize on mount (default: true)
 * @param {string} options.conversationId - Conversation ID to join
 * @param {string} options.userId - User ID for the current user
 * @returns {Object} Live features API
 */
export const useLiveFeatures = (options = {}) => {
  const { autoInit = true, conversationId = null, userId = null } = options;
  const initializedRef = useRef(false);

  useEffect(() => {
    if (autoInit && !initializedRef.current) {
      liveFeatures.initializeAllListeners();
      initializedRef.current = true;
    }

    return () => {
      // Optional: cleanup on unmount
      // liveFeatures.cleanupAllListeners();
    };
  }, [autoInit]);

  // Join conversation when ID changes
  useEffect(() => {
    if (conversationId && userId) {
      liveFeatures.joinConversation(conversationId, userId);

      return () => {
        liveFeatures.leaveConversation(conversationId, userId);
      };
    }
  }, [conversationId, userId]);

  // Typing indicator handlers
  const startTyping = useCallback(
    (username) => {
      if (conversationId && userId) {
        liveFeatures.emitTyping(conversationId, userId, username);
      }
    },
    [conversationId, userId]
  );

  const endTyping = useCallback(() => {
    if (conversationId && userId) {
      liveFeatures.stopTyping(conversationId, userId);
    }
  }, [conversationId, userId]);

  // Message handlers
  const sendMessage = useCallback(
    (content, attachments = []) => {
      if (conversationId) {
        liveFeatures.sendMessage(conversationId, content, attachments);
      }
    },
    [conversationId]
  );

  const editMessage = useCallback((messageId, content) => {
    liveFeatures.editMessage(messageId, content);
  }, []);

  const deleteMessage = useCallback((messageId) => {
    liveFeatures.deleteMessage(messageId);
  }, []);

  const addReaction = useCallback((messageId, reaction) => {
    liveFeatures.addReaction(messageId, reaction);
  }, []);

  const markAsDelivered = useCallback((messageId) => {
    liveFeatures.confirmMessageDelivery(messageId);
  }, []);

  const markAsSeen = useCallback(() => {
    if (conversationId && userId) {
      liveFeatures.confirmMessageSeen(conversationId, userId);
    }
  }, [conversationId, userId]);

  // Presence handlers
  const setStatus = useCallback((status) => {
    if (userId) {
      liveFeatures.setUserStatus(userId, status);
    }
  }, [userId]);

  const getOnlineUsers = useCallback(() => {
    liveFeatures.requestOnlineUsers();
  }, []);

  const emitActivity = useCallback(() => {
    if (userId) {
      liveFeatures.emitActivity(userId);
    }
  }, [userId]);

  // Call handlers
  const initiateCall = useCallback(
    (targetUserId) => {
      if (conversationId) {
        liveFeatures.initiateCall(targetUserId, conversationId);
      }
    },
    [conversationId]
  );

  const acceptCall = useCallback((callId) => {
    liveFeatures.acceptCall(callId);
  }, []);

  const declineCall = useCallback((callId) => {
    liveFeatures.declineCall(callId);
  }, []);

  const endCall = useCallback((callId) => {
    liveFeatures.endCall(callId);
  }, []);

  const toggleMute = useCallback((callId, isMuted) => {
    liveFeatures.toggleMute(callId, isMuted);
  }, []);

  const toggleCamera = useCallback((callId, cameraOn) => {
    liveFeatures.toggleCamera(callId, cameraOn);
  }, []);

  // WebRTC handlers
  const sendWebRTCOffer = useCallback((callId, offer) => {
    liveFeatures.sendWebRTCOffer(callId, offer);
  }, []);

  const sendWebRTCAnswer = useCallback((callId, answer) => {
    liveFeatures.sendWebRTCAnswer(callId, answer);
  }, []);

  const sendICECandidate = useCallback((callId, candidate) => {
    liveFeatures.sendICECandidate(callId, candidate);
  }, []);

  return {
    // Typing
    startTyping,
    endTyping,

    // Messages
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    markAsDelivered,
    markAsSeen,

    // Presence
    setStatus,
    getOnlineUsers,
    emitActivity,

    // Calls
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,

    // WebRTC
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,

    // Utilities
    isInitialized: () => liveFeatures.isInitialized(),
    cleanup: () => liveFeatures.cleanupAllListeners(),
  };
};

/**
 * Hook to use only typing features
 */
export const useTypingIndicator = (conversationId, userId, username) => {
  const startTyping = useCallback(() => {
    liveFeatures.emitTyping(conversationId, userId, username);
  }, [conversationId, userId, username]);

  const stopTyping = useCallback(() => {
    liveFeatures.stopTyping(conversationId, userId);
  }, [conversationId, userId]);

  return { startTyping, stopTyping };
};

/**
 * Hook to use only presence features
 */
export const usePresence = (userId) => {
  const setOnline = useCallback(() => {
    liveFeatures.setUserStatus(userId, 'online');
  }, [userId]);

  const setAway = useCallback(() => {
    liveFeatures.setUserStatus(userId, 'away');
  }, [userId]);

  const setOffline = useCallback(() => {
    liveFeatures.setUserStatus(userId, 'offline');
  }, [userId]);

  const getOnlineUsers = useCallback(() => {
    liveFeatures.requestOnlineUsers();
  }, []);

  const emitActivity = useCallback(() => {
    liveFeatures.emitActivity(userId);
  }, [userId]);

  return {
    setOnline,
    setAway,
    setOffline,
    getOnlineUsers,
    emitActivity,
  };
};

/**
 * Hook to use only call features
 */
export const useCallFeatures = () => {
  const initiateCall = useCallback((targetUserId, conversationId) => {
    liveFeatures.initiateCall(targetUserId, conversationId);
  }, []);

  const acceptCall = useCallback((callId) => {
    liveFeatures.acceptCall(callId);
  }, []);

  const declineCall = useCallback((callId) => {
    liveFeatures.declineCall(callId);
  }, []);

  const endCall = useCallback((callId) => {
    liveFeatures.endCall(callId);
  }, []);

  const toggleMute = useCallback((callId, isMuted) => {
    liveFeatures.toggleMute(callId, isMuted);
  }, []);

  const toggleCamera = useCallback((callId, cameraOn) => {
    liveFeatures.toggleCamera(callId, cameraOn);
  }, []);

  const sendOffer = useCallback((callId, offer) => {
    liveFeatures.sendWebRTCOffer(callId, offer);
  }, []);

  const sendAnswer = useCallback((callId, answer) => {
    liveFeatures.sendWebRTCAnswer(callId, answer);
  }, []);

  const sendICECandidate = useCallback((callId, candidate) => {
    liveFeatures.sendICECandidate(callId, candidate);
  }, []);

  return {
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    sendOffer,
    sendAnswer,
    sendICECandidate,
  };
};

/**
 * Hook to use only message features
 */
export const useMessageFeatures = (conversationId) => {
  const sendMessage = useCallback(
    (content, attachments = []) => {
      liveFeatures.sendMessage(conversationId, content, attachments);
    },
    [conversationId]
  );

  const editMessage = useCallback((messageId, content) => {
    liveFeatures.editMessage(messageId, content);
  }, []);

  const deleteMessage = useCallback((messageId) => {
    liveFeatures.deleteMessage(messageId);
  }, []);

  const addReaction = useCallback((messageId, reaction) => {
    liveFeatures.addReaction(messageId, reaction);
  }, []);

  const markAsDelivered = useCallback((messageId) => {
    liveFeatures.confirmMessageDelivery(messageId);
  }, []);

  const markAsSeen = useCallback((userId) => {
    liveFeatures.confirmMessageSeen(conversationId, userId);
  }, [conversationId]);

  return {
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    markAsDelivered,
    markAsSeen,
  };
};

export default useLiveFeatures;
