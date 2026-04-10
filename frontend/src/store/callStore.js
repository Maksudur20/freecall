// Call Store - Zustand store for call state management
import { create } from 'zustand';
import { socketCall } from '../services/socket.js';
import { webrtcManager } from '../services/webrtcManager.js';
import { useAuthStore } from './authStore.js';

export const useCallStore = create((set, get) => ({
  // State
  activeCall: null, // Current active call
  incomingCall: null, // Incoming call notification
  calls: [], // Call history (recent calls)
  isLoading: false,
  error: null,

  // Media state
  localStream: null,
  remoteStreams: {}, // Map of userId -> stream
  isMuted: false,
  isCameraOn: true,

  // Connection state
  connectionStatus: 'idle', // idle, connecting, connected, disconnected, failed
  peerStatuses: {}, // Map of userId -> connection status

  // ==================== INITIALIZATION ====================
  initializeCallListeners: () => {
    // Incoming call
    socketCall.onIncomingCall((data) => {
      set({ incomingCall: data });
    });

    // Call accepted
    socketCall.onCallAccepted((data) => {
      set(state => ({
        activeCall: state.activeCall ? { ...state.activeCall, status: 'answered' } : null,
      }));
    });

    // Call declined
    socketCall.onCallDeclined((data) => {
      set({ activeCall: null, incomingCall: null, connectionStatus: 'idle' });
    });

    // Call ended
    socketCall.onCallEnded((data) => {
      const { callId } = data;
      const { activeCall, peerStatuses } = get();

      if (activeCall?._id === callId || activeCall?.callId === callId) {
        set({
          activeCall: null,
          connectionStatus: 'idle',
          peerStatuses: {},
          remoteStreams: {},
        });
      }
    });

    // WebRTC offer
    socketCall.onOffer((data) => {
      const { callId, offer, fromUserId } = data;
      get().handleRemoteOffer(callId, offer, fromUserId);
    });

    // WebRTC answer
    socketCall.onAnswer((data) => {
      const { callId, answer, fromUserId } = data;
      get().handleRemoteAnswer(callId, answer, fromUserId);
    });

    // ICE candidate
    socketCall.onICECandidate(async (data) => {
      const { callId, candidate } = data;
      try {
        await webrtcManager.addIceCandidate(callId, candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    // Mute status change
    socketCall.onMuteStatusChange((data) => {
      const { callId, userId, isMuted } = data;
      set(state => ({
        peerStatuses: {
          ...state.peerStatuses,
          [userId]: { ...state.peerStatuses[userId], isMuted },
        },
      }));
    });

    // Camera status change
    socketCall.onCameraStatusChange((data) => {
      const { callId, userId, isCameraOn } = data;
      set(state => ({
        peerStatuses: {
          ...state.peerStatuses,
          [userId]: { ...state.peerStatuses[userId], isCameraOn },
        },
      }));
    });

    // Connection status
    socketCall.onPeerConnectionStatus?.((data) => {
      const { callId, status } = data;
      set({ connectionStatus: status });
    });

    // Peer disconnected
    socketCall.onPeerDisconnected?.((data) => {
      const { callId } = data;
      get().handlePeerDisconnected(callId);
    });
  },

  // ==================== CALL INITIATION ====================
  initiateCall: async (receiverId, type = 'audio') => {
    try {
      set({ isLoading: true, error: null });

      const userId = useAuthStore.getState().user?._id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get local stream
      const constraints = {
        audio: true,
        video: type === 'video',
      };
      const stream = await webrtcManager.getLocalStream(constraints);
      set({ localStream: stream });

      // Create call
      socketCall.initiateCall({
        receiverId,
        type,
      });

      // Update state
      set({
        activeCall: {
          callId: null, // Will be set when server responds
          receiverId,
          type,
          status: 'initiating',
          initiator: true,
        },
        connectionStatus: 'connecting',
        isLoading: false,
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      set({
        error: error.message,
        isLoading: false,
        connectionStatus: 'failed',
      });
      throw error;
    }
  },

  // ==================== CALL ACCEPTANCE ====================
  acceptCall: async (callId) => {
    try {
      set({ isLoading: true, error: null });

      const userId = useAuthStore.getState().user?._id;

      // Get local stream for call
      const stream = await webrtcManager.getLocalStream();
      set({ localStream: stream });

      // Emit acceptance
      socketCall.acceptCall({ callId });

      // Update state
      set(state => ({
        activeCall: state.incomingCall ? { ...state.incomingCall, status: 'answered' } : null,
        incomingCall: null,
        connectionStatus: 'connecting',
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error accepting call:', error);
      set({
        error: error.message,
        isLoading: false,
        connectionStatus: 'failed',
      });
      throw error;
    }
  },

  // ==================== CALL REJECTION ====================
  declineCall: (callId, reason = 'Declined') => {
    socketCall.declineCall({ callId, reason });
    set({ incomingCall: null });
  },

  // ==================== CALL TERMINATION ====================
  endCall: (callId) => {
    try {
      socketCall.endCall({ callId });

      // Cleanup
      webrtcManager.closePeerConnection(callId);
      webrtcManager.stopLocalStream();

      set({
        activeCall: null,
        localStream: null,
        remoteStreams: {},
        connectionStatus: 'idle',
        isMuted: false,
        isCameraOn: true,
        peerStatuses: {},
      });
    } catch (error) {
      console.error('Error ending call:', error);
      set({ error: error.message });
    }
  },

  // ==================== WEBRTC NEGOTIATION ====================
  handleRemoteOffer: async (callId, offer, fromUserId) => {
    try {
      const answer = await webrtcManager.createAnswer(callId, offer);
      socketCall.sendAnswer({
        callId,
        answer: answer.toJSON(),
      });
    } catch (error) {
      console.error('Error handling remote offer:', error);
      set({ error: error.message, connectionStatus: 'failed' });
    }
  },

  handleRemoteAnswer: async (callId, answer, fromUserId) => {
    try {
      await webrtcManager.setRemoteDescription(callId, answer);
      set({ connectionStatus: 'connected' });
    } catch (error) {
      console.error('Error handling remote answer:', error);
      set({ error: error.message, connectionStatus: 'failed' });
    }
  },

  // ==================== MEDIA CONTROLS ====================
  toggleMute: async () => {
    try {
      const { isMuted, activeCall } = get();
      const newMutedState = !isMuted;

      webrtcManager.setAudioEnabled(!newMutedState);

      if (activeCall) {
        socketCall.toggleMute({
          callId: activeCall.callId || activeCall._id,
          isMuted: newMutedState,
        });
      }

      set({ isMuted: newMutedState });
    } catch (error) {
      console.error('Error toggling mute:', error);
      set({ error: error.message });
    }
  },

  toggleCamera: async () => {
    try {
      const { isCameraOn, activeCall } = get();
      const newCameraState = !isCameraOn;

      webrtcManager.setVideoEnabled(newCameraState);

      if (activeCall) {
        socketCall.toggleCamera({
          callId: activeCall.callId || activeCall._id,
          isCameraOn: newCameraState,
        });
      }

      set({ isCameraOn: newCameraState });
    } catch (error) {
      console.error('Error toggling camera:', error);
      set({ error: error.message });
    }
  },

  setAudioEnabled: (enabled) => {
    webrtcManager.setAudioEnabled(enabled);
    set({ isMuted: !enabled });
  },

  setVideoEnabled: (enabled) => {
    webrtcManager.setVideoEnabled(enabled);
    set({ isCameraOn: enabled });
  },

  // ==================== STREAM MANAGEMENT ====================
  setLocalStream: (stream) => {
    set({ localStream: stream });
  },

  addRemoteStream: (userId, stream) => {
    set(state => ({
      remoteStreams: {
        ...state.remoteStreams,
        [userId]: stream,
      },
    }));
  },

  removeRemoteStream: (userId) => {
    set(state => {
      const newRemoteStreams = { ...state.remoteStreams };
      delete newRemoteStreams[userId];
      return { remoteStreams: newRemoteStreams };
    });
  },

  // ==================== CONNECTION STATUS ====================
  updateConnectionStatus: (status) => {
    set({ connectionStatus: status });
    socketCall.connectionStatus?.({ status });
  },

  updatePeerStatus: (userId, status) => {
    set(state => ({
      peerStatuses: {
        ...state.peerStatuses,
        [userId]: { ...state.peerStatuses[userId], ...status },
      },
    }));
  },

  handlePeerDisconnected: (callId) => {
    set({
      activeCall: null,
      remoteStreams: {},
      connectionStatus: 'disconnected',
    });
  },

  // ==================== ERROR HANDLING ====================
  clearError: () => {
    set({ error: null });
  },

  // ==================== CLEANUP ====================
  cleanup: () => {
    webrtcManager.cleanup();
    set({
      activeCall: null,
      incomingCall: null,
      localStream: null,
      remoteStreams: {},
      connectionStatus: 'idle',
      isMuted: false,
      isCameraOn: true,
      peerStatuses: {},
      error: null,
    });
  },
}));

export default useCallStore;
