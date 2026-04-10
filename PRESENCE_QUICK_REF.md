## Presence System Quick Reference

### Setup (One-Time)

The presence system is automatically integrated. Just use the hook in any component:

```javascript
import usePresence from '../hooks/usePresence.js';
```

### Most Common Operations

#### Display User Status

```javascript
const { getUserPresence, getStatusBadgeColor } = usePresence();
const presence = getUserPresence(userId);

<div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(presence.status)}`} />
```

#### Get Online Users Count

```javascript
const { getOnlineUsersArray } = usePresence();
const onlineCount = getOnlineUsersArray().length;
```

#### Set Your Status

```javascript
const { goOnline, goAway, goOffline } = usePresence();

goOnline();   // Mark yourself as online
goAway();     // Mark yourself as away
goOffline();  // Mark yourself as offline
```

#### Check if User is Online

```javascript
const { checkUserOnline, getUserLastSeen } = usePresence();

if (checkUserOnline(userId)) {
  console.log('User is online');
} else {
  console.log(`Last seen: ${getUserLastSeen(userId)}`);
}
```

#### Refresh Online Users

```javascript
const { fetchOnlineUsers } = usePresence();
fetchOnlineUsers();
```

### Presence Store Direct Access

```javascript
import { usePresenceStore } from '../store/presenceStore.js';

const { onlineUsers, currentUserStatus } = usePresenceStore();
```

### Socket Events (Raw)

```javascript
import { socketPresence } from '../services/socket.js';

// Emit
socketPresence.userOnline(userId);
socketPresence.userAway(userId);
socketPresence.userOffline(userId);
socketPresence.getOnlineUsers();
socketPresence.getPresence(userIds); // Single ID or array
socketPresence.userActivity(userId);

// Listen
socketPresence.onUserStatusChanged((presenceInfo) => {});
socketPresence.onOnlineUsers((users) => {});
socketPresence.onPresenceInfo((presenceArray) => {});
```

### Status Values

```javascript
'online'  // User is active
'away'    // User inactive for 5+ minutes
'offline' // User not connected
'dnd'     // Do Not Disturb (user set manually)
```

### Hook Options

```javascript
usePresence({
  autoInit: true,              // Auto-init listeners (default: true)
  fetchOnlineUsers: true,      // Fetch on mount (default: true)
  watchUsers: ['userId1'],     // Watch specific users (default: [])
})
```

### Tailwind Classes

All status actions return Tailwind classes:

```javascript
getStatusColor('online')       // 'text-green-500'
getStatusColor('away')         // 'text-yellow-500'
getStatusColor('offline')      // 'text-gray-500'
getStatusColor('dnd')          // 'text-red-500'

getStatusBadgeColor('online')  // 'bg-green-500'
getStatusBadgeColor('away')    // 'bg-yellow-500'
getStatusBadgeColor('offline') // 'bg-gray-500'
getStatusBadgeColor('dnd')     // 'bg-red-500'
```

### Timestamps

All `lastSeen` values are automatically formatted:

```javascript
'just now'     // < 1 minute ago
'5m ago'       // < 60 minutes ago
'2h ago'       // < 24 hours ago
'yesterday'    // Exactly 1 day ago
'3d ago'       // < 7 days ago
'Jan 15'       // Older than 7 days
'Jan 15, 2023' // Different year
```

### Activity Auto-Detection

Activity is automatically recorded on:
- Mouse movements
- Keyboard input
- Clicks

No manual setup required. Debounced to once per 30 seconds.

### Multi-Tab Behavior

- **Tab 1 opens**: User online (Session A)
- **Tab 2 opens**: User still online (Session B)
- **Tab 1 closes**: User still online (Session B active)
- **Tab 2 closes**: User offline (No sessions)

User status only changes to offline when ALL tabs/devices disconnect.

### Error Handling

```javascript
const { error, clearError } = usePresence();

if (error) {
  console.error(error);
  clearError();
}
```

### Cleanup

```javascript
const { cleanupListeners } = usePresence();

// Cleanup on component unmount
useEffect(() => {
  return () => cleanupListeners();
}, []);
```

### Server-Side Presence Service

```javascript
import presenceService from '../services/presenceService.js';

// Format timestamps
presenceService.formatLastSeen(date); // 'just now'

// Get presence info
await presenceService.getPresenceInfo(userId);

// Get bulk presence
await presenceService.getBulkPresenceInfo([userId1, userId2]);

// Manage sessions
presenceService.getActiveSessions(userId); // [session1, session2]
presenceService.registerSession(userId, socketId, deviceInfo);
presenceService.unregisterSession(userId, sessionId);
```

### Common Patterns

#### Online Status Indicator

```javascript
function OnlineIndicator({ userId }) {
  const { checkUserOnline, getStatusBadgeColor, getUserPresence } = usePresence(
    { watchUsers: [userId] }
  );

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getStatusBadgeColor(
        checkUserOnline(userId) ? 'online' : 'offline'
      )}`} />
    </div>
  );
}
```

#### User List with Status

```javascript
function UsersList() {
  const { getOnlineUsersArray } = usePresence();
  const users = getOnlineUsersArray();

  return (
    <ul>
      {users.map(user => (
        <li key={user.userId}>
          <span>{user.username}</span>
          <span className="text-xs text-gray-500">{user.lastSeenFormatted}</span>
        </li>
      ))}
    </ul>
  );
}
```

#### Status Selector

```javascript
function StatusMenu() {
  const { currentUserStatus, goOnline, goAway, goOffline } = usePresence();

  return (
    <select 
      value={currentUserStatus}
      onChange={(e) => {
        if (e.target.value === 'online') goOnline();
        else if (e.target.value === 'away') goAway();
        else goOffline();
      }}
    >
      <option value="online">Online</option>
      <option value="away">Away</option>
      <option value="offline">Offline</option>
    </select>
  );
}
```
