// ICE Server Configuration Service
// Manages STUN and TURN servers for WebRTC connections
// Supports dynamic credential generation and fallback mechanisms

class IceServerService {
  constructor() {
    this.stunServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302',
    ];

    // TURN server configuration
    this.turnProvider = process.env.TURN_PROVIDER || 'metered'; // metered | twilio | manual
    this.turnServers = [];
    this.turnCredentials = null;
    this.turnRefreshTime = null;
  }

  /**
   * Initialize TURN server configuration
   * Call this once on server startup
   */
  async initialize() {
    console.log('[ICE Server] Initializing with provider:', this.turnProvider);

    switch (this.turnProvider.toLowerCase()) {
      case 'metered':
        this.initializeMeteredTurn();
        break;
      case 'twilio':
        await this.initializeTwilioTurn();
        break;
      case 'manual':
        this.initializeManualTurn();
        break;
      default:
        console.warn('[ICE Server] Unknown TURN provider, using STUN only');
    }
  }

  /**
   * Initialize Metered.ca TURN servers
   * Uses API key for authentication
   */
  initializeMeteredTurn() {
    const apiKey = process.env.METERED_API_KEY;

    if (!apiKey) {
      console.warn('[ICE Server] METERED_API_KEY not configured, using STUN only');
      return;
    }

    // Metered provides public TURN servers
    this.turnServers = [
      {
        urls: [
          `turn:a.relay.metered.ca:80?transport=udp`,
          `turn:a.relay.metered.ca:80?transport=tcp`,
          `turn:a.relay.metered.ca:443?transport=tcp`,
          `turns:a.relay.metered.ca:443?transport=tcp`,
        ],
        username: apiKey,
        credential: apiKey,
      },
    ];

    console.log('[ICE Server] Metered TURN servers configured');
  }

  /**
   * Initialize Twilio TURN servers
   * Fetches dynamic credentials from Twilio Token service
   */
  async initializeTwilioTurn() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn('[ICE Server] Twilio credentials not configured, using STUN only');
      return;
    }

    try {
      // Fetch fresh credentials
      await this.refreshTwilioCredentials();
    } catch (error) {
      console.error('[ICE Server] Failed to initialize Twilio TURN:', error.message);
    }
  }

  /**
   * Refresh Twilio credentials
   * Called periodically to get fresh token credentials
   */
  async refreshTwilioCredentials() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const AuthorizationType = require('twilio/lib/rest/api/authorizationType');
      const { ClientCapability } = require('twilio').jwt;

      // Create client capability token for ICE
      const token = new ClientCapability({
        accountSid,
        authToken,
      });

      // Enable TURN (media)
      token.addIceServers('default');
      const capability = token.generate(/* expirationTime */ 3600);

      // Typically, Twilio TURN servers would be fetched here
      // For now, set up with TURN URLs and the generated token
      this.turnServers = [
        {
          urls: [
            'turn:global.turn.twilio.com:3478?transport=udp',
            'turn:global.turn.twilio.com:3478?transport=tcp',
            'turns:global.turn.twilio.com:443?transport=tcp',
          ],
          username: 'jwt-token',
          credential: capability,
        },
      ];

      this.turnCredentials = capability;
      this.turnRefreshTime = Date.now() + 3600000; // 1 hour refresh

      console.log('[ICE Server] Twilio TURN credentials refreshed');
    } catch (error) {
      console.error('[ICE Server] Error refreshing Twilio credentials:', error.message);
      // Fallback: use STUN only
      this.turnServers = [];
    }
  }

  /**
   * Initialize manual TURN server configuration
   * Uses environment variables for server details
   */
  initializeManualTurn() {
    const turnHost = process.env.TURN_HOST;
    const turnPort = process.env.TURN_PORT || '3478';
    const turnUsername = process.env.TURN_USERNAME;
    const turnPassword = process.env.TURN_PASSWORD;

    if (!turnHost) {
      console.warn('[ICE Server] TURN_HOST not configured, using STUN only');
      return;
    }

    this.turnServers = [
      {
        urls: [
          `turn:${turnHost}:${turnPort}?transport=udp`,
          `turn:${turnHost}:${turnPort}?transport=tcp`,
          `turns:${turnHost}:5349?transport=tcp`,
        ],
        username: turnUsername || '',
        credential: turnPassword || '',
      },
    ];

    console.log(`[ICE Server] Manual TURN server configured: ${turnHost}`);
  }

  /**
   * Get current ICE servers configuration
   * Includes STUN servers and configured TURN servers
   * @returns {Array<Object>} Array of ICE server configurations
   */
  getIceServers() {
    const iceServers = [];

    // Add STUN servers (always available)
    this.stunServers.forEach(url => {
      iceServers.push({ urls: url });
    });

    // Add TURN servers if configured
    if (this.turnServers && this.turnServers.length > 0) {
      iceServers.push(...this.turnServers);
    }

    return iceServers;
  }

  /**
   * Get ICE servers with fallback support
   * Returns multiple options for resilience
   * @returns {Object} ICE server configuration with primary and fallback
   */
  getIceServersWithFallback() {
    const iceServers = this.getIceServers();

    return {
      primary: iceServers,
      fallback: [
        // Fallback to STUN only if TURN fails
        ...this.stunServers.map(url => ({ urls: url })),
      ],
      turnAvailable: this.turnServers.length > 0,
      provider: this.turnProvider,
    };
  }

  /**
   * Check if TURN credentials need refresh
   * For providers like Twilio that require token renewal
   * @returns {boolean} Whether refresh is needed
   */
  needsRefresh() {
    if (this.turnProvider.toLowerCase() !== 'twilio') {
      return false;
    }

    if (!this.turnRefreshTime) {
      return true;
    }

    // Refresh if expiration is within 5 minutes
    return Date.now() > this.turnRefreshTime - 300000;
  }

  /**
   * Handle credential refresh if needed
   * Call periodically to ensure credentials stay valid
   */
  async refreshIfNeeded() {
    if (!this.needsRefresh()) {
      return;
    }

    try {
      if (this.turnProvider.toLowerCase() === 'twilio') {
        await this.refreshTwilioCredentials();
      }
    } catch (error) {
      console.error('[ICE Server] Error in refresh cycle:', error.message);
    }
  }

  /**
   * Get detailed diagnostics about ICE server configuration
   * Useful for debugging and monitoring
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    return {
      provider: this.turnProvider,
      stunServersCount: this.stunServers.length,
      turnServersCount: this.turnServers.length,
      hasTurn: this.turnServers.length > 0,
      turnRefreshNeeded: this.needsRefresh(),
      lastRefreshTime: this.turnRefreshTime ? new Date(this.turnRefreshTime) : null,
      iceServersCount: this.getIceServers().length,
    };
  }
}

// Create singleton instance
const iceServerService = new IceServerService();

export default iceServerService;
