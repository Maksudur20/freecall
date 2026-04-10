## Presence System Integration Guide

### Quick Start (5 Minutes)

#### Step 1: Add Presence Hook to Your Component

```javascript
import usePresence from '../hooks/usePresence.js';

function MyComponent() {
  const presence = usePresence();
  // ... rest of component
}
```

#### Step 2: Use Presence Data

```javascript
export default function ChatHeader({ userId }) {
  const { 
    checkUserOnline,
    getUserLastSeen,
    getStatusBadgeColor 
  } = usePresence({ watchUsers: [userId] });

  const isOnline = checkUserOnline(userId);

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(isOnline ? 'online' : 'offline')}`} />
      <span className="text-sm text-gray-600">
        {isOnline ? 'Online' : `Last seen ${getUserLastSeen(userId)}`}
      </span>
    </div>
  );
}
```

That's it! The system handles everything automatically.

---

## Component Examples

### 1. User Status Card

```javascript
import usePresence from '../hooks/usePresence.js';

export function UserStatusCard({ userId }) {
  const { 
    getUserPresence,
    getStatusColor,
    getStatusBadgeColor
  } = usePresence({ watchUsers: [userId] });

  const presence = getUserPresence(userId);
  if (!presence) return <div>Loading...</div>;

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center gap-3">
        {/* Profile picture */}
        <img 
          src={presence.profilePicture || '/default-avatar.png'}
          alt={presence.username}
          className="w-12 h-12 rounded-full"
        />

        {/* Status info */}
        <div className="flex-1">
          <h3 className="font-semibold">{presence.username}</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(presence.status)}`} />
            <span className={`text-sm ${getStatusColor(presence.status)}`}>
              {presence.isOnline ? 'Online' : presence.lastSeenFormatted}
            </span>
          </div>
        </div>

        {/* Multi-device badge */}
        {presence.sessionCount > 1 && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {presence.sessionCount} devices
          </span>
        )}
      </div>
    </div>
  );
}
```

### 2. Online Users List

```javascript
import usePresence from '../hooks/usePresence.js';

export function OnlineUsersList() {
  const { getOnlineUsersArray, getStatusBadgeColor } = usePresence();

  const onlineUsers = getOnlineUsersArray();

  if (onlineUsers.length === 0) {
    return <p className="text-gray-500">No users online</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">
        Online ({onlineUsers.length})
      </h3>
      <ul className="space-y-1">
        {onlineUsers.map(user => (
          <li key={user.userId} className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(user.status)}`} />
            <span>{user.username}</span>
            {user.sessionCount > 1 && (
              <span className="text-xs text-gray-500">({user.sessionCount} tabs)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. Status Selector Menu

```javascript
import usePresence from '../hooks/usePresence.js';
import { Menu } from '@headlessui/react';

export function StatusMenu() {
  const { 
    currentUserStatus,
    setStatus,
    getStatusLabel,
    getStatusBadgeColor 
  } = usePresence();

  return (
    <Menu>
      <Menu.Button className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusBadgeColor(currentUserStatus)}`} />
        <span className="text-sm">{getStatusLabel(currentUserStatus)}</span>
      </Menu.Button>

      <Menu.Items className="absolute bg-white border rounded shadow">
        {['online', 'away', 'offline', 'dnd'].map(status => (
          <Menu.Item key={status}>
            {({ active }) => (
              <button
                onClick={() => setStatus(status)}
                className={`w-full text-left px-4 py-2 ${
                  active ? 'bg-gray-100' : ''
                } ${currentUserStatus === status ? 'font-bold' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(status)}`} />
                  {getStatusLabel(status)}
                </div>
              </button>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  );
}
```

### 4. Chat Participant List with Status

```javascript
import usePresence from '../hooks/usePresence.js';

export function ChatParticipants({ participantIds }) {
  const { 
    getPresenceForUsers,
    getUserPresence,
    getStatusBadgeColor 
  } = usePresence({ watchUsers: participantIds });

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Participants</h3>
      <ul className="space-y-2">
        {participantIds.map(userId => {
          const presence = getUserPresence(userId);
          if (!presence) return null;

          return (
            <li 
              key={userId}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
            >
              <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(presence.status)}`} />
              <div className="flex-1">
                <div className="font-medium text-sm">{presence.username}</div>
                <div className="text-xs text-gray-500">
                  {presence.isOnline ? 'Active' : `Seen ${presence.lastSeenFormatted}`}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

### 5. User Search with Presence

```javascript
import { useState } from 'react';
import usePresence from '../hooks/usePresence.js';

export function UserSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  
  const { 
    getPresenceForUsers,
    getUserPresence,
    checkUserOnline,
    getStatusColor 
  } = usePresence();

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length === 0) {
      setSearchResults([]);
      return;
    }

    // Simulate search API call
    const results = await fetchUsers(value);
    
    // Load presence for results
    getPresenceForUsers(results.map(u => u._id));
    
    setSearchResults(results);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={handleSearch}
        className="w-full px-3 py-2 border rounded"
      />

      <ul className="mt-2 space-y-1">
        {searchResults.map(user => {
          const isOnline = checkUserOnline(user._id);

          return (
            <li 
              key={user._id}
              className="p-2 border rounded flex items-center justify-between"
            >
              <span>{user.username}</span>
              <span className={`text-xs ${getStatusColor(isOnline ? 'online' : 'offline')}`}>
                {isOnline ? '● Online' : '● Offline'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

### 6. Sidebar with Status Indicator

```javascript
import usePresence from '../hooks/usePresence.js';

export function Sidebar({ friends }) {
  const { getUserPresence, getStatusBadgeColor } = usePresence({
    watchUsers: friends.map(f => f._id)
  });

  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-4">
        <h2 className="font-bold text-lg mb-4">Friends</h2>
        
        <div className="space-y-1">
          {friends.map(friend => {
            const presence = getUserPresence(friend._id);
            
            return (
              <div
                key={friend._id}
                className="p-2 rounded hover:bg-gray-50 cursor-pointer flex items-center gap-3"
              >
                {/* Status indicator */}
                <div className={`w-2 h-2 rounded-full ${
                  getStatusBadgeColor(presence?.status || 'offline')
                }`} />
                
                {/* Name */}
                <span className="flex-1 text-sm">{friend.name}</span>
                
                {/* Multi-device badge */}
                {presence?.sessionCount > 1 && (
                  <span className="text-xs bg-blue-100 px-1 rounded">
                    {presence.sessionCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
```

### 7. Activity Monitor

```javascript
import { useEffect } from 'react';
import usePresence from '../hooks/usePresence.js';

export function ActivityMonitor() {
  const { currentUserStatus, recordActivity, goOnline } = usePresence();

  useEffect(() => {
    // Manual activity recording example
    const handleClick = () => {
      recordActivity();
      
      // Return to online if away
      if (currentUserStatus === 'away') {
        goOnline();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [recordActivity, currentUserStatus, goOnline]);

  return null; // No visual UI needed
}
```

---

## Integration Patterns

### Pattern 1: Global Status Visibility

Add to app layout/header:

```javascript
import usePresence from '../hooks/usePresence.js';

function AppHeader() {
  const { getOnlineUsersArray } = usePresence();
  const onlineCount = getOnlineUsersArray().length;

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1>MyApp</h1>
        <div className="text-sm text-gray-600">
          {onlineCount} users online
        </div>
      </div>
    </header>
  );
}
```

### Pattern 2: Per-Conversation Presence

In a chat component:

```javascript
function ConversationView({ conversationId, participants }) {
  const { getUserPresence } = usePresence({
    watchUsers: participants
  });

  return (
    <div>
      {/* Header with presence */}
      <div className="flex items-center gap-2">
        {participants.map(id => {
          const presence = getUserPresence(id);
          return presence?.isOnline ? 'Online' : 'Offline';
        })}
      </div>
    </div>
  );
}
```

### Pattern 3: User Cards in Lists

```javascript
function FriendsList({ friends }) {
  const { getUserPresence, getStatusBadgeColor } = usePresence({
    watchUsers: friends.map(f => f._id)
  });

  return (
    <div className="grid gap-4">
      {friends.map(friend => {
        const presence = getUserPresence(friend._id);
        
        return (
          <div key={friend._id} className="p-4 border rounded">
            {/* Status dot */}
            <div className={`w-3 h-3 rounded-full ${
              getStatusBadgeColor(presence?.status || 'offline')
            }`} />
            <h3>{friend.name}</h3>
            <p className="text-sm text-gray-500">
              {presence?.lastSeenFormatted}
            </p>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Common Issues & Solutions

### Issue: Status doesn't update
**Solution**: Make sure you're watching the user ID:
```javascript
usePresence({ watchUsers: [userId] })
```

### Issue: Multiple listeners
**Solution**: The hook auto-initializes once. Don't call `initializePresenceListeners()` manually.

### Issue: Activity not recording
**Solution**: Presence system auto-records activity. If it's not working, check browser console for errors.

### Issue: Last-seen shows "never"
**Solution**: Make sure User model has lastSeen field (it does by default).

---

## Performance Tips

1. **Selective Watching**: Only watch users you need:
   ```javascript
   usePresence({ watchUsers: currentConversationPartners })
   ```

2. **Lazy Fetch**: Load online users on-demand:
   ```javascript
   const { fetchOnlineUsers } = usePresence({ fetchOnlineUsers: false });
   // Then call fetchOnlineUsers() when needed
   ```

3. **Avoid Deep Store Access**: Use the hook, not the store directly.

---

## Testing Presence

Open two browser tabs and run:

```javascript
// Tab 1: Console
const { goOnline } = usePresence();
goOnline(); // Should show online in Tab 2

// Tab 2: Console  
const { getOnlineUsersArray } = usePresence();
console.log(getOnlineUsersArray()); // Should include Tab 1 user

// Close Tab 1
// Tab 2: Should update to offline
```

---

## Customization

### Custom Status Colors

Extend `getStatusColor()` and `getStatusBadgeColor()`:

```javascript
// In your component
const customColors = {
  online: 'text-green-600',
  away: 'text-amber-600',
  offline: 'text-slate-600',
  dnd: 'text-rose-600'
};

const statusText = customColors[status] || 'text-gray-600';
```

### Custom Last-Seen Format

The server handles formatting, but you can customize in your component:

```javascript
const { getUserPresence } = usePresence();
const presence = getUserPresence(userId);

const customLastSeen = presence.lastSeen 
  ? new Date(presence.lastSeen).toLocaleDateString()
  : 'Never';
```

---

## Migration from Old System

If you were using the old basic presence:

```javascript
// Old way
const { setUserStatus } = liveFeatures;
setUserStatus(userId, 'online');

// New way
const { setStatus } = usePresence();
setStatus('online');
```

The old events still work. The new system just provides a better interface.
