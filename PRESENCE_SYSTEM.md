## Real-Time Presence System Documentation

### Overview

The Real-Time Presence System tracks user online/offline status with advanced multi-device/tab support, automatic idle detection, and formatted "last seen" timestamps. It's built on Socket.io for real-time updates and includes:

- **Multi-Device Support**: Track separate sessions per tab/device for the same user
- **Presence Tracking**: Online, Away, Offline, and Do Not Disturb statuses
- **Last Seen Timestamps**: Automatically managed with human-readable formatting
- **Idle Detection**: Auto-mark users as "away" after 5 minutes of inactivity
- **Efficient Broadcasting**: Room-based socket communication instead of broadcasting to all
- **Activity Detection**: Automatic tracking of user interactions (mouse, keyboard, clicks)

---

## Backend Architecture

### Files Created/Modified

1. **`backend/src/services/presenceService.js`** (NEW - 250+ lines)
   - Core service for presence management
   - Session registration and tracking
   - Activity recording and idle detection
   - Last-seen formatting utilities
   - Bulk presence queries

2. **`backend/src/sockets/presence.js`** (UPDATED - 180+ lines)
   - Socket event handlers for presence
   - Multi-device-aware status updates
   - Automatic session management
   - Broadcast optimization using room-based communication

### Presence Service API

#### Session Management

```javascript
import presenceService from '../services/presenceService.js';

// Register a new session when user connects
const sessionId = presenceService.registerSession(userId, socketId, deviceInfo);

// Unregister a session when user disconnects
presenceService.unregisterSession(userId, sessionId);

// Get all active sessions for a user
const sessions = presenceService.getActiveSessions(userId);
```

#### Status Updates

```javascript
// Update user status across all sessions
const result = await presenceService.updateUserStatus(userId, 'online');
// Returns: { userId, status, sessionCount, user }

// Record user activity (resets idle timer)
presenceService.recordActivity(userId, sessionId);

// Get full presence info for a user
const info = await presenceService.getPresenceInfo(userId);
// Returns: { userId, username, status, lastSeen, lastSeenFormatted, isOnline, sessionCount, profilePicture }

// Get presence info for multiple users
const infos = await presenceService.getBulkPresenceInfo(userIds);
```

#### Last-Seen Formatting

```javascript
// Format timestamps for display
const formatted = presenceService.formatLastSeen(lastSeenDate);
// Examples: "just now", "5m ago", "2h ago", "yesterday", "3d ago", "Jan 15"
```

### Socket Events

#### From Client to Server

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `userId` | Register user session on connection |
| `user_online` | `userId` | Mark user as online |
| `user_away` | `userId` | Mark user as away |
| `user_offline` | `userId` | Mark user as offline |
| `get_online_users` | (none) | Request list of online users |
| `get_presence` | `userIds` (string or array) | Request presence info for specific user(s) |
| `user_activity` | `userId` | Record user activity (prevents idle) |

#### From Server to Client

| Event | Payload | Description |
|-------|---------|-------------|
| `user_status_changed` | Presence Info Object | Broadcasts when any user's status changes |
| `online_users` | Array of User Objects | Response to `get_online_users` request |
| `presence_info` | Array of Presence Info Objects | Response to `get_presence` request |

### Presence Info Object Structure

```javascript
{
  userId: "string",              // MongoDB user ID
  username: "string",            // User's username
  status: "online|away|offline|dnd", // Current status
  lastSeen: Date,               // Last activity timestamp
  lastSeenFormatted: "string",  // Human-readable "5m ago"
  isOnline: boolean,            // True if has active sessions
  sessionCount: number,         // Number of active sessions
  profilePicture: "string|null" // URL to profile picture
}
```

---

## Frontend Architecture

### Files Created/Modified

1. **`frontend/src/store/presenceStore.js`** (NEW - 200+ lines)
   - Zustand store for global presence state
   - Automatic listener initialization

2. **`frontend/src/hooks/usePresence.js`** (NEW - 250+ lines)
   - React hook for presence functionality
   - Activity auto-detection with debouncing
   - Status utilities (colors, labels)

3. **`frontend/src/services/socket.js`** (UPDATED)
   - Added `getPresence()` and `onPresenceInfo()` methods
   - Enhanced `socketPresence` export

### Zustand Store State

```javascript
import { usePresenceStore } from '../store/presenceStore.js';

const store = usePresenceStore();

// State
store.onlineUsers           // { userId: presenceInfo }
store.userPresence          // { userId: detailedPresenceInfo }
store.currentUserStatus     // 'online' | 'away' | 'offline' | 'dnd'
store.isLoading            // boolean
store.error                // string | null

// Actions
store.initializePresenceListeners()
store.fetchOnlineUsers()
store.getPresence(userIds)
store.setCurrentUserStatus(status)
store.recordActivity()
store.getUserPresence(userId)
store.isUserOnline(userId)
store.getUserLastSeen(userId)
store.getOnlineUsersArray()
store.getAwayUsers()
store.clearPresence()
store.clearError()
store.cleanupListeners()
```

### usePresence Hook API

```javascript
import usePresence from '../hooks/usePresence.js';

const {
  // State
  onlineUsers,
  userPresence,
  currentUserStatus,
  isLoading,
  error,

  // Current user actions
  setStatus,        // Set user status directly
  goOnline,        // Shortcut: setStatus('online')
  goAway,          // Shortcut: setStatus('away')
  goOffline,       // Shortcut: setStatus('offline')
  setDND,          // Shortcut: setStatus('dnd')
  recordActivity,  // Manual activity recording

  // Status utilities
  getStatusLabel,       // Get 'Online' from 'online'
  getStatusColor,       // Get Tailwind class 'text-green-500'
  getStatusBadgeColor,  // Get Tailwind class 'bg-green-500'

  // User presence queries
  getUserPresence,      // Get full presence info
  checkUserOnline,      // Check if user is online
  getUserLastSeen,      // Get formatted last-seen
  getOnlineUsersArray,  // Get array of online users
  getAwayUsers,         // Get away status users

  // List operations
  fetchOnlineUsers,     // Refresh online users
  getPresenceForUsers,  // Get presence for specific users

  // Cleanup
  clearPresence,
  clearError,
} = usePresence({
  autoInit: true,           // Auto-init listeners
  fetchOnlineUsers: true,   // Fetch on mount
  watchUsers: ['userId1'],  // Watch specific users
});
```

---

## Usage Examples

### Basic Setup in a Component

```javascript
import usePresence from '../hooks/usePresence.js';

function UserStatus() {
  const { currentUserStatus, setStatus, onlineUsers } = usePresence();

  return (
    <div>
      <p>Your Status: {currentUserStatus}</p>
      <button onClick={() => setStatus('online')}>Go Online</button>
      <button onClick={() => setStatus('away')}>Go Away</button>
      
      <h3>Online Users: {Object.keys(onlineUsers).length}</h3>
    </div>
  );
}
```

### Display User Presence with Last-Seen

```javascript
import usePresence from '../hooks/usePresence.js';

function UserCard({ userId, username }) {
  const { 
    getUserPresence, 
    getStatusColor, 
    getStatusBadgeColor 
  } = usePresence({
    watchUsers: [userId]
  });

  const presence = getUserPresence(userId);

  if (!presence) return <div>Loading...</div>;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(presence.status)}`} />
      <span>{username}</span>
      <span className="text-xs text-gray-500">
        {presence.isOnline ? 'Online' : presence.lastSeenFormatted}
      </span>
    </div>
  );
}
```

### Activity Auto-Detection

The `usePresence` hook automatically:
- Listens for mouse movements
- Listens for keyboard input
- Listens for clicks
- Debounces activity recording to once per 30 seconds
- Prevents unnecessarily frequent socket emissions

No additional setup required - it works automatically when initialized.

### Managing Multiple Status

```javascript
import usePresence from '../hooks/usePresence.js';

function StatusSelector() {
  const { 
    currentUserStatus, 
    goOnline, 
    goAway, 
    goOffline, 
    setDND,
    getStatusLabel,
    getStatusColor 
  } = usePresence();

  const statuses = ['online', 'away', 'offline', 'dnd'];

  return (
    <div className="flex gap-2">
      {statuses.map(status => (
        <button
          key={status}
          onClick={() => {
            if (status === 'online') goOnline();
            else if (status === 'away') goAway();
            else if (status === 'offline') goOffline();
            else setDND();
          }}
          className={`px-3 py-1 rounded ${
            currentUserStatus === status 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200'
          }`}
        >
          {getStatusLabel(status)}
        </button>
      ))}
    </div>
  );
}
```

---

## Multi-Device/Tab Behavior

### How It Works

1. **Session Registration**: Each tab/device gets a unique session ID when connecting
2. **Aggregate Status**: A user is "online" if ANY session is active
3. **Session Tracking**: The service tracks all active sessions per user
4. **Disconnect Handling**: When a tab closes, only that session is removed
5. **Full Offline**: User marked offline only when ALL sessions are gone

### User Experience

```
User opens two browser tabs:
├─ Tab 1: Connects → User shows as "online" (1 session)
├─ Tab 2: Connects → User still "online" (2 sessions)
├─ Tab 1 closes → User still "online" (1 session remaining)
└─ Tab 2 closes → User marked "offline" (0 sessions)
```

### Multiple Devices

```
Same user on different devices:
├─ Desktop: Chrome → "online" (Session A)
├─ Mobile: Safari → "online" (Session B, same user still online)
├─ Desktop: Close → Still "online" (Mobile session still active)
└─ Mobile: Close → "offline" (No sessions)
```

---

## Idle Detection

### Process

1. **Activity Trigger**: Any user interaction triggers activity recording
2. **Timer Reset**: 5-minute idle timer resets on each activity
3. **Auto-Away**: If no activity for 5 minutes, user marked "away"
4. **Manual Override**: User can manually set status anytime

### Configuration

Change idle timeout in `presenceService.js`:

```javascript
const IDLE_TIMEOUT = 5 * 60 * 1000; // Change this value (milliseconds)
```

---

## Database Changes

The existing User model already supports the presence system:

```javascript
// Fields used:
schema.status;       // 'online' | 'away' | 'offline' | 'dnd'
schema.lastSeen;     // Date field for last activity
schema.profilePicture; // For presence info display
```

No migrations required.

---

## Socket Room Structure

The presence system uses efficient room-based communication:

```
Socket.io Rooms:
├─ user_{userId}      // Individual notification room for this user
└─ (Global io.emit)  // For broadcast status changes to all users
```

---

## Performance Considerations

1. **Activity Debouncing**: Activity recorded max once per 30 seconds
2. **Efficient Queries**: Bulk presence queries supported for multiple users
3. **Memory Management**: Sessions auto-cleaned on disconnect
4. **Database Queries**: Lean queries used where possible (`.lean()`)
5. **Broadcast Optimization**: Uses room-based instead of global broadcasts

---

## Error Handling

All errors are caught and logged:

```javascript
// In socket handlers:
try {
  // Update status
} catch (error) {
  console.error('Error updating status:', error);
  socket.emit('error', { message: 'Failed to update status' });
}
```

Frontend can listen for errors:

```javascript
const { error, clearError } = usePresence();

if (error) {
  console.error('Presence error:', error);
  clearError();
}
```

---

## Testing Checklist

- [ ] User comes online → Status broadcasts, last-seen updates
- [ ] User goes away → Status changes to "away"
- [ ] User goes offline → Status changes to "offline"
- [ ] Open two tabs → User stays online (2 sessions)
- [ ] Close one tab → User still online (1 session)
- [ ] Close both tabs → User offline
- [ ] No activity for 5 min → Auto-marked "away"
- [ ] Record activity → Idle timer resets
- [ ] Get online users → Returns with formatted last-seen
- [ ] Get presence for user → Returns detailed presence info
- [ ] Multiple devices → Each device tracked separately
- [ ] Network disconnect → Proper cleanup

---

## Breaking Changes

✅ **None** - The system is fully backward compatible with existing functionality.

All existing socket events continue to work unchanged.

---

## Future Enhancements

- [ ] Presence in rooms/conversations (not just global)
- [ ] Custom status messages
- [ ] Presence history/activity logs
- [ ] Location-based presence
- [ ] Presence persistence across server restarts
- [ ] WebRTC presence updates
