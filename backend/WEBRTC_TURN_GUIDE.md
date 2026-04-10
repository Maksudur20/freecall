# WebRTC TURN Server Integration Guide

## Overview

FreeCall now supports TURN (Traversal Using Relays around NAT) servers to ensure reliable WebRTC calling across different networks, firewalls, and NAT boundaries. This guide covers setup, configuration, and troubleshooting.

## What's New

### 🎯 Features Added

1. **Dynamic ICE Server Configuration** - Fetches STUN and TURN servers from backend API
2. **Multiple TURN Providers** - Support for Metered.ca, Twilio, or self-hosted TURN servers
3. **Automatic Credential Refresh** - Handles TURN credential expiration (for Twilio)
4. **Connection Diagnostics** - Detailed monitoring of WebRTC connection health
5. **Intelligent Fallback** - Gracefully degrades to STUN if TURN unavailable
6. **Connection Monitoring** - Tracks ICE state, identifies issues, provides recommendations

## Architecture

```
Frontend (webrtcManager.js)
    ↓
[Fetch ICE Servers via API]
    ↓
Backend (iceServerService.js)
    ↓
[Configure STUN + TURN]
    ↓
TURN Server Provider
    ├── Metered.ca (Cloud TURN)
    ├── Twilio (Cloud TURN)
    └── Self-hosted (coturn)
```

## Setup Instructions

### Option 1: Metered.ca (Recommended - Easiest)

Metered provides a simple, reliable TURN service with a free tier.

#### 1. Create Account
1. Go to [https://metered.ca/](https://metered.ca/)
2. Sign up for free account
3. Log in to dashboard

#### 2. Get API Key
1. Navigate to your dashboard
2. Copy your API key (looks like `xxxxxxx.metered.cloud`)

#### 3. Configure Backend
Add to `backend/.env`:
```bash
TURN_PROVIDER=metered
METERED_API_KEY=your_api_key_here
```

#### 4. Deploy
- Commit changes
- Vercel/Render auto-deploy
- Test call between users

### Option 2: Twilio (Cloud-based, with credential generation)

Twilio provides dynamic TURN credentials using JWT tokens.

#### 1. Create Twilio Account
1. Go to [https://www.twilio.com/](https://www.twilio.com/)
2. Sign up for free account
3. Log into [Twilio Console](https://console.twilio.com/)

#### 2. Get Credentials
1. Go to Account Settings
2. Find Account SID and Auth Token
3. Copy both values

#### 3. Configure Backend
Add to `backend/.env`:
```bash
TURN_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

#### 4. Install Dependencies
```bash
npm install twilio
```

#### 5. Deploy
- Commit and push
- Render installs dependencies
- Deploy and test

### Option 3: Self-Hosted TURN (Advanced)

If you're running your own TURN server (e.g., coturn):

#### 1. Deploy TURN Server
See [coturn GitHub](https://github.com/coturn/coturn) for deployment instructions.

#### 2. Configure Backend
Add to `backend/.env`:
```bash
TURN_PROVIDER=manual
TURN_HOST=turn.example.com
TURN_PORT=3478
TURN_USERNAME=username
TURN_PASSWORD=password
```

## API Endpoints

### 1. GET `/api/webrtc/ice-servers`
Fetch current ICE server configuration (STUN + TURN)

**Request:**
```http
GET /api/webrtc/ice-servers
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "iceServers": {
    "primary": [
      { "urls": "stun:stun.l.google.com:19302" },
      {
        "urls": ["turn:a.relay.metered.ca:80", "turn:a.relay.metered.ca:443"],
        "username": "api_key",
        "credential": "api_key"
      }
    ],
    "fallback": [
      { "urls": "stun:stun.l.google.com:19302" },
      { "urls": "stun:stun1.l.google.com:19302" }
    ],
    "turnAvailable": true,
    "provider": "metered"
  },
  "timestamp": "2024-01-15T10:30:45Z"
}
```

### 2. GET `/api/webrtc/config`
Fetch complete WebRTC configuration

**Request:**
```http
GET /api/webrtc/config
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "config": {
    "iceServers": [...],
    "iceCandidatePoolSize": 10,
    "bundlePolicy": "max-bundle",
    "rtcpMuxPolicy": "require",
    "turnAvailable": true,
    "provider": "metered"
  }
}
```

### 3. GET `/api/webrtc/ice-servers/diagnostics`
Admin endpoint for debugging ICE server configuration

**Request:**
```http
GET /api/webrtc/ice-servers/diagnostics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "diagnostics": {
    "provider": "metered",
    "stunServersCount": 5,
    "turnServersCount": 1,
    "hasTurn": true,
    "turnRefreshNeeded": false,
    "lastRefreshTime": "2024-01-15T10:30:45Z",
    "iceServersCount": 6
  }
}
```

## Frontend Usage

### 1. Getting WebRTC Info
```javascript
import webrtcManager from '@/services/webrtcManager';

// Get WebRTC configuration info
const info = await webrtcManager.getWebRTCInfo();
console.log(info);
// Output: { iceServersCount: 6, hasStun: true, hasTurn: true, activeCalls: 1 }
```

### 2. Connection Health Check
```javascript
// Check health of an active call
const health = webrtcManager.checkConnectionHealth(callId);
console.log(health);
// Output:
// {
//   healthy: true,
//   iceState: 'connected',
//   connectionState: 'connected',
//   errorCount: 0,
//   timestamp: '2024-01-15T10:30:45Z'
// }
```

### 3. Connection Diagnostics
```javascript
// Get detailed diagnostics about a call
const diagnostics = webrtcManager.getConnectionDiagnostics(callId);
console.log(diagnostics);
// Output:
// {
//   callId: '507f1f77bcf86cd799439011',
//   connectionState: 'connected',
//   iceConnectionState: 'connected',
//   iceGatheringState: 'complete',
//   signalingState: 'stable',
//   errorCount: 0,
//   timestamp: '2024-01-15T10:30:45Z'
// }
```

## How It Works

### ICE Server Configuration Flow

1. **Client Calls `fetchIceServers()`**
   - Checks cache (1 hour TTL)
   - If cached, returns cached servers

2. **Cache Miss: Call Backend API**
   - Sends `GET /api/webrtc/ice-servers`
   - Backend returns STUN + TURN configuration

3. **Backend ICE Server Service**
   - Checks configured TURN provider
   - Metered: Returns static API key-based servers
   - Twilio: Generates dynamic JWT credentials
   - Manual: Returns configured TURN server details

4. **Client Uses ICE Servers**
   - Passes servers to RTCPeerConnection
   - WebRTC uses STUN first (fast)
   - Falls back to TURN if STUN fails (reliable)

### TURN Credential Refresh (Twilio Only)

Twilio generates time-limited JWT credentials:

1. **Server**: Periodically (every 30 minutes) checks if credentials expired
2. **If Needed**: Generates new JWT token with 1-hour validity
3. **Next Call**: Client gets fresh credentials from API
4. **Seamless**: Existing calls continue, new calls get fresh tokens

## Troubleshooting

### 1. Calls Failing with Poor Connectivity

**Symptoms:**
- Calls fail on cellular networks
- Works fine on home WiFi
- Frequent disconnections

**Diagnosis:**
```javascript
const diagnostics = webrtcManager.getConnectionDiagnostics(callId);
if (diagnostics.iceConnectionState === 'failed') {
  // TURN server likely not helping, check config
}
```

**Solutions:**
- ✓ Ensure `TURN_PROVIDER` is set in `.env`
- ✓ Verify API key/credentials are correct
- ✓ Check TURN server status in provider dashboard
- ✓ Verify network allows TURN ports (TCP 3478, UDP 3478)

### 2. "ICE connection failed"

**Causes:**
- TURN server credentials invalid or expired
- Network firewall blocking TURN ports
- TURN server unreachable
- Wrong TURN provider configuration

**Fix:**
1. Check backend logs: `npm run dev` in backend directory
2. Verify environment variables: `cat .env | grep TURN`
3. Test TURN server directly (if using manual provider)
4. Check provider dashboard (Metered/Twilio) for service status

### 3. High Latency / Connection Instability

**Symptoms:**
- Audio/video is laggy
- Frequent freezing
- Connection keeps dropping

**Check:**
```javascript
// Get connection stats
const stats = await webrtcManager.getConnectionStats(callId);
console.log('Round-trip time:', stats.connection.currentRoundTripTime);
```

**Solutions:**
- ✓ TURN might be relaying unnecessarily - check ICE candidate types
- ✓ Direct connection (host/srflx candidates) faster than TURN relay
- ✓ Consider changing `WEBRTC_ICE_CANDIDATE_POLICY` in `.env` to prioritize direct connections

### 4. "TURN unavailable" Warning

**Cause:**
- TURN services not configured or unreachable
- System falls back to STUN only (still works but less reliable)

**Check:**
```javascript
const info = await webrtcManager.getWebRTCInfo();
console.log(info.hasTurn); // Should be true if configured
```

**Fix:**
1. Ensure TURN_PROVIDER is set
2. Verify credentials/API keys
3. Check provider service status
4. Compare with diagnostics output from `/api/webrtc/ice-servers/diagnostics`

## Performance Optimization

### ICE Server Caching

- **Default**: 1 hour cache
- **Customize**: Edit `iceServersCacheDuration` in webrtcManager.js

```javascript
// Cache for 2 hours instead of 1
this.iceServersCacheDuration = 2 * 60 * 60 * 1000;
```

### Connection Monitoring

- Low-level: Monitor `iceConnectionState` (ICE protocol level)
- High-level: Monitor `connectionState` (overall connection)

### Bandwidth Optimization

TURN relay adds overhead. To minimize:
1. Prioritize direct connections (set `WEBRTC_ICE_CANDIDATE_POLICY=all`)
2. Only use TURN when necessary (automatic fallback)
3. Consider `bundlePolicy: 'max-bundle'` (already enabled)

## Security Considerations

### ✓ Implemented

- Credentials not logged (TURN username/password)
- Credentials not stored in client (fetched from backend each call)
- JWT tokens auto-expire (Twilio)
- Metered API key refreshed via backend (not exposed to client)
- All API requests require authentication (`Authorization` header)

### ⚠️ Keep in Mind

- TURN credentials transmitted over HTTPS (production)
- Don't commit `.env` file with real credentials to git
- Rotate/regenerate keys periodically (Metered/Twilio)
- Monitor TURN usage in provider dashboard for abuse

## Monitoring

### Backend Monitoring

**ICE Server Service Status:**
```javascript
// In server startup logs, you'll see:
// 🌐 ICE Server Configuration: 
// {
//   "provider": "metered",
//   "stunServersCount": 5,
//   "turnServersCount": 1,
//   "hasTurn": true
// }
```

**Credential Refresh:**
Server logs every 30 minutes:
```
[ICE Server] Checking for refresh...
[ICE Server] Credentials still valid (expires in 45 minutes)
```

### Frontend Monitoring

**Connection Events:**
```javascript
// In browser console, you'll see:
[WebRTC] Call 507f1f77bcf86cd799439011 ICE state: new
[WebRTC] Call 507f1f77bcf86cd799439011: New ICE candidate (srflx, udp)
[WebRTC] Call 507f1f77bcf86cd799439011 ICE state: connected
✓ Call 507f1f77bcf86cd799439011: ICE connection established
```

## Advanced Configuration

### Environment Variables

**WebRTC-specific:**
```bash
# Candidate policy: all | srflx | prflx
WEBRTC_ICE_CANDIDATE_POLICY=all

# Transport policy: all | relay
WEBRTC_ICE_TRANSPORT_POLICY=all
```

**Provider-specific (Metered):**
```bash
TURN_PROVIDER=metered
METERED_API_KEY=your_key
```

**Provider-specific (Twilio):**
```bash
TURN_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=yxxxxxx
```

**Provider-specific (Manual):**
```bash
TURN_PROVIDER=manual
TURN_HOST=turn.example.com
TURN_PORT=3478
TURN_USERNAME=user
TURN_PASSWORD=pass
```

## File Structure

**Backend:**
```
backend/
├── src/
│   ├── services/
│   │   └── iceServerService.js      # ICE server management
│   ├── routes/
│   │   └── webrtc.js                # WebRTC API endpoints
│   └── server.js                    # Updated: Initializes ICE service
└── .env.turn.example                # Configuration template
```

**Frontend:**
```
frontend/
├── src/
│   └── services/
│       └── webrtcManager.js         # Updated: Fetches ICE from API
└── .env.turn.example               # Configuration template (reference)
```

## Testing

### Manual Test

1. **Local Development:**
   ```bash
   # Backend
   cd backend
   cp .env.turn.example .env  # Copy template
   # Edit .env with Metered API key
   npm run dev

   # Frontend (new terminal)
   cd frontend
   npm run dev
   ```

2. **Test Call:**
   - Open two browser windows
   - Call between accounts
   - Disable WiFi on one device (test cellular)
   - Monitor browser console for ICE state changes

3. **Check Diagnostics:**
   ```javascript
   // In browser console
   import webrtcManager from '@/services/webrtcManager'
   await webrtcManager.getWebRTCInfo()
   webrtcManager.getConnectionDiagnostics(callId)
   ```

### Automated Testing

Check API endpoints:
```bash
# Get ICE servers
curl -H "Authorization: Bearer <token>" \
  https://freecall-backend.onrender.com/api/webrtc/ice-servers

# Get diagnostics
curl -H "Authorization: Bearer <token>" \
  https://freecall-backend.onrender.com/api/webrtc/ice-servers/diagnostics
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "TURN not available" | Provider not configured | Set TURN_PROVIDER and credentials |
| Connection fails on mobile | STUN insufficient | TURN should help - check credentials |
| High latency over TURN | Relay overhead | Normal - TURN adds 10-30ms |
| "ICE failed" immediately | Wrong credentials | Verify API key/token not expired |
| Works locally, fails in production | Prod .env not set | Configure TURN_PROVIDER in Render |
| Frequent disconnections | TURN credential expired | Server auto-refreshes (Twilio) |

## Future Improvements

Potential enhancements:
1. **Multiple TURN providers** - Fallback between providers
2. **TURN usage analytics** - Track which calls use TURN vs direct
3. **Custom TURN selection** - Client-side provider preference
4. **WebRTC stats dashboard** - Visual monitoring of connections
5. **Bandwidth limiting** - QoS settings per connection
6. **Network simulation** - Test with poor network conditions

## References

- [WebRTC Basics](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [ICE Candidates](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate)
- [TURN Specification](https://tools.ietf.org/html/rfc5766)
- [Metered.ca Docs](https://metered.ca/docs)
- [Twilio TURN](https://www.twilio.com/docs/stun-turn)
- [Coturn (Self-hosted)](https://github.com/coturn/coturn)

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready
