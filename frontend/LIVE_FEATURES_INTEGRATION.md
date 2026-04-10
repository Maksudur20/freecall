# Live Features Service - Integration Guide

## Quick Integration (5 minutes)

### Step 1: Update your App.jsx

Add this to your main App component to initialize live features once:

```jsx
// App.jsx
import { useEffect } from 'react';
import { useLiveFeatures } from './hooks/useLiveFeatures';
import { useUserStore } from './store/userStore';

function App() {
  const { currentUser } = useUserStore();

  // Initialize live features once when app loads
  useLiveFeatures({
    autoInit: true,
    userId: currentUser?._id,
  });

  return (
    // Your existing routes and layout
    <Routes>
      {/* Your routes */}
    </Routes>
  );
}

export default App;
```

### Step 2: Update Chat Component

Replace your existing chat component usage with the live version:

```jsx
// ChatWindow.jsx
import { useParams } from 'react-router-dom';
import { useLiveFeatures } from '../hooks/useLiveFeatures';
import { useChatStore } from '../store/chatStore';
import { useUserStore } from '../store/userStore';

export function ChatWindow() {
  const { conversationId } = useParams();
  const { currentUser } = useUserStore();
  const { messages, typingUsers } = useChatStore();

  // Use live features for this conversation
  const { sendMessage, startTyping, endTyping, markAsSeen, deleteMessage, editMessage, addReaction } =
    useLiveFeatures({
      conversationId,
      userId: currentUser?._id,
    });

  return (
    <div className="chat-window">
      {/* Your existing UI */}
    </div>
  );
}
```

### Step 3: Verify Store Methods

Make sure your `chatStore.js` and `userStore.js` have these required methods:

**chatStore.js** should have:
```js
export const useChatStore = create((set) => ({
  // ... existing state

  // Add these methods:
  addMessage: (conversationId, message) => set(state => ({
    messages: { ...state.messages, [conversationId]: [...(state.messages[conversationId] || []), message] }
  })),

  updateMessageStatus: (messageId, status) => set(state => ({
    // Update message status
  })),

  updateMessage: (messageId, data) => set(state => ({
    // Update message content
  })),

  deleteMessage: (messageId) => set(state => ({
    // Remove message
  })),

  setTypingUsers: (conversationId, userId, username, isTyping) => set(state => ({
    typingUsers: {
      ...state.typingUsers,
      [conversationId]: isTyping ? { userId, username } : null
    }
  })),

  editMessage: (messageId, content) => set(state => ({
    // Update message
  })),

  addReaction: (messageId, reaction, userId) => set(state => ({
    // Add reaction
  })),

  updateMessagesSeen: (conversationId, userId) => set(state => ({
    // Mark as seen
  })),

  // For calls:
  addIncomingCall: (callData) => set(state => ({
    // Add call
  })),

  updateCallStatus: (callId, status, data) => set(state => ({
    // Update call status
  })),

  updateConversationMessagePreview: (conversationId, message) => set(state => ({
    // Update conversation preview
  })),
}));
```

**userStore.js** should have:
```js
export const useUserStore = create((set) => ({
  // ... existing state

  // Add these methods:
  updateUserStatus: (userId, status) => set(state => ({
    // Update user status: 'online', 'away', 'offline'
  })),

  setOnlineUsers: (onlineUsers) => set({
    onlineUsers: onlineUsers
  }),
}));
```

---

## Feature-by-Feature Integration

### Adding Typing Indicator

```jsx
import { useState, useRef } from 'react';
import { useTypingIndicator } from '../hooks/useLiveFeatures';

function MessageInput({ conversationId, userId, username }) {
  const [value, setValue] = useState('');
  const typingTimeoutRef = useRef(null);
  const { startTyping, stopTyping } = useTypingIndicator(
    conversationId,
    userId,
    username
  );

  const handleChange = (e) => {
    setValue(e.target.value);

    if (!typingTimeoutRef.current) {
      startTyping();
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = null;
    }, 2000);
  };

  return (
    <input value={value} onChange={handleChange} onBlur={stopTyping} />
  );
}
```

### Adding Presence/Status

```jsx
import { usePresence } from '../hooks/useLiveFeatures';
import { useUserStore } from '../store/userStore';

function UserStatusBar() {
  const { currentUser, onlineUsers } = useUserStore();
  const { setOnline, setAway, setOffline } = usePresence(currentUser._id);

  useEffect(() => {
    setOnline();
    return () => setOffline();
  }, []);

  return (
    <div className="status-bar">
      <button onClick={setOnline}>🟢 Online</button>
      <button onClick={setAway}>🟡 Away</button>
      <button onClick={setOffline}>⚫ Offline</button>
      <span>{onlineUsers.length} online</span>
    </div>
  );
}
```

### Adding Message Reactions

```jsx
import { useMessageFeatures } from '../hooks/useLiveFeatures';

function MessageItem({ message, conversationId }) {
  const { addReaction } = useMessageFeatures(conversationId);

  const handleReact = (emoji) => {
    addReaction(message._id, emoji);
  };

  return (
    <div className="message">
      <p>{message.content}</p>
      <button onClick={() => handleReact('👍')}>👍</button>
      <button onClick={() => handleReact('❤️')}>❤️</button>
      <button onClick={() => handleReact('😂')}>😂</button>
      {message.reactions && (
        <div className="reactions">
          {message.reactions.map(r => (
            <span key={r.emoji}>{r.emoji} {r.count}</span>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Adding Video Calls

```jsx
import { useCallFeatures } from '../hooks/useLiveFeatures';
import { useRef, useState, useEffect } from 'react';

function VideoCallComponent({ conversationId, targetUserId }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [callActive, setCallActive] = useState(false);

  const {
    initiateCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCallFeatures();

  const handleStartCall = async () => {
    setCallActive(true);
    initiateCall(targetUserId, conversationId);
  };

  return (
    <div className="video-call">
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
      <button onClick={handleStartCall}>Call</button>
      <button onClick={() => endCall('')}>End</button>
    </div>
  );
}
```

---

## Store Implementation Examples

### Complete chatStore.js Example

```js
import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  typingUsers: {},
  isLoading: false,
  error: null,

  // Add message from socket event
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] || []),
          message,
        ],
      },
    })),

  // Update message status (delivered, read, etc)
  updateMessageStatus: (messageId, status) =>
    set((state) => ({
      messages: Object.keys(state.messages).reduce((acc, convId) => {
        acc[convId] = state.messages[convId].map((msg) =>
          msg._id === messageId ? { ...msg, status } : msg
        );
        return acc;
      }, {}),
    })),

  // Update message content
  updateMessage: (messageId, data) =>
    set((state) => ({
      messages: Object.keys(state.messages).reduce((acc, convId) => {
        acc[convId] = state.messages[convId].map((msg) =>
          msg._id === messageId ? { ...msg, ...data } : msg
        );
        return acc;
      }, {}),
    })),

  // Delete message
  deleteMessage: (messageId) =>
    set((state) => ({
      messages: Object.keys(state.messages).reduce((acc, convId) => {
        acc[convId] = state.messages[convId].filter(
          (msg) => msg._id !== messageId
        );
        return acc;
      }, {}),
    })),

  // Set typing users
  setTypingUsers: (conversationId, userId, username, isTyping) =>
    set((state) => ({
      typingUsers: isTyping
        ? { ...state.typingUsers, [userId]: username }
        : {
            ...state.typingUsers,
            [userId]: undefined,
          },
    })),

  // Add reaction
  addReaction: (messageId, reaction, userId) =>
    set((state) => ({
      messages: Object.keys(state.messages).reduce((acc, convId) => {
        acc[convId] = state.messages[convId].map((msg) => {
          if (msg._id === messageId) {
            const reactions = msg.reactions || {};
            reactions[reaction] = {
              emoji: reaction,
              users: [...(reactions[reaction]?.users || []), userId],
              count: (reactions[reaction]?.count || 0) + 1,
            };
            return { ...msg, reactions };
          }
          return msg;
        });
        return acc;
      }, {}),
    })),

  // Mark messages as seen
  updateMessagesSeen: (conversationId, userId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId].map((msg) =>
          msg.conversationId === conversationId
            ? { ...msg, seenBy: [...(msg.seenBy || []), userId] }
            : msg
        ),
      },
    })),

  // Add incoming call
  addIncomingCall: (callData) =>
    set((state) => ({
      incomingCalls: [...(state.incomingCalls || []), callData],
    })),

  // Update call status
  updateCallStatus: (callId, status, data) =>
    set((state) => ({
      calls: {
        ...state.calls,
        [callId]: { ...state.calls?.[callId], status, ...data },
      },
    })),

  // Update conversation message preview
  updateConversationMessagePreview: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv._id === conversationId
          ? { ...conv, lastMessage: message.content, updatedAt: message.timestamp }
          : conv
      ),
    })),
}));
```

### Complete userStore.js Example

```js
import { create } from 'zustand';

export const useUserStore = create((set) => ({
  currentUser: null,
  users: [],
  onlineUsers: [],
  userStatuses: {},

  // Update user status
  updateUserStatus: (userId, status) =>
    set((state) => ({
      userStatuses: {
        ...state.userStatuses,
        [userId]: status,
      },
      users: state.users.map((user) =>
        user._id === userId ? { ...user, status } : user
      ),
    })),

  // Set list of online users
  setOnlineUsers: (onlineUsers) =>
    set({
      onlineUsers: onlineUsers,
    }),

  // Set current user
  setCurrentUser: (user) => set({ currentUser: user }),

  // Set all users
  setUsers: (users) => set({ users }),
}));
```

---

## Testing Your Integration

### 1. Test Typing Indicator
- Open a conversation
- Log in as two different users
- Start typing in one client
- Verify "typing..." appears in the other client

### 2. Test Message Delivery
- Send a message
- Verify it appears in both clients in real-time
- Check message status updates (sent → delivered → read)

### 3. Test Presence
- Open two browser tabs
- Set yourself online in one
- Verify you appear in the online users list in the other

### 4. Test Reactions
- Click reaction buttons on a message
- Verify reaction appears in real-time on all clients

### 5. Test Video Calls (if implemented)
- Initiate a call from one client
- Accept on another
- Verify video feeds appear
- Test mute/camera toggle

---

## Troubleshooting Integration

### Issue: Typing indicator doesn't disappear
**Solution:** Ensure typing timeout in store is clearing properly:
```js
setTypingUsers: (conversationId, userId, username, isTyping) =>
  set((state) => ({
    typingUsers: isTyping
      ? { ...state.typingUsers, [userId]: username }
      : {
          ...state.typingUsers,
          [userId]: undefined, // or delete state.typingUsers[userId]
        },
  })),
```

### Issue: Messages not appearing in real-time
**Solution:** Verify Socket.IO is connected before sending:
```js
// In socket.js
export const getSocket = () => {
  if (!socket?.connected) {
    console.warn('Socket not connected');
  }
  return socket;
};
```

### Issue: Store methods not being called
**Solution:** Add console logs to verify events are received:
```js
// In liveFeatures.js
socketChat.onNewMessage((data) => {
  console.log('New message received:', data);
  const { addMessage } = useChatStore.getState();
  addMessage(data.conversationId, data.message);
});
```

### Issue: Memory leaks
**Solution:** Ensure cleanup on unmount:
```jsx
useEffect(() => {
  return () => {
    liveFeatures.leaveConversation(conversationId, userId);
  };
}, [conversationId, userId]);
```

---

## Performance Tips

1. **Use specialized hooks** instead of the main hook when possible
2. **Debounce typing indicator** to avoid too many socket events
3. **Limit typing timeout** to reasonable time (1-3 seconds)
4. **Clean up listeners** when leaving components
5. **Use React.memo** for message list items to prevent re-renders
6. **Batch socket events** - don't emit on every keystroke

---

## Next Steps

1. ✅ Copy `liveFeatures.js` to services folder
2. ✅ Copy `useLiveFeatures.js` to hooks folder
3. ✅ Update App.jsx with initialization
4. ✅ Update your chat components to use hooks
5. ✅ Verify all store methods are implemented
6. ✅ Test each feature in your app
7. ✅ Add error handling and logging
8. ✅ Monitor WebSocket connections in DevTools

---

## Support & Questions

If you encounter issues:
1. Check console for Socket.IO errors
2. Verify stores have required methods
3. Check Socket.IO is connected (`socket?.connected`)
4. Review browser DevTools Network tab for Socket.IO messages
5. Add console logs to track event flow

Good luck with your implementation! 🚀
