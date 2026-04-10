// WebRTC Configuration routes
// Serve ICE server configurations and WebRTC settings to clients

import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import iceServerService from '../services/iceServerService.js';

const router = express.Router();

/**
 * GET /api/webrtc/ice-servers
 * Fetch ICE server configuration (STUN and TURN)
 * Returns both primary and fallback configurations
 */
router.get('/ice-servers', verifyToken, async (req, res) => {
  try {
    // Check if TURN credentials need refresh
    if (iceServerService.needsRefresh()) {
      await iceServerService.refreshIfNeeded();
    }

    const iceServers = iceServerService.getIceServersWithFallback();

    res.json({
      success: true,
      iceServers,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[WebRTC API] Error fetching ICE servers:', error);
    
    // Fallback: return STUN servers only
    const fallbackServers = iceServerService.getIceServers();
    res.json({
      success: true,
      iceServers: {
        primary: fallbackServers,
        fallback: fallbackServers,
        turnAvailable: false,
        provider: 'fallback',
      },
      warning: 'TURN unavailable, using STUN only',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/webrtc/ice-servers/diagnostics
 * Admin endpoint for debugging ICE server configuration
 * Returns diagnostic information about current setup
 */
router.get('/ice-servers/diagnostics', verifyToken, async (req, res) => {
  try {
    // Optional: check if user is admin (implement as needed)
    // const user = await User.findById(req.user.id);
    // if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const diagnostics = iceServerService.getDiagnostics();

    res.json({
      success: true,
      diagnostics,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[WebRTC API] Error fetching diagnostics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch diagnostics',
    });
  }
});

/**
 * GET /api/webrtc/config
 * Fetch complete WebRTC configuration
 * Includes ICE servers and other WebRTC settings
 */
router.get('/config', verifyToken, async (req, res) => {
  try {
    // Check if TURN credentials need refresh
    if (iceServerService.needsRefresh()) {
      await iceServerService.refreshIfNeeded();
    }

    const config = {
      iceServers: iceServerService.getIceServers(),
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceCandidatePolicy: process.env.WEBRTC_ICE_CANDIDATE_POLICY || 'all',
      iceTransportPolicy: process.env.WEBRTC_ICE_TRANSPORT_POLICY || 'all',
      // Add more WebRTC configuration options as needed
      turnAvailable: iceServerService.turnServers.length > 0,
      provider: iceServerService.turnProvider,
    };

    res.json({
      success: true,
      config,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[WebRTC API] Error fetching config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch WebRTC configuration',
    });
  }
});

export default router;
