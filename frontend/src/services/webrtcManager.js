// WebRTC Manager - Handle peer connections and media streams
// Supports STUN and TURN servers for reliable NAT traversal
// Dynamically fetches ICE server configuration from backend

import { api } from './api.js';

// Fallback STUN servers (always available)
const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
];

class WebRTCManager {
  constructor() {
    this.peerConnections = new Map();
    this.localStream = null;
    this.iceServers = null;
    this.iceServersFetchTime = null;
    this.iceServersCacheDuration = 1 * 60 * 60 * 1000; // Cache for 1 hour
    this.mediaConstraints = {
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    };
    // Connection diagnostics
    this.connectionStats = new Map();
    this.connectionErrors = new Map();
  }

  /**
   * Fetch ICE servers from backend
   * Gets both STUN and TURN servers configuration
   * Caches result to avoid repeated API calls
   * @returns {Promise<Array>} Array of ICE server configurations
   */
  async fetchIceServers() {
    try {
      // Check if cache is still valid
      if (this.iceServers && this.iceServersFetchTime) {
        const cacheAge = Date.now() - this.iceServersFetchTime;
        if (cacheAge < this.iceServersCacheDuration) {
          console.log('[WebRTC] Using cached ICE servers');
          return this.iceServers;
        }
      }

      console.log('[WebRTC] Fetching ICE servers from backend...');
      const response = await api.get('/webrtc/ice-servers');

      if (response.data && response.data.iceServers) {
        const { primary, fallback, turnAvailable, provider } = response.data.iceServers;
        
        // Use primary servers, fallback to STUN if TURN not available
        this.iceServers = turnAvailable ? primary : primary || this.getDefaultIceServers();
        this.iceServersFetchTime = Date.now();

        console.log(`[WebRTC] ICE servers loaded (Provider: ${provider}, TURN: ${turnAvailable ? 'Yes' : 'No'})`);
        return this.iceServers;
      }
    } catch (error) {
      console.warn('[WebRTC] Failed to fetch ICE servers from backend:', error.message);
    }

    // Fallback to default servers
    return this.getDefaultIceServers();
  }

  /**
   * Get default ICE servers (STUN only)
   * Used as fallback when backend is unavailable
   * @returns {Array} Array of default STUN server configurations
   */
  getDefaultIceServers() {
    return DEFAULT_STUN_SERVERS.map(url => ({ urls: url }));
  }

  /**
   * Get or create RTCPeerConnection with dynamic ICE servers
   * @param {string} callId - Unique call identifier
   * @param {boolean} initiator - Whether this peer is initiating the connection
   * @returns {Promise<RTCPeerConnection>} The peer connection
   */
  async getOrCreatePeerConnection(callId, initiator = false) {
    if (this.peerConnections.has(callId)) {
      return this.peerConnections.get(callId);
    }

    // Fetch ICE servers (uses cache if available)
    const iceServers = await this.fetchIceServers();

    const config = {
      iceServers: iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };

    const peerConnection = new RTCPeerConnection(config);

    // Add local stream if available
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Setup connection monitoring and error logging
    this.setupConnectionMonitoring(callId, peerConnection);

    // Store connection
    this.peerConnections.set(callId, peerConnection);

    return peerConnection;
  }

  /**
   * Setup connection state monitoring and diagnostics
   * Tracks ICE connection state, handles failures, provides diagnostics
   * @param {string} callId - Call ID
   * @param {RTCPeerConnection} peerConnection - The peer connection to monitor
   */
  setupConnectionMonitoring(callId, peerConnection) {
    let connectionAttempts = 0;
    const maxAttempts = 30; // ~30 seconds with 1 second interval

    // Monitor ICE connection state
    peerConnection.addEventListener('iceconnectionstatechange', () => {
      const state = peerConnection.iceConnectionState;
      console.log(`[WebRTC] Call ${callId} ICE state: ${state}`);

      switch (state) {
        case 'connected':
          console.log(`✓ Call ${callId}: ICE connection established`);
          this.connectionStats.delete(callId); // Clear error tracking
          break;
        case 'failed':
          console.error(`✗ Call ${callId}: ICE connection failed`);
          if (!this.connectionErrors.has(callId)) {
            this.connectionErrors.set(callId, 0);
          }
          this.connectionErrors.set(callId, this.connectionErrors.get(callId) + 1);
          break;
        case 'disconnected':
          console.warn(`⚠ Call ${callId}: ICE connection disconnected (may reconnect)`);
          break;
        case 'closed':
          console.log(`○ Call ${callId}: ICE connection closed`);
          this.connectionStats.delete(callId);
          this.connectionErrors.delete(callId);
          break;
      }
    });

    // Monitor overall connection state
    peerConnection.addEventListener('connectionstatechange', () => {
      const state = peerConnection.connectionState;
      console.log(`[WebRTC] Call ${callId} connection state: ${state}`);
    });

    // Monitor signaling state
    peerConnection.addEventListener('signalingstatechange', () => {
      const state = peerConnection.signalingState;
      console.log(`[WebRTC] Call ${callId} signaling state: ${state}`);
    });

    // Monitor ICE gathering state
    peerConnection.addEventListener('icegatheringstatechange', () => {
      const state = peerConnection.iceGatheringState;
      console.log(`[WebRTC] Call ${callId} ICE gathering: ${state}`);
    });

    // ICE candidate monitoring for diagnostics
    peerConnection.addEventListener('icecandidate', (event) => {
      if (!event.candidate) {
        console.log(`[WebRTC] Call ${callId}: ICE candidates gathering complete`);
        return;
      }

      // Log candidate type for diagnostics
      const candidateType = event.candidate.type;
      const protocol = event.candidate.protocol;
      console.log(`[WebRTC] Call ${callId}: New ICE candidate (${candidateType}, ${protocol})`);
    });
  }

  /**
   * Get connection diagnostics
   * @param {string} callId - Call ID
   * @returns {Object} Diagnostic information about the connection
   */
  getConnectionDiagnostics(callId) {
    const peerConnection = this.getPeerConnection(callId);
    if (!peerConnection) {
      return null;
    }

    return {
      callId,
      connectionState: peerConnection.connectionState,
      iceConnectionState: peerConnection.iceConnectionState,
      iceGatheringState: peerConnection.iceGatheringState,
      signalingState: peerConnection.signalingState,
      errorCount: this.connectionErrors.get(callId) || 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get existing peer connection
   * @param {string} callId - Call ID
   * @returns {RTCPeerConnection|null} The peer connection or null
   */
  getPeerConnection(callId) {
    return this.peerConnections.get(callId) || null;
  }

  /**
   * Initialize local media stream
   * @param {Object} constraints - Media constraints (audio, video)
   * @returns {Promise<MediaStream>} Local media stream
   */
  async getLocalStream(constraints = null) {
    try {
      // Return existing stream if available
      if (this.localStream && !constraints) {
        return this.localStream;
      }

      const mediaConstraints = constraints || this.mediaConstraints;
      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      return this.localStream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  /**
   * Stop local media stream
   */
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  /**
   * Toggle audio track
   * @param {boolean} enabled - Enable or disable audio
   */
  setAudioEnabled(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle video track
   * @param {boolean} enabled - Enable or disable video
   */
  setVideoEnabled(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Check if audio is enabled
   * @returns {boolean} Audio enabled status
   */
  isAudioEnabled() {
    if (!this.localStream) return false;
    const audioTracks = this.localStream.getAudioTracks();
    return audioTracks.length > 0 && audioTracks[0].enabled;
  }

  /**
   * Check if video is enabled
   * @returns {boolean} Video enabled status
   */
  isVideoEnabled() {
    if (!this.localStream) return false;
    const videoTracks = this.localStream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].enabled;
  }

  /**
   * Create WebRTC offer
   * @param {string} callId - Call ID
   * @returns {Promise<RTCSessionDescription>} The offer
   */
  async createOffer(callId) {
    try {
      const peerConnection = await this.getOrCreatePeerConnection(callId, true);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  /**
   * Create WebRTC answer
   * @param {string} callId - Call ID
   * @param {RTCSessionDescription} offer - The remote offer
   * @returns {Promise<RTCSessionDescription>} The answer
   */
  async createAnswer(callId, offer) {
    try {
      const peerConnection = await this.getOrCreatePeerConnection(callId, false);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  /**
   * Set remote description (answer for offerer, offer for answerer)
   * @param {string} callId - Call ID
   * @param {RTCSessionDescription} description - The remote description
   * @returns {Promise<void>}
   */
  async setRemoteDescription(callId, description) {
    try {
      const peerConnection = this.getPeerConnection(callId);
      if (!peerConnection) {
        throw new Error(`Peer connection not found for call ${callId}`);
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   * @param {string} callId - Call ID
   * @param {RTCIceCandidate} candidate - The ICE candidate
   * @returns {Promise<void>}
   */
  async addIceCandidate(callId, candidate) {
    try {
      const peerConnection = this.getPeerConnection(callId);
      if (!peerConnection) {
        console.warn(`Peer connection not found for call ${callId}`);
        return;
      }

      if (candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      // Don't throw - ICE candidate errors can be non-fatal
    }
  }

  /**
   * Get connection state
   * @param {string} callId - Call ID
   * @returns {Object} Connection state details
   */
  getConnectionState(callId) {
    const peerConnection = this.getPeerConnection(callId);
    if (!peerConnection) {
      return null;
    }

    return {
      connectionState: peerConnection.connectionState,
      iceConnectionState: peerConnection.iceConnectionState,
      iceGatheringState: peerConnection.iceGatheringState,
      signalingState: peerConnection.signalingState,
    };
  }

  /**
   * Get connection stats
   * @param {string} callId - Call ID
   * @returns {Promise<Object>} Connection statistics
   */
  async getConnectionStats(callId) {
    try {
      const peerConnection = this.getPeerConnection(callId);
      if (!peerConnection) {
        return null;
      }

      const stats = await peerConnection.getStats();
      const result = {
        audio: {},
        video: {},
        connection: {},
      };

      stats.forEach(report => {
        if (report.type === 'inbound-rtp') {
          if (report.kind === 'audio') {
            result.audio.inbound = {
              bytesReceived: report.bytesReceived,
              packetsReceived: report.packetsReceived,
              packetsLost: report.packetsLost,
              jitter: report.jitter,
            };
          } else if (report.kind === 'video') {
            result.video.inbound = {
              bytesReceived: report.bytesReceived,
              packetsReceived: report.packetsReceived,
              packetsLost: report.packetsLost,
              framesDecoded: report.framesDecoded,
              frameRate: report.framesPerSecond,
            };
          }
        } else if (report.type === 'outbound-rtp') {
          if (report.kind === 'audio') {
            result.audio.outbound = {
              bytesSent: report.bytesSent,
              packetsSent: report.packetsSent,
            };
          } else if (report.kind === 'video') {
            result.video.outbound = {
              bytesSent: report.bytesSent,
              packetsSent: report.packetsSent,
              framesEncoded: report.framesEncoded,
              frameRate: report.framesPerSecond,
            };
          }
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          result.connection = {
            currentRoundTripTime: report.currentRoundTripTime,
            availableOutgoingBitrate: report.availableOutgoingBitrate,
            bytesReceived: report.bytesReceived,
            bytesSent: report.bytesSent,
          };
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting connection stats:', error);
      return null;
    }
  }

  /**
   * Close peer connection
   * @param {string} callId - Call ID
   */
  closePeerConnection(callId) {
    const peerConnection = this.peerConnections.get(callId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(callId);
    }
  }

  /**
   * Close all peer connections
   */
  closeAllPeerConnections() {
    for (const [callId, peerConnection] of this.peerConnections.entries()) {
      peerConnection.close();
    }
    this.peerConnections.clear();
  }

  /**
   * Get all active calls
   * @returns {string[]} Array of call IDs
   */
  getActiveCalls() {
    return Array.from(this.peerConnections.keys());
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.closeAllPeerConnections();
    this.stopLocalStream();
  }

  /**
   * Get WebRTC configuration information
   * Used for diagnostics and debugging
   * @returns {Promise<Object>} WebRTC configuration info
   */
  async getWebRTCInfo() {
    try {
      const iceServers = await this.fetchIceServers();
      return {
        iceServersCount: iceServers.length,
        hasStun: iceServers.some(s => s.urls && (Array.isArray(s.urls) ? s.urls[0].includes('stun') : s.urls.includes('stun'))),
        hasTurn: iceServers.some(s => s.urls && (Array.isArray(s.urls) ? s.urls[0].includes('turn') : s.urls.includes('turn'))),
        activeCalls: this.getActiveCalls().length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting WebRTC info:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check ICE connection health
   * Returns connection status and recommendations
   * @param {string} callId - Call ID
   * @returns {Object} Health check result
   */
  checkConnectionHealth(callId) {
    const peerConnection = this.getPeerConnection(callId);
    if (!peerConnection) {
      return {
        healthy: false,
        message: 'Connection not found',
      };
    }

    const iceState = peerConnection.iceConnectionState;
    const connectionState = peerConnection.connectionState;
    const errorCount = this.connectionErrors.get(callId) || 0;

    const health = {
      healthy: iceState === 'connected' && connectionState === 'connected',
      iceState,
      connectionState,
      errorCount,
      timestamp: new Date().toISOString(),
    };

    // Add recommendations if unhealthy
    if (!health.healthy) {
      if (iceState === 'failed') {
        health.recommendation = 'ICE connection failed - check network, firewall, or TURN server availability';
      } else if (iceState === 'disconnected') {
        health.recommendation = 'ICE disconnected - connection may recover automatically';
      } else if (connectionState === 'failed') {
        health.recommendation = 'Connection failed - try hanging up and calling again';
      }
    }

    return health;
  }
}

// Create singleton instance
export const webrtcManager = new WebRTCManager();

export default webrtcManager;
