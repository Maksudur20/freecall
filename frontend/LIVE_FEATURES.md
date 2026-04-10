# Live Features Service & Hooks Documentation

## Overview

The **Live Features Service** provides real-time chat capabilities including:
- Typing indicators
- Message delivery & read receipts
- Message operations (edit, delete, reactions)
- User presence/status
- Video/audio call management
- WebRTC signaling
- Notifications

The service integrates with your existing Socket.IO infrastructure and Zustand stores, providing both a service layer and convenient React hooks.

## Architecture

```
┌─────────────────────────────────────┐
│     React Components                │
└──────────────┬──────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────┐
│  useLiveFeatures Hook               │
│  - useLiveFeatures                  │
│  - useTypingIndicator               │
│  - usePresence                      │
│  - useCallFeatures                  │
│  - useMessageFeatures               │
└──────────────┬──────────────────────┘
               │ calls
               ▼
┌─────────────────────────────────────┐
│  LiveFeaturesService (Singleton)    │
│  - Chat listeners                   │
│  - Presence listeners               │
│  - Call listeners                   │
│  - Notification listeners           │
└──────────────┬──────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────┐
│  Socket.IO Service                  │
│  - socketChat                       │
│  - socketPresence                   │
│  - socketCall                       │
│  - socketNotification               │
└──────────────┬──────────────────────┘
               │ emits/listens
               ▼
┌─────────────────────────────────────┐
│  Socket.IO Server                   │
└─────────────────────────────────────┘
```

## Quick Start

### 1. Initialize in App.jsx

```jsx
import { useLiveFeatures } from './hooks/useLiveFeatures';
import { useUserStore } from './store/userStore';

function App() {
  const { currentUser } = useUserStore();

  // Initialize all live features once
  useLiveFeatures({
    autoInit: true,
    userId: currentUser?._id,
  });

  return (
    // Your app content
  );
}
```

### 2. Use in Chat Component

```jsx
import { useLiveFeatures } from './hooks/useLiveFeatures';
import { useChatStore } from './store/chatStore';

function ChatWindow({ conversationId }) {
  const { currentUser } = useUserStore();
  const { typingUsers } = useChatStore();

  const { sendMessage, startTyping, endTyping } = useLiveFeatures({
    conversationId,
    userId: currentUser?._id,
  });

  const handleSendMessage = (content) => {
    sendMessage(content);
  };

  const handleTyping = () => {
    startTyping(currentUser.name);
  };

  return (
    <div>
      <MessageList />
      <TypingIndicator typingUsers={typingUsers} />
      <InputBox onSend={handleSendMessage} onType={handleTyping} />
    </div>
  );
}
```

## Service API

### Main Hook: `useLiveFeatures`

**Initialize all features with auto-join:**
```jsx
const features = useLiveFeatures({
  autoInit: true,
  conversationId: 'conv-123',
  userId: 'user-456'
});
```

#### Available Methods

**Typing Indicators:**
```jsx
features.startTyping('John');        // Emit typing indicator
features.endTyping();                // Stop typing indicator
```

**Messages:**
```jsx
features.sendMessage('Hello world', []);     // Send message
features.editMessage('msg-123', 'Updated');  // Edit message
features.deleteMessage('msg-123');            // Delete message
features.addReaction('msg-123', '👍');       // Add emoji reaction
features.markAsDelivered('msg-123');         // Confirm delivery
features.markAsSeen();                       // Mark conversation as seen
```

**Presence:**
```jsx
features.setStatus('online');    // Set to online
features.setStatus('away');      // Set to away
features.setStatus('offline');   // Set to offline
features.getOnlineUsers();       // Request online users list
features.emitActivity();         // Broadcast user activity
```

**Calls:**
```jsx
features.initiateCall('user-456');     // Start a call
features.acceptCall('call-123');       // Accept incoming call
features.declineCall('call-123');      // Decline call
features.endCall('call-123');          // End call
features.toggleMute('call-123', true); // Mute audio
features.toggleCamera('call-123', false); // Turn off camera
```

**WebRTC Signaling:**
```jsx
features.sendWebRTCOffer('call-123', offerObject);
features.sendWebRTCAnswer('call-123', answerObject);
features.sendICECandidate('call-123', candidateObject);
```

**Utilities:**
```jsx
features.isInitialized();   // Check if initialized
features.cleanup();         // Clean up all listeners
```

---

### Specialized Hooks

#### 1. `useTypingIndicator`

Use only typing features:
```jsx
import { useTypingIndicator } from './hooks/useLiveFeatures';

function MessageInput({ conversationId, userId, username }) {
  const { startTyping, stopTyping } = useTypingIndicator(
    conversationId,
    userId,
    username
  );

  return (
    <input
      onFocus={startTyping}
      onBlur={stopTyping}
    />
  );
}
```

#### 2. `usePresence`

Use only presence features:
```jsx
import { usePresence } from './hooks/useLiveFeatures';

function UserStatus({ userId }) {
  const { setOnline, setAway, setOffline, getOnlineUsers } = 
    usePresence(userId);

  useEffect(() => {
    setOnline();
    return () => setOffline();
  }, []);

  return (
    <button onClick={getOnlineUsers}>
      Show Online Users
    </button>
  );
}
```

#### 3. `useCallFeatures`

Use only call features:
```jsx
import { useCallFeatures } from './hooks/useLiveFeatures';

function CallControls({ callId, targetUserId, conversationId }) {
  const {
    initiateCall,
    acceptCall,
    toggleMute,
    toggleCamera
  } = useCallFeatures();

  return (
    <div>
      <button onClick={() => initiateCall(targetUserId, conversationId)}>
        Call
      </button>
      <button onClick={() => acceptCall(callId)}>
        Accept
      </button>
      <button onClick={() => toggleMute(callId, false)}>
        Mute
      </button>
      <button onClick={() => toggleCamera(callId, true)}>
        Camera
      </button>
    </div>
  );
}
```

#### 4. `useMessageFeatures`

Use only message features:
```jsx
import { useMessageFeatures } from './hooks/useLiveFeatures';

function ChatMessages({ conversationId }) {
  const {
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction
  } = useMessageFeatures(conversationId);

  return (
    <div>
      <MessageList
        onEdit={editMessage}
        onDelete={deleteMessage}
        onReact={addReaction}
      />
    </div>
  );
}
```

---

## Service Methods (Direct Usage)

If you need to use the service directly (not recommended for most cases):

```jsx
import liveFeatures from './services/liveFeatures';

// Initialize
liveFeatures.initializeAllListeners();

// Use methods
liveFeatures.emitTyping(conversationId, userId, username);
liveFeatures.sendMessage(conversationId, 'Hello');
liveFeatures.acceptCall(callId);

// Cleanup
liveFeatures.cleanupAllListeners();
```

---

## Event Handling

The service automatically listens to Socket.IO events and updates your stores. Here's what each listener does:

### Chat Events

| Event | Action |
|-------|--------|
| `new_message` | Adds message to store |
| `user_typing` | Updates typing users with 3s cleanup |
| `user_stop_typing` | Removes from typing users |
| `message_seen` | Marks messages as seen |
| `message_edited` | Updates message content |
| `message_deleted` | Removes message from store |
| `reaction_added` | Adds emoji reaction to message |

### Presence Events

| Event | Action |
|-------|--------|
| `user_status_changed` | Updates user status (online/away/offline) |
| `online_users` | Updates list of online users |

### Call Events

| Event | Action |
|-------|--------|
| `incoming_call` | Stores incoming call |
| `call_accepted` | Updates call status |
| `call_declined` | Updates call status with decliner info |
| `call_ended` | Marks call as ended |
| `webrtc_offer` | Dispatches custom event for WebRTC handling |
| `webrtc_answer` | Dispatches custom event for WebRTC handling |
| `webrtc_ice_candidate` | Dispatches custom event for ICE candidates |
| `user_mute_status` | Dispatches mute status change |
| `user_camera_status` | Dispatches camera status change |

### Notification Events

| Event | Action |
|-------|--------|
| `new_notification` | Adds to notification store |

---

## Real-World Examples

### Example 1: Chat with Typing Indicator

```jsx
function ChatWindow() {
  const { conversationId } = useParams();
  const { currentUser } = useUserStore();
  const { messages, typingUsers } = useChatStore();

  const { sendMessage, startTyping, endTyping, markAsSeen } = 
    useLiveFeatures({
      conversationId,
      userId: currentUser._id,
    });

  useEffect(() => {
    markAsSeen(); // Mark as seen when opening
  }, [conversationId]);

  const handleInputChange = () => {
    startTyping(currentUser.name);
  };

  const handleSendMessage = (content) => {
    endTyping();
    sendMessage(content);
  };

  return (
    <div>
      <MessageList messages={messages} />
      
      {Object.keys(typingUsers).length > 0 && (
        <p>{Object.values(typingUsers).join(', ')} are typing...</p>
      )}

      <MessageInput
        onType={handleInputChange}
        onSend={handleSendMessage}
        onBlur={endTyping}
      />
    </div>
  );
}
```

### Example 2: Video Call

```jsx
function VideoCall({ callId, targetUserId }) {
  const { conversationId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    acceptCall,
    endCall,
    toggleMute,
    toggleCamera,
    sendOffer,
    sendAnswer,
    sendICECandidate
  } = useCallFeatures();

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    // WebRTC setup
    const peerConnection = new RTCPeerConnection();

    // Handle WebRTC events
    window.addEventListener('webrtc:offer', ({ detail }) => {
      if (detail.callId === callId) {
        peerConnection.setRemoteDescription(
          new RTCSessionDescription(detail.offer)
        );
        peerConnection.createAnswer().then(answer => {
          peerConnection.setLocalDescription(answer);
          sendAnswer(callId, answer);
        });
      }
    });

    window.addEventListener('webrtc:ice', ({ detail }) => {
      if (detail.callId === callId) {
        peerConnection.addIceCandidate(detail.candidate);
      }
    });

    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendICECandidate(callId, candidate);
      }
    };

    return () => {
      peerConnection.close();
    };
  }, [callId]);

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />

      <button onClick={() => {
        setIsMuted(!isMuted);
        toggleMute(callId, !isMuted);
      }}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>

      <button onClick={() => {
        setCameraOn(!cameraOn);
        toggleCamera(callId, !cameraOn);
      }}>
        {cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
      </button>

      <button onClick={() => endCall(callId)}>
        End Call
      </button>
    </div>
  );
}
```

### Example 3: User Presence

```jsx
function UserList() {
  const { onlineUsers } = useUserStore();
  const { setOnline, getOnlineUsers } = usePresence(
    useUserStore().currentUser._id
  );

  useEffect(() => {
    setOnline();
    getOnlineUsers();

    const interval = setInterval(() => {
      getOnlineUsers();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h3>Online Users ({onlineUsers.length})</h3>
      <ul>
        {onlineUsers.map(user => (
          <li key={user._id}>
            <span className="online-indicator"></span>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Store Integration

The service updates the following store methods when events are received:

**chatStore:**
- `addMessage(conversationId, message)`
- `updateMessageStatus(messageId, status)`
- `updateMessagesSeen(conversationId, userId)`
- `updateMessage(messageId, data)`
- `deleteMessage(messageId)`
- `addReaction(messageId, reaction, userId)`
- `setTypingUsers(conversationId, userId, username, isTyping)`
- `updateConversationMessagePreview(conversationId, message)`
- `addIncomingCall(callData)`
- `updateCallStatus(callId, status, data)`

**userStore:**
- `updateUserStatus(userId, status)`
- `setOnlineUsers(onlineUsers)`

**notificationStore:**
- `addNotification(notification)`

Make sure your stores have these methods implemented!

---

## Troubleshooting

### Typing indicator not showing?
- Ensure `startTyping()` and `endTyping()` are called properly
- Check that store has `typingUsers` property
- Verify Socket.IO is connected

### Messages not arriving?
- Check Socket.IO connection status
- Verify `currentConversation` is set in store
- Ensure `addMessage()` is implemented in store

### Calls not working?
- Check WebRTC configuration
- Verify STUN/TURN servers are configured
- Check browser permissions for camera/microphone

### Performance issues?
- Reduce typing indicator timeout if needed
- Consider cleanup on component unmount
- Monitor active listeners with `isInitialized()`

---

## Best Practices

1. **Initialize once** - Initialize live features at app root, not per component
2. **Use specialized hooks** - Choose specific hooks rather than the general one
3. **Handle errors** - Always wrap API calls in try-catch
4. **Cleanup** - Leave conversations when navigating away
5. **Debounce typing** - Consider debouncing typing indicators
6. **WebRTC setup** - Set up peer connections before receiving offers
7. **Monitor memory** - Clean up timers and listeners on unmount

---

## API Reference

### LiveFeaturesService Methods

```typescript
// Initialization
initializeAllListeners(): void
initializeChatListeners(): void
initializePresenceListeners(): void
initializeCallListeners(): void
initializeNotificationListeners(): void

// Conversation management
joinConversation(conversationId: string, userId: string): void
leaveConversation(conversationId: string, userId: string): void

// Chat
emitTyping(conversationId: string, userId: string, username: string): void
stopTyping(conversationId: string, userId: string): void
sendMessage(conversationId: string, content: string, attachments?: Array): Promise<void>
editMessage(messageId: string, content: string): void
deleteMessage(messageId: string): void
addReaction(messageId: string, reaction: string): void
confirmMessageDelivery(messageId: string): void
confirmMessageSeen(conversationId: string, userId: string): void

// Presence
setUserStatus(userId: string, status: 'online'|'away'|'offline'): void
requestOnlineUsers(): void
emitActivity(userId: string): void

// Calls
initiateCall(targetUserId: string, conversationId: string): void
acceptCall(callId: string): void
declineCall(callId: string): void
endCall(callId: string): void
toggleMute(callId: string, isMuted: boolean): void
toggleCamera(callId: string, cameraOn: boolean): void

// WebRTC
sendWebRTCOffer(callId: string, offer: RTCSessionDescription): void
sendWebRTCAnswer(callId: string, answer: RTCSessionDescription): void
sendICECandidate(callId: string, candidate: RTCIceCandidate): void

// Cleanup
cleanupAllListeners(): void
isInitialized(feature?: string): boolean
```

---

## Support

For issues or questions:
1. Check Zustand store methods are implemented
2. Verify Socket.IO connection
3. Check browser console for errors
4. Review WebRTC configuration for call features
