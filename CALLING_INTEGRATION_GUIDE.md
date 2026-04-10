# Voice & Video Calling - Integration Guide

## 5-Minute Quick Start

### Step 1: Add Calling UI to Your App

```javascript
// src/App.jsx
import { IncomingCallDialog, CallActive } from './components/calls';

function App() {
  return (
    <div>
      {/* Your existing content */}
      <Header />
      <MainContent />

      {/* Add these for calling */}
      <IncomingCallDialog />
      <CallActive />
    </div>
  );
}
```

### Step 2: Add Call Button to User Profile

```javascript
// src/components/UserProfile.jsx
import { useCall } from '../hooks/useCall.js';

function UserProfile({ userId, userName }) {
  const { initiateCall } = useCall();

  const handleVideoCall = async () => {
    try {
      await initiateCall(userId, 'video');
    } catch (error) {
      console.error('Call failed:', error);
    }
  };

  return (
    <div>
      <h2>{userName}</h2>
      <button onClick={handleVideoCall} className="bg-blue-600 text-white px-4 py-2">
        📹 Video Call
      </button>
    </div>
  );
}
```

### Step 3: Test It

1. Open app in two browser tabs
2. Navigate to a user profile
3. Click "Video Call"
4. Check for incoming call dialog in other tab
5. Click "Accept"
6. Call should connect!

---

## 10 Complete Examples

### Example 1: Simple Video Call Button

```javascript
import React from 'react';
import { useCall } from '../hooks/useCall.js';

export function VideoCallButton({ userId, userName }) {
  const { initiateCall, isLoading, error } = useCall();

  const handleCall = async () => {
    try {
      await initiateCall(userId, 'video');
    } catch (err) {
      console.error('Call failed:', err);
    }
  };

  if (error) {
    return <span className="text-red-600">{error}</span>;
  }

  return (
    <button
      onClick={handleCall}
      disabled={isLoading}
      className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {isLoading ? 'Connecting...' : '📹 Video Call'}
    </button>
  );
}
```

### Example 2: Voice Call Button

```javascript
import React from 'react';
import { useCall } from '../hooks/useCall.js';

export function VoiceCallButton({ userId, userName }) {
  const { initiateCall, isLoading } = useCall();

  return (
    <button
      onClick={() => initiateCall(userId, 'audio')}
      disabled={isLoading}
      className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {isLoading ? 'Calling...' : '📞 Voice Call'}
    </button>
  );
}
```

### Example 3: Call History Component

```javascript
import React, { useEffect, useState } from 'react';
import { apiCall } from '../services/api.js';

export function CallHistory() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const data = await apiCall('/api/calls/history');
        setCalls(data);
      } catch (error) {
        console.error('Failed to load call history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-2">
      <h3 className="font-bold">Call History</h3>
      {calls.map((call) => (
        <div key={call._id} className="border p-2 rounded flex justify-between">
          <span>
            {call.type === 'video' ? '📹' : '📞'} {call.callerId.username}
            {call.status === 'missed' && ' (Missed)'}
          </span>
          <span className="text-gray-600">{call.duration}s</span>
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Connection Status Monitor

```javascript
export function ConnectionStatus() {
  const { connectionStatus, getConnectionStats } = useCall();
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const interval = setInterval(async () => {
      const newStats = await getConnectionStats();
      setStats(newStats);
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionStatus, getConnectionStats]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`p-4 rounded ${getStatusColor()}`}>
      <p className="font-bold">{connectionStatus.toUpperCase()}</p>
      {stats?.connection && (
        <p className="text-sm">
          RTT: {(stats.connection.currentRoundTripTime * 1000).toFixed(0)}ms
        </p>
      )}
    </div>
  );
}
```

### Example 5: Peer Status Display

```javascript
export function PeerStatusBar() {
  const { getRemotePeerStatus } = useCall();

  const isMuted = getRemotePeerStatus('isMuted');
  const isCameraOn = getRemotePeerStatus('isCameraOn');

  return (
    <div className="flex gap-2 p-2 bg-gray-100 rounded">
      <div className={`px-2 py-1 rounded text-sm ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-200'}`}>
        {isMuted ? '🔇 Muted' : '🔊 Speaking'}
      </div>
      <div className={`px-2 py-1 rounded text-sm ${!isCameraOn ? 'bg-red-100 text-red-600' : 'bg-gray-200'}`}>
        {isCameraOn ? '📹 Camera On' : '📹 Camera Off'}
      </div>
    </div>
  );
}
```

### Example 6: Custom Call Panel

```javascript
export function CustomCallPanel() {
  const {
    activeCall,
    isMuted,
    isCameraOn,
    toggleMute,
    toggleCamera,
    endCall,
    connectionStatus,
  } = useCall();

  if (!activeCall) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <h3 className="font-bold text-lg mb-4">
        {activeCall.callerName} - {activeCall.type}
      </h3>

      {/* Status */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
          {connectionStatus === 'connected' ? '🟢 Connected' : '🟡 Connecting'}
        </span>
      </div>

      {/* Controls */}
      <div className="space-y-2">
        <button
          onClick={toggleMute}
          className={`w-full py-2 rounded flex items-center justify-center gap-2 ${
            isMuted ? 'bg-red-500 text-white' : 'bg-gray-200'
          }`}
        >
          🎤 {isMuted ? 'Unmute' : 'Mute'}
        </button>

        <button
          onClick={toggleCamera}
          className={`w-full py-2 rounded flex items-center justify-center gap-2 ${
            !isCameraOn ? 'bg-red-500 text-white' : 'bg-gray-200'
          }`}
        >
          📹 {isCameraOn ? 'Camera On' : 'Camera Off'}
        </button>

        <button
          onClick={() => endCall(activeCall._id)}
          className="w-full py-2 rounded bg-red-600 text-white font-bold"
        >
          ✕ End Call
        </button>
      </div>
    </div>
  );
}
```

### Example 7: Call Duration Display

```javascript
export function CallDuration() {
  const { activeCall } = useCall();
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    if (!activeCall?.startTime) return;

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - new Date(activeCall.startTime).getTime()) / 1000);
      setDuration(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall?.startTime]);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div className="text-2xl font-mono font-bold">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
```

### Example 8: Full Screen Call View

```javascript
export function FullScreenCall() {
  const localVideoRef = React.useRef();
  const remoteVideoRef = React.useRef();
  const { localStream, remoteStreams, activeCall } = useCall();

  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  React.useEffect(() => {
    if (remoteVideoRef.current && Object.keys(remoteStreams).length > 0) {
      const remoteStream = Object.values(remoteStreams)[0];
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStreams]);

  return (
    <div className="w-full h-screen bg-black relative">
      {/* Remote video - fullscreen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local video - pip */}
      <div className="absolute bottom-4 right-4 w-48 h-40 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Call name */}
      <div className="absolute top-4 left-4 text-white font-bold text-xl">
        {activeCall?.callerName}
      </div>
    </div>
  );
}
```

### Example 9: Call with Chat Integration

```javascript
export function ConversationWithCall({ conversationId, userId }) {
  const { incomingCall, activeCall, initiateCall } = useCall();

  // User can make call from conversation view
  const handleStartCall = async () => {
    try {
      // Get the other user ID from conversation
      await initiateCall(userId, 'video');
    } catch (error) {
      console.error('Call failed:', error);
    }
  };

  return (
    <div className="flex gap-4">
      {/* Chat area */}
      <div className="flex-1">
        {/* Chat messages */}
        <button onClick={handleStartCall} className="mt-4 bg-blue-600 text-white px-4 py-2">
          📹 Start Video Call
        </button>
      </div>

      {/* Call window */}
      {activeCall && (
        <div className="w-96 bg-gray-900 rounded-lg overflow-hidden">
          <CallActive />
        </div>
      )}

      {/* Incoming call dialog */}
      <IncomingCallDialog />
    </div>
  );
}
```

### Example 10: User Profile with Call

```javascript
export function UserProfile({ userId, userName }) {
  const { initiateCall, isLoading } = useCall();

  const handleVideoCall = async () => {
    try {
      await initiateCall(userId, 'video');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleVoiceCall = async () => {
    try {
      await initiateCall(userId, 'audio');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="max-w-sm rounded-lg shadow-lg overflow-hidden">
      {/* Avatar */}
      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

      {/* Profile info */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{userName}</h2>
        <p className="text-gray-600 mb-6">@{userName.toLowerCase()}</p>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleVoiceCall}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 rounded disabled:opacity-50"
          >
            📞 Call
          </button>
          <button
            onClick={handleVideoCall}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            📹 Video
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Integration Points

### Add to App.jsx
```javascript
import { IncomingCallDialog, CallActive } from './components/calls';

function App() {
  return (
    <div>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>

      {/* Always include these */}
      <IncomingCallDialog />
      <CallActive />
    </div>
  );
}
```

### Add Call Buttons
- User profile pages
- User search results
- Contact lists
- Chat headers
- Any place you want quick access to calling

### Handle Notifications
```javascript
// Optional: React to incoming calls
const { incomingCall } = useCall();

useEffect(() => {
  if (incomingCall) {
    // Maybe notify user with sound
    // Play ringtone
    // Show notification
  }
}, [incomingCall]);
```

---

## Styling Guide

### Tailwind Classes Used

| Component | Classes |
|-----------|---------|
| Buttons | `bg-blue-600`, `hover:bg-blue-700`, `text-white` |
| Video | `w-full h-full object-cover` |
| Badges | `px-3 py-1 rounded-full text-sm bg-green-100` |
| Status | `inline-flex items-center gap-2` |
| Controls | `w-12 h-12 rounded-full`, `hover:scale-110` |

### Custom Styling

```css
/* video-element.css */
video {
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.call-button {
  @apply px-4 py-2 rounded-lg font-semibold 
         transition-colors duration-200;
}

.call-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}
```

---

## Troubleshooting

### Issue: Camera permission denied
**Solution:** User must manually grant permission in browser settings

### Issue: No remote video showing
**Solution:** Check `hasRemoteStream()` and verify remote peer camera is on

### Issue: Disconnects after few seconds
**Solution:** Check internet connection, try reconnecting

### Issue: One-way audio
**Solution:** Check both peers have microphones granted

---

## Next Steps

1. Add to your app (Step 1-3 above)
2. Test with two browser tabs
3. Customize styling as needed
4. Add to your features documentation

For detailed API docs, see `CALLING_SYSTEM.md`
For quick reference, see `CALLING_QUICK_REF.md`

---

**Ready to test?** Open your app and try making a call! 🎉
