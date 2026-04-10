# Voice & Video Calling - Quick Reference Guide

## One-Minute Setup

```javascript
// In your main component
import { useCall } from '../hooks/useCall.js';
import { IncomingCallDialog, CallActive } from '../components/calls';

function App() {
  const { incomingCall, activeCall } = useCall();

  return (
    <>
      <IncomingCallDialog />
      <CallActive />
    </>
  );
}
```

## Hook API

### State
```javascript
const {
  activeCall,        // Current active call object
  incomingCall,      // Incoming call object
  localStream,       // MediaStream for local camera/mic
  remoteStreams,     // { [userId]: MediaStream }
  isMuted,           // Is audio muted
  isCameraOn,        // Is camera on
  connectionStatus,  // 'idle' | 'connecting' | 'connected' | 'failed'
} = useCall();
```

### Actions
```javascript
// Initiate a call (voice)
await initiateCall(userId, 'audio');

// Initiate a call (video)
await initiateCall(userId, 'video');

// Accept incoming call
await acceptCall(incomingCall._id);

// Decline incoming call
declineCall(incomingCall._id, 'Busy');

// End active call
endCall(activeCall._id);
```

### Controls
```javascript
// Toggle mute
toggleMute();

// Toggle camera
toggleCamera();

// Set audio enabled/disabled
setAudioEnabled(true);

// Set video enabled/disabled
setVideoEnabled(false);
```

### Queries
```javascript
// Get remote stream for specific user
const stream = getRemoteStream(userId);

// Get remote stream for active peer
const stream = getRemoteStreamByCall();

// Check if has remote stream
const hasRemote = hasRemoteStream();

// Check if connected
const connected = isConnected();

// Check if connecting
const connecting = isConnecting();

// Get peer's mute status
const isMuted = getRemotePeerStatus('isMuted');

// Get peer's camera status
const isCameraOn = getRemotePeerStatus('isCameraOn');

// Get connection stats
const stats = await getConnectionStats();
```

## Common Patterns

### Pattern 1: Start a Video Call
```javascript
function UserProfile({ userId }) {
  const { initiateCall } = useCall();

  const handleCallClick = async () => {
    try {
      await initiateCall(userId, 'video');
    } catch (error) {
      alert('Failed to start call: ' + error.message);
    }
  };

  return <button onClick={handleCallClick}>📹 Video Call</button>;
}
```

### Pattern 2: Start Voice Call
```javascript
function UserProfile({ userId }) {
  const { initiateCall } = useCall();

  const handleCallClick = async () => {
    try {
      await initiateCall(userId, 'audio');
    } catch (error) {
      alert('Failed to start call: ' + error.message);
    }
  };

  return <button onClick={handleCallClick}>📞 Voice Call</button>;
}
```

### Pattern 3: Show Incoming Call Dialog
```javascript
function App() {
  return (
    <div>
      {/* Shows up when incomingCall is set */}
      <IncomingCallDialog 
        onAccept={() => console.log('Call accepted')}
        onDecline={() => console.log('Call declined')}
      />
    </div>
  );
}
```

### Pattern 4: Display Active Call
```javascript
function App() {
  const { activeCall, connectionStatus } = useCall();

  return (
    <>
      {/* Shows when activeCall is active */}
      {activeCall && <CallActive />}
    </>
  );
}
```

### Pattern 5: Custom Controls
```javascript
function CustomCallPanel() {
  const { isMuted, isCameraOn, toggleMute, toggleCamera, endCall, activeCall } = useCall();

  if (!activeCall) return null;

  return (
    <div className="space-y-4">
      <button onClick={toggleMute} className={isMuted ? 'bg-red-500' : 'bg-gray-500'}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>

      <button onClick={toggleCamera} className={isCameraOn ? 'bg-gray-500' : 'bg-red-500'}>
        {isCameraOn ? 'Camera On' : 'Camera Off'}
      </button>

      <button onClick={() => endCall(activeCall._id)} className="bg-red-600 text-white">
        End Call
      </button>
    </div>
  );
}
```

### Pattern 6: Monitor Connection
```javascript
function ConnectionMonitor() {
  const { connectionStatus, getConnectionStats } = useCall();
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    const interval = setInterval(async () => {
      const newStats = await getConnectionStats();
      setStats(newStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [getConnectionStats]);

  return (
    <div>
      <p>Status: {connectionStatus}</p>
      {stats && (
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      )}
    </div>
  );
}
```

### Pattern 7: Video and Audio Elements
```javascript
function CallWindow() {
  const localVideoRef = React.useRef();
  const remoteVideoRef = React.useRef();

  const { localStream, remoteStreams } = useCall();

  // Set local stream
  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote stream
  React.useEffect(() => {
    if (remoteVideoRef.current && Object.keys(remoteStreams).length > 0) {
      const remoteStream = Object.values(remoteStreams)[0];
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStreams]);

  return (
    <div>
      (video ref={remoteVideoRef} autoPlay playsInline)
      <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 200 }} />
      </div>
    </div>
  );
}
```

### Pattern 8: Call Duration Timer
```javascript
function CallDuration({ startTime }) {
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const seconds = Math.floor((now - startTime) / 1000);
      setDuration(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>;
}
```

### Pattern 9: Peer Status Display
```javascript
function PeerStatus() {
  const { getRemotePeerStatus } = useCall();

  const isMuted = getRemotePeerStatus('isMuted');
  const isCameraOn = getRemotePeerStatus('isCameraOn');

  return (
    <div className="space-x-2">
      {isMuted && <span className="bg-red-500 px-2 py-1 rounded">🔇 Muted</span>}
      {!isCameraOn && <span className="bg-red-500 px-2 py-1 rounded">📹 Camera Off</span>}
    </div>
  );
}
```

### Pattern 10: Permission Check
```javascript
async function requestPermissions() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 }
    });

    // Grant succeeded
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      console.log('Permission denied');
    } else if (error.name === 'NotFoundError') {
      console.log('No camera/mic found');
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}
```

## Socket Events

### Emit (Send)
```javascript
// Initiate call
socket?.emit('initiate_call', { receiverId, type })

// Accept call
socket?.emit('accept_call', { callId })

// Decline call
socket?.emit('decline_call', { callId, reason })

// End call
socket?.emit('end_call', { callId })

// Send WebRTC offer
socket?.emit('webrtc_offer', { callId, offer })

// Send WebRTC answer
socket?.emit('webrtc_answer', { callId, answer })

// Send ICE candidate
socket?.emit('webrtc_ice_candidate', { callId, candidate })

// Toggle mute
socket?.emit('toggle_mute', { callId, isMuted })

// Toggle camera
socket?.emit('toggle_camera', { callId, isCameraOn })

// Update connection status
socket?.emit('connection_status', { callId, status })
```

### Listen (Receive)
```javascript
// Incoming call
socket?.on('incoming_call', (data) => {
  // { callId, callerId, callerName, type, timestamp }
})

// Call accepted
socket?.on('call_accepted', (data) => {
  // { callId, receiverId, receiverName, timestamp }
})

// Call declined
socket?.on('call_declined', (data) => {
  // { callId, reason, timestamp }
})

// Call ended
socket?.on('call_ended', (data) => {
  // { callId, endedBy, duration, timestamp }
})

// WebRTC offer
socket?.on('webrtc_offer', (data) => {
  // { callId, offer, fromUserId, timestamp }
})

// WebRTC answer
socket?.on('webrtc_answer', (data) => {
  // { callId, answer, fromUserId, timestamp }
})

// ICE candidate
socket?.on('webrtc_ice_candidate', (data) => {
  // { callId, candidate, fromUserId }
})

// Peer connection status
socket?.on('peer_connection_status', (data) => {
  // { callId, status, timestamp }
})

// User mute status
socket?.on('user_mute_status', (data) => {
  // { callId, userId, isMuted, timestamp }
})

// User camera status
socket?.on('user_camera_status', (data) => {
  // { callId, userId, isCameraOn, timestamp }
})

// Peer disconnected
socket?.on('peer_disconnected', (data) => {
  // { callId, timestamp }
})

// Call error
socket?.on('call_error', (data) => {
  // { message }
})
```

## WebRTC Manager

```javascript
import webrtcManager from '../services/webrtcManager.js';

// Get local stream
const stream = await webrtcManager.getLocalStream();

// Stop local stream
webrtcManager.stopLocalStream();

// Mute audio
webrtcManager.setAudioEnabled(false);

// Enable audio
webrtcManager.setAudioEnabled(true);

// Disable camera
webrtcManager.setVideoEnabled(false);

// Enable camera
webrtcManager.setVideoEnabled(true);

// Check audio
const isMuted = !webrtcManager.isAudioEnabled();

// Check camera
const isCameraOff = !webrtcManager.isVideoEnabled();

// Create offer
const offer = await webrtcManager.createOffer(callId);

// Create answer
const answer = await webrtcManager.createAnswer(callId, offer);

// Get connection state
const state = webrtcManager.getConnectionState(callId);
// { connectionState, iceConnectionState, iceGatheringState, signalingState }

// Get stats
const stats = await webrtcManager.getConnectionStats(callId);
// { audio, video, connection }

// Close connection
webrtcManager.closePeerConnection(callId);

// Close all
webrtcManager.closeAllPeerConnections();
```

## Error Handling

```javascript
async function safeInitiateCall(userId) {
  try {
    await initiateCall(userId, 'video');
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      // User denied permission
      console.log('Camera/mic permission denied');
    } else if (error.name === 'NotFoundError') {
      // No camera/mic
      console.log('No camera/mic available');
    } else if (error.name === 'OverconstrainedError') {
      // Can't meet constraints, try audio only
      try {
        await initiateCall(userId, 'audio');
      } catch (e) {
        console.error('Audio call failed:', e);
      }
    } else {
      console.error('Error:', error);
    }
  }
}
```

## Component Usage

```javascript
import {
  IncomingCallDialog,
  CallActive,
  CallControls,
  CallStatus,
} from '../components/calls';

function MyApp() {
  return (
    <div>
      {/* Required: Show incoming call dialog */}
      <IncomingCallDialog />

      {/* Required: Show active call window */}
      <CallActive />

      {/* Optional: Custom controls */}
      {/* <CallControls callId="..." /> */}

      {/* Optional: Custom status display */}
      {/* <CallStatus status="connected" /> */}
    </div>
  );
}
```

---

**Need Help?** See `CALLING_SYSTEM.md` for complete documentation.
**Integration Examples?** See `CALLING_INTEGRATION_GUIDE.md` for 10+ examples.
