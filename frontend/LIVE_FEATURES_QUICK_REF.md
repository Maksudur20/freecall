# Live Features API - Quick Reference

## Installation

```bash
# No installation needed - files included in project:
# 1. frontend/src/services/liveFeatures.js
# 2. frontend/src/hooks/useLiveFeatures.js
```

## Basic Usage

### Minimal Setup (in App.jsx)
```jsx
import { useLiveFeatures } from './hooks/useLiveFeatures';

function App() {
  useLiveFeatures({ autoInit: true, userId: user._id });
  return <YourRoutes />;
}
```

### In Components
```jsx
const { sendMessage, startTyping, endTyping } = useLiveFeatures({
  conversationId: 'conv-123',
  userId: 'user-456'
});

// Use the methods
sendMessage('Hello!');
startTyping('John');
endTyping();
```

---

## Main Hook API

### `useLiveFeatures(options)`

**Options:**
```js
{
  autoInit: boolean,           // Auto-initialize on mount (default: true)
  conversationId: string,      // Conversation ID (optional)
  userId: string               // Current user ID (optional)
}
```

**Returns:**
```js
{
  // Typing
  startTyping(username),
  endTyping(),

  // Messages
  sendMessage(content, attachments?),
  editMessage(messageId, content),
  deleteMessage(messageId),
  addReaction(messageId, emoji),
  markAsDelivered(messageId),
  markAsSeen(),

  // Presence
  setStatus('online'|'away'|'offline'),
  getOnlineUsers(),
  emitActivity(),

  // Calls
  initiateCall(targetUserId),
  acceptCall(callId),
  declineCall(callId),
  endCall(callId),
  toggleMute(callId, isMuted),
  toggleCamera(callId, cameraOn),

  // WebRTC
  sendWebRTCOffer(callId, offer),
  sendWebRTCAnswer(callId, answer),
  sendICECandidate(callId, candidate),

  // Utils
  isInitialized(),
  cleanup()
}
```

---

## Specialized Hooks

### `useTypingIndicator(conversationId, userId, username)`
```jsx
const { startTyping, stopTyping } = useTypingIndicator(convId, userId, name);
```

### `usePresence(userId)`
```jsx
const { setOnline, setAway, setOffline, getOnlineUsers, emitActivity } = 
  usePresence(userId);
```

### `useCallFeatures()`
```jsx
const {
  initiateCall,
  acceptCall,
  declineCall,
  endCall,
  toggleMute,
  toggleCamera,
  sendOffer,
  sendAnswer,
  sendICECandidate
} = useCallFeatures();
```

### `useMessageFeatures(conversationId)`
```jsx
const {
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  markAsDelivered,
  markAsSeen
} = useMessageFeatures(conversationId);
```

---

## Real-Time Events Handled

| Event | What It Does |
|-------|--------------|
| **new_message** | Adds message to store |
| **user_typing** | Shows typing indicator (3s auto-clear) |
| **user_stop_typing** | Hides typing indicator |
| **message_seen** | Marks messages as read |
| **message_edited** | Updates message content |
| **message_deleted** | Removes message |
| **reaction_added** | Adds emoji reaction |
| **user_status_changed** | Updates user online status |
| **online_users** | Receives list of online users |
| **incoming_call** | Stores incoming call |
| **call_accepted** | Updates call status |
| **call_declined** | Updates call status |
| **call_ended** | Marks call as ended |
| **webrtc_offer** | WebRTC signaling |
| **webrtc_answer** | WebRTC signaling |
| **webrtc_ice_candidate** | WebRTC signaling |
| **user_mute_status** | User muted/unmuted |
| **user_camera_status** | Camera on/off |
| **new_notification** | Stores notification |

---

## Code Examples

### Chat with Typing
```jsx
const { sendMessage, startTyping, endTyping } = useLiveFeatures({
  conversationId,
  userId
});

const handleChange = debounce(() => startTyping(), 500);
const handleSend = () => {
  endTyping();
  sendMessage(text);
};
```

### User Status
```jsx
const { setOnline, setAway, setOffline } = usePresence(userId);

useEffect(() => {
  setOnline();
  return () => setOffline();
}, []);
```

### Message Reactions
```jsx
const { addReaction } = useMessageFeatures(conversationId);

<button onClick={() => addReaction(msgId, '👍')}>👍</button>
```

### Video Call
```jsx
const { initiateCall, acceptCall, endCall } = useCallFeatures();

<button onClick={() => initiateCall(targetId, convId)}>Call</button>
<button onClick={() => acceptCall(callId)}>Accept</button>
<button onClick={() => endCall(callId)}>End</button>
```

---

## Listener Initialization (Auto)

✅ **Automatically setup on `useLiveFeatures()`:**
- Socket.IO events listeners
- Store subscriptions
- Timer cleanup

❌ **Do NOT manually call:**
- `initializeAllListeners()` - already called via hook
- Listener setup/teardown - handled automatically

---

## Store Integration

Required store methods:

**chatStore:**
- `addMessage(convId, msg)`
- `updateMessageStatus(msgId, status)`
- `updateMessage(msgId, data)`
- `deleteMessage(msgId)`
- `setTypingUsers(convId, userId, name, isTyping)`
- `addReaction(msgId, emoji, userId)`
- `updateMessagesSeen(convId, userId)`

**userStore:**
- `updateUserStatus(userId, status)`
- `setOnlineUsers(users)`

---

## WebRTC Event Listening

```jsx
// Inside your call component
useEffect(() => {
  const handleOffer = ({ detail }) => {
    const { callId, offer } = detail;
    // Handle offer...
  };

  window.addEventListener('webrtc:offer', handleOffer);
  return () => window.removeEventListener('webrtc:offer', handleOffer);
}, []);
```

**Available events:**
- `webrtc:offer` - Receive offer
- `webrtc:answer` - Receive answer
- `webrtc:ice` - Receive ICE candidate
- `call:mute` - User muted/unmuted
- `call:camera` - User camera on/off

---

## Common Patterns

### Auto-end typing on send
```jsx
const handle Send = () => {
  endTyping();
  sendMessage(text);
};
```

### Debounce typing
```jsx
const handleChange = useCallback(
  debounce(() => startTyping(), 500),
  []
);
```

### Auto-cleanup on unmount
```jsx
useEffect(() => {
  return () => {
    endTyping();
    setStatus('offline');
  };
}, []);
```

### Batch reactions
```jsx
const emojis = ['👍', '❤️', '😂', '🔥'];
emojis.forEach(e => addReaction(msgId, e));
```

---

## Debugging

### Check initialization
```jsx
const { isInitialized } = useLiveFeatures();
console.log('Live features initialized:', isInitialized());
```

### Check Socket.IO
```js
import { getSocket } from './services/socket';
const socket = getSocket();
console.log('Connected:', socket?.connected);
```

### Monitor events
```js
// Add to socket.js for debugging
socketChat.onNewMessage((data) => {
  console.log('📨 Message:', data);
});
```

---

## Performance Tips

1. **Use debounce for typing:**
   ```js
   const debounce = (fn, ms) => {
     let timeout;
     return () => {
       clearTimeout(timeout);
       timeout = setTimeout(fn, ms);
     };
   };
   ```

2. **Memoize components:**
   ```jsx
   export const MessageItem = memo(({ msg }) => ...);
   ```

3. **Clean up listeners:**
   ```jsx
   useEffect(() => {
     return () => endTyping();
   }, []);
   ```

4. **Avoid re-renders:**
   ```jsx
   const typingUsers = useChatStore(
     state => state.typingUsers
   ); // Only re-render when typing changes
   ```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Typing not showing | Check store has `typingUsers`, ensure `endTyping()` called |
| Messages not syncing | Verify Socket.IO connected, check store methods exist |
| Calls failing | Check STUN/TURN config, browser permissions |
| Memory leak | Call `cleanup()` on unmount, clear timers |
| Reactions not working | Ensure `addReaction()` method in store |

---

## API Cheat Sheet

```jsx
// Setup
useLiveFeatures({ autoInit: true, userId, conversationId })

// Messages
sendMessage(content, attachments)
editMessage(messageId, content)
deleteMessage(messageId)
addReaction(messageId, emoji)
markAsDelivered(messageId)
markAsSeen()

// Typing
startTyping(username)
endTyping()

// Status
setStatus('online' | 'away' | 'offline')
getOnlineUsers()
emitActivity()

// Calls  
initiateCall(targetUserId)
acceptCall(callId)
declineCall(callId)
endCall(callId)
toggleMute(callId, isMuted)
toggleCamera(callId, cameraOn)

// WebRTC
sendWebRTCOffer(callId, offer)
sendWebRTCAnswer(callId, answer)
sendICECandidate(callId, candidate)

// Utils
isInitialized()
cleanup()
```

---

## Links

- **Full Docs:** [LIVE_FEATURES.md](./LIVE_FEATURES.md)
- **Integration Guide:** [LIVE_FEATURES_INTEGRATION.md](./LIVE_FEATURES_INTEGRATION.md)
- **Examples:** [src/components/examples/LiveFeaturesExamples.jsx](./src/components/examples/LiveFeaturesExamples.jsx)
- **Service:** [src/services/liveFeatures.js](./src/services/liveFeatures.js)
- **Hook:** [src/hooks/useLiveFeatures.js](./src/hooks/useLiveFeatures.js)
