// WebRTC Manager - Handle peer connections and media streams
// Uses Google's STUN servers for NAT traversal

const STUN_SERVERS = [
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
    this.mediaConstraints = {
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    };
  }

  /**
   * Get or create RTCPeerConnection
   * @param {string} callId - Unique call identifier
   * @param {boolean} initiator - Whether this peer is initiating the connection
   * @returns {RTCPeerConnection} The peer connection
   */
  getOrCreatePeerConnection(callId, initiator = false) {
    if (this.peerConnections.has(callId)) {
      return this.peerConnections.get(callId);
    }

    const config = {
      iceServers: STUN_SERVERS.map(url => ({ urls: url })),
    };

    const peerConnection = new RTCPeerConnection(config);

    // Add local stream if available
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Store connection
    this.peerConnections.set(callId, peerConnection);

    return peerConnection;
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
      const peerConnection = this.getOrCreatePeerConnection(callId, true);
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
      const peerConnection = this.getOrCreatePeerConnection(callId, false);
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
}

// Create singleton instance
export const webrtcManager = new WebRTCManager();

export default webrtcManager;
