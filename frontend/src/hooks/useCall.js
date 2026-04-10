// useCall Hook - Easy-to-use React hook for call management in components
import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../store/callStore.js';
import { webrtcManager } from '../services/webrtcManager.js';

/**
 * Hook to manage calls in a component
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoInit - Auto-initialize listeners on mount (default: true)
 * @param {Function} options.onRemoteStream - Callback when remote stream is received
 * @param {Function} options.onConnectionChange - Callback when connection state changes
 * @returns {Object} Call management API
 */
export const useCall = (options = {}) => {
  const {
    autoInit = true,
    onRemoteStream = null,
    onConnectionChange = null,
  } = options;

  const initializedRef = useRef(false);
  const peerConnectionRef = useRef(null);
  const onRemoteStreamRef = useRef(onRemoteStream);
  const onConnectionChangeRef = useRef(onConnectionChange);

  // Store state and actions
  const {
    activeCall,
    incomingCall,
    localStream,
    remoteStreams,
    isMuted,
    isCameraOn,
    connectionStatus,
    peerStatuses,
    isLoading,
    error,
    initializeCallListeners,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    setLocalStream,
    addRemoteStream,
    removeRemoteStream,
    updateConnectionStatus,
    updatePeerStatus,
    clearError,
    cleanup,
  } = useCallStore();

  // Initialize listeners on mount
  useEffect(() => {
    if (!autoInit || initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    initializeCallListeners();

    return () => {
      // Cleanup on unmount
      if (activeCall) {
        endCall(activeCall.callId || activeCall._id);
      }
    };
  }, [autoInit, initializeCallListeners, activeCall, endCall]);

  // Handle remote streams
  useEffect(() => {
    if (!activeCall) {
      return;
    }

    const callId = activeCall.callId || activeCall._id;
    const peerConnection = webrtcManager.getPeerConnection(callId);

    if (!peerConnection) {
      return;
    }

    const handleTrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        addRemoteStream(activeCall.receiverId || activeCall.callerId, remoteStream);
        onRemoteStreamRef.current?.(remoteStream);
      }
    };

    const handleConnectionStateChange = () => {
      const state = webrtcManager.getConnectionState(callId);
      if (state) {
        updateConnectionStatus(state.connectionState);
        onConnectionChangeRef.current?.(state);
      }
    };

    const handleIceCandidate = (event) => {
      if (event.candidate) {
        const { socketCall } = require('../services/socket.js');
        socketCall.sendICECandidate({
          callId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    peerConnection.addEventListener('track', handleTrack);
    peerConnection.addEventListener('connectionstatechange', handleConnectionStateChange);
    peerConnection.addEventListener('icecandidate', handleIceCandidate);

    return () => {
      peerConnection.removeEventListener('track', handleTrack);
      peerConnection.removeEventListener('connectionstatechange', handleConnectionStateChange);
      peerConnection.removeEventListener('icecandidate', handleIceCandidate);
    };
  }, [activeCall, addRemoteStream, updateConnectionStatus]);

  // Utility functions
  const getRemoteStream = useCallback((userId) => {
    return remoteStreams[userId] || null;
  }, [remoteStreams]);

  const getRemoteStreamByCall = useCallback(() => {
    if (!activeCall) return null;
    const remoteUserId = activeCall.receiverId || activeCall.callerId;
    return getRemoteStream(remoteUserId);
  }, [activeCall, getRemoteStream]);

  const hasRemoteStream = useCallback(() => {
    return Object.keys(remoteStreams).length > 0;
  }, [remoteStreams]);

  const isConnected = useCallback(() => {
    return connectionStatus === 'connected';
  }, [connectionStatus]);

  const isConnecting = useCallback(() => {
    return connectionStatus === 'connecting';
  }, [connectionStatus]);

  const getRemotePeerStatus = useCallback((field) => {
    if (!activeCall) return null;
    const remoteUserId = activeCall.receiverId || activeCall.callerId;
    const status = peerStatuses[remoteUserId];
    return field ? status?.[field] : status;
  }, [activeCall, peerStatuses]);

  const getConnectionStats = useCallback(async () => {
    if (!activeCall) return null;
    const callId = activeCall.callId || activeCall._id;
    return webrtcManager.getConnectionStats(callId);
  }, [activeCall]);

  // Return API
  return {
    // State
    activeCall,
    incomingCall,
    localStream,
    remoteStreams,
    isMuted,
    isCameraOn,
    connectionStatus,
    peerStatuses,
    isLoading,
    error,

    // Call actions
    initiateCall,
    acceptCall,
    declineCall,
    endCall,

    // Media controls
    toggleMute,
    toggleCamera,
    setLocalStream,

    // Stream management
    addRemoteStream,
    removeRemoteStream,
    getRemoteStream,
    getRemoteStreamByCall,
    hasRemoteStream,

    // Connection status
    updateConnectionStatus,
    updatePeerStatus,
    getRemotePeerStatus,
    isConnected,
    isConnecting,

    // Statistics
    getConnectionStats,

    // Utilities
    clearError,
    cleanup,
  };
};

export default useCall;
