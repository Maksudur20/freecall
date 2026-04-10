
# Voice & Video Calling System - Complete Documentation

## Overview

FreeCall's calling system provides **peer-to-peer WebRTC-based voice and video calling** with:
- **Real-time communication** via WebRTC for low-latency audio/video
- **Socket.io signaling** for call initiation and negotiation
- **Google STUN servers** for NAT traversal
- **Full call controls** (mute, camera toggle, end call)
- **Connection status** tracking with real-time updates
- **Automatic ICE candidate** exchange
- **Call history** tracking with duration and status

## Architecture

### Backend Components

#### 1. **callService.js** (Service Layer)
Handles all call business logic and database operations.

**Key Methods:**
```javascript
CallService.createCall(callerId, receiverId, type, conversationId)
CallService.acceptCall(callId)
CallService.declineCall(callId, reason)
CallService.endCall(callId)
CallService.markCallAsMissed(callId)
CallService.getCallHistory(userId, limit, skip)
CallService.getCallHistoryWithUser(userId, otherUserId)
CallService.getCallStats(userId)
CallService.createIncomingCallNotification(userId, callerId, callId)
CallService.createMissedCallNotification(userId, callerId, callId)
CallService.cleanupStaleCalls()
```

#### 2. **call.js** (Socket Handler)
Manages WebRTC signaling and real-time call events.

**Socket Events (Received):**
- `initiate_call` - Start a new call
- `accept_call` - Accept incoming call
- `decline_call` - Reject incoming call
- `end_call` - Terminate active call
- `connection_status` - Update connection status
- `webrtc_offer` - WebRTC offer for P2P connection
- `webrtc_answer` - WebRTC answer response
- `webrtc_ice_candidate` - ICE candidate for NAT traversal
- `toggle_mute` - Mute/unmute audio
- `toggle_camera` - Turn camera on/off
- `call_missed` - Mark call as missed

**Socket Events (Emitted):**
- `incoming_call` - Notify receiver of incoming call
- `call_initiated` - Confirm call creation to caller
- `call_accepted` - Notify caller that call was accepted
- `call_declined` - Notify caller that call was rejected
- `call_ended` - Notify when call ends
- `start_webrtc_negotiation` - Signal to start P2P negotiation
- `peer_connection_status` - Update connection state
- `user_mute_status` - Broadcast mute status change
- `user_camera_status` - Broadcast camera status change
- `peer_disconnected` - Notify when peer disconnects
- `call_error` - Send error messages

### Frontend Components

#### 1. **webrtcManager.js** (WebRTC Manager)
Manages WebRTC peer connections and media streams.

**Key Methods:**
```javascript
webrtcManager.getLocalStream(constraints)
webrtcManager.stopLocalStream()
webrtcManager.setAudioEnabled(enabled)
webrtcManager.setVideoEnabled(enabled)
webrtcManager.isAudioEnabled()
webrtcManager.isVideoEnabled()
webrtcManager.getOrCreatePeerConnection(callId, initiator)
webrtcManager.createOffer(callId)
webrtcManager.createAnswer(callId, offer)
webrtcManager.setRemoteDescription(callId, description)
webrtcManager.addIceCandidate(callId, candidate)
webrtcManager.getConnectionState(callId)
webrtcManager.getConnectionStats(callId)
webrtcManager.closePeerConnection(callId)
webrtcManager.closeAllPeerConnections()
```

**Configuration:**
- Default media constraints: 1280x720 video + audio
- STUN servers: Google's STUN servers for NAT traversal
- ICE gathering: Automatic with event listeners

#### 2. **callStore.js** (Zustand Store)
Manages global call state.

**State:**
```javascript
{
  activeCall: Call | null
  incomingCall: Call | null
  calls: Call[]
  localStream: MediaStream | null
  remoteStreams: { [userId]: MediaStream }
  isMuted: boolean
  isCameraOn: boolean
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed'
  peerStatuses: { [userId]: { isMuted, isCameraOn } }
}
```

**Key Actions:**
```javascript
store.initiateCall(receiverId, type)
store.acceptCall(callId)
store.declineCall(callId, reason)
store.endCall(callId)
store.toggleMute()
store.toggleCamera()
store.setAudioEnabled(enabled)
store.setVideoEnabled(enabled)
store.updateConnectionStatus(status)
store.addRemoteStream(userId, stream)
store.removeRemoteStream(userId)
store.cleanup()
```

#### 3. **useCall.js** (React Hook)
Easy-to-use React hook for components.

```javascript
const {
  activeCall,
  incomingCall,
  localStream,
  remoteStreams,
  isMuted,
  isCameraOn,
  connectionStatus,
  initiateCall,
  acceptCall,
  declineCall,
  endCall,
  toggleMute,
  toggleCamera,
  getRemoteStreamByCall(),
  hasRemoteStream(),
  isConnected(),
  getConnectionStats(),
  // ... many more
} = useCall();
```

#### 4. **Call UI Components**

##### IncomingCallDialog.jsx
- Displays incoming call notification
- Shows caller name and call type
- Accept/Decline buttons
- Ringing animated indicator

##### CallActive.jsx
- Main call window component
- Displays local video (PiP) and remote video (fullscreen)
- Call duration timer
- Connection status indicator
- Integrated call controls

##### CallControls.jsx
- Mute/unmute button
- Camera toggle button
- End call button
- Visual indicators for active controls

##### CallStatus.jsx
- Shows connection status with icons
- Displays latency/RTT if available
- Status states: connecting, connected, failed, ringing

## Call Flow

### Initiating a Call

```
Caller                         Signaling Server                   Receiver
  |                                  |                                |
  |------ initiateCall(2.0) -------->|                                |
  |                                  |------ incoming_call(2.0) ----->|
  |                                  |                                |
  |                  [Call record created]                            |
  |                                  |                                |
  |                           [Notification sent]                    |
  |                                  |<---- acceptCall(2.0) ---------|
  |                                  |                                |
  |<----- start_webrtc_negotiation --|                                |
  |                           [status: answered]                     |
```

### WebRTC Offer/Answer Exchange

```
Caller (Initiator)                    Receiver (Answerer)
  |                                          |
  |--- createOffer() --->|                   |
  |                      |                   |
  |--- setLocalDesc() -->|                   |
  |                      |-- send via Socket |
  |                      |<-- webrtc_offer --|
  |                      |                   |
  |<-- webrtc_offer  ----|                   |
  |                      |                   |
  |-- setRemoteDesc() -->|                   |
  |                      |                   |
  |-- createAnswer() --  |-- answer ready -->|
  |      (Receiver)      |                   |
  |                      |-- send via Socket |
  |<-- webrtc_answer ----|<-- answer sent ---|
  |                      |                   |
  |-- setRemoteDesc() -->|                   |
  |                      |                   |
  |-- ICE Candidates exchanged via Socket ---|
  |                      |                   |
  |======== Peer Connection Established ====|
```

### Media Controls

**Mute/Unmute:**
```javascript
// Caller toggles mute
toggleMute()
  → webrtcManager.setAudioEnabled(!isMuted)
  → emit 'toggle_mute' via socket
  → broadcast to receiver via 'user_mute_status'
```

**Camera Toggle:**
```javascript
// Caller toggles camera
toggleCamera()
  → webrtcManager.setVideoEnabled(!isCameraOn)
  → emit 'toggle_camera' via socket
  → broadcast to receiver via 'user_camera_status'
```

### Connection Status Updates

```
Peer Connection States:
  - 'new' → 'connecting' → 'connected' → 'disconnected'
  - Connection failures → 'failed'
  - ICE gathering → 'checking' → 'connected'

Updates sent via 'connection_status' event to peer
```

## Call Model

```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,
  callerId: ObjectId,           // ref: User
  receiverId: ObjectId,         // ref: User
  type: 'audio' | 'video',
  status: 'initiated' | 'ringing' | 'answered' | 'declined' | 'missed' | 'ended',
  startTime: Date,
  endTime: Date,
  duration: Number,             // in seconds
  missedReason: String,
  declinedReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

## WebRTC Configuration

**STUN Servers (for NAT Traversal):**
```javascript
const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302'
];

// Used in RTCPeerConnection config
const config = {
  iceServers: STUN_SERVERS.map(url => ({ urls: url }))
};
```

**Media Constraints:**
```javascript
{
  audio: true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  }
}
```

## Error Handling

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `NotAllowedError` | User denied camera/mic permission | Ask user to allow permissions |
| `NotFoundError` | No camera/mic available | Check device has hardware |
| `NotReadableError` | Device in use by another app | Close other apps using device |
| `OverconstrainedError` | Device can't meet constraints | Relax media constraints |
| `ConnectionError` | Network connection failed | Check internet connectivity |
| `SignalingError` | Socket.io disconnected | Reconnect socket |

## Performance Considerations

- **Audio Codec:** Uses browser default (usually Opus)
- **Video Codec:** Uses browser default (VP8/VP9, H264)
- **Bandwidth:** Adapts automatically via REMB (Receiver Estimated Maximum Bitrate)
- **CPU Load:** Automatic quality adjustment based on CPU usage
- **Latency:** Typical RTT 20-150ms depending on network

## Security

- **Authentication:** Socket.io authentication via JWT
- **Encryption:** DTLS (via WebRTC's built-in encryption)
- **Privacy:** P2P connection - signaling server never sees media
- **Permissions:** Explicit user consent for camera/microphone

## Testing

### Manual Testing
```javascript
// Test establishing call
1. User A initiates call to User B
2. Check incoming_call event received by User B
3. User B accepts call
4. Check WebRTC negotiation starts
5. Check both users see each other (or hear if audio-only)
6. User A toggles mute
7. Check User B sees mute status
8. User A toggles camera
9. Check User B sees camera status
10. User A ends call
11. Check call_ended event and cleanup
```

### Browser DevTools
```javascript
// View WebRTC stats
chrome://webrtc-internals/

// View connection state
console.log(webrtcManager.getConnectionState(callId));

// Get performance stats
const stats = await webrtcManager.getConnectionStats(callId);
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Audio Call | ✓ | ✓ | ✓ | ✓ |
| Video Call | ✓ | ✓ | ✓ | ✓ |
| STUN/ICE | ✓ | ✓ | ✓ | ✓ |
| Screen Share | ✓ | ✓ | ✓ | ✓ |

## Future Enhancements

- Screen sharing via `getDisplayMedia()`
- Call recording
- TURN server support for strict NAT
- Simulcast for better video quality
- Bandwidth management
- Call queue/hold functionality
- Conference calling (multi-party)
- Codec selection UI

## Troubleshooting

**Peer doesn't see video?**
- Check camera permissions granted
- Check `isCameraOn` state is true
- Check peer has received camera_status event
- Check remote stream is set on video element

**No audio?**
- Check microphone permissions granted
- Check `isMuted` state is false
- Check device has audio input
- Check browser volume isn't muted

**Connection dropped?**
- Check internet connection
- Check firewall doesn't block WebRTC
- Check STUN server is accessible
- Try reconnecting (auto-retry enabled)

**One-way audio/video?**
- Check both peers media permissions
- Check both sent offer and answer
- Check ICE candidates were exchanged
- Check RTCPeerConnection state

## API Reference

See `CALLING_QUICK_REF.md` for quick API reference.
See `CALLING_INTEGRATION_GUIDE.md` for integration examples.

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** April 2026
