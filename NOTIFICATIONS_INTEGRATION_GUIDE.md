## Notifications System Integration Guide

### Quick Start (5 Minutes)

#### Step 1: Add Badge to Header
```javascript
// In your header/navbar component
import { NotificationBadge } from '../components/notifications/NotificationBadge';

export function Header() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between">
        <h1>FreeCall</h1>
        <div className="relative">
          <button className="p-2">🔔</button>
          <NotificationBadge size="md" />
        </div>
      </div>
    </header>
  );
}
```

#### Step 2: Show NotificationPanel on Click
```javascript
import { useState } from 'react';
import { NotificationPanel } from '../components/notifications/NotificationPanel';

export function Header() {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header>
      <button onClick={() => setNotifOpen(!notifOpen)}>🔔</button>
      {notifOpen && (
        <NotificationPanel 
          isOpen={true} 
          onClose={() => setNotifOpen(false)} 
        />
      )}
    </header>
  );
}
```

That's it! The system handles everything else automatically.

---

## Component Examples

### 1. Simple Notification Bell

```javascript
import { NotificationBadge } from '../components/notifications';
import useNotifications from '../hooks/useNotifications';

export function NotificationBell() {
  const { badgeCount } = useNotifications();

  return (
    <div className="relative p-2 hover:bg-gray-100 rounded cursor-pointer">
      <span className="text-2xl">🔔</span>
      {badgeCount > 0 && (
        <NotificationBadge size="md" className="top-1 right-1" />
      )}
    </div>
  );
}
```

### 2. Notification Badge in Tab Title

```javascript
import { useEffect } from 'react';
import useNotifications from '../hooks/useNotifications';

export function useNotificationTitle() {
  const { badgeCount } = useNotifications();

  useEffect(() => {
    if (badgeCount > 0) {
      document.title = `(${badgeCount}) FreeCall`;
    } else {
      document.title = 'FreeCall';
    }
  }, [badgeCount]);
}

// Usage in App.jsx
function App() {
  useNotificationTitle();
  return <div>...</div>;
}
```

### 3. Notification Count Display

```javascript
import useNotifications from '../hooks/useNotifications';

export function NotificationCount() {
  const { unreadCount, isLoading } = useNotifications();

  if (isLoading) return <span>...</span>;

  return (
    <div className="text-center p-4">
      <h2 className="text-3xl font-bold text-red-600">{unreadCount}</h2>
      <p className="text-gray-600">Unread notification{unreadCount !== 1 ? 's' : ''}</p>
    </div>
  );
}
```

### 4. Recent Notifications List

```javascript
import useNotifications from '../hooks/useNotifications';
import NotificationItem from '../components/notifications/NotificationItem';

export function RecentNotifications({ limit = 5 }) {
  const { notifications } = useNotifications();
  
  const recent = notifications.slice(0, limit);

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm">Recent Activity</h3>
      {recent.length === 0 ? (
        <p className="text-gray-500 text-sm">No notifications yet</p>
      ) : (
        recent.map(notif => (
          <NotificationItem 
            key={notif._id} 
            notification={notif} 
          />
        ))
      )}
    </div>
  );
}
```

### 5. Message Notifications Only

```javascript
import useNotifications from '../hooks/useNotifications';

export function MessageNotifications() {
  const { 
    getByType, 
    readNotification,
    removeNotification 
  } = useNotifications();

  const messages = getByType('message');

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="font-bold mb-3">💬 Messages ({messages.length})</h3>
      <ul className="space-y-2">
        {messages.map(msg => (
          <li 
            key={msg._id}
            className="p-3 bg-white rounded border-l-4 border-blue-500"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{msg.title}</p>
                <p className="text-sm text-gray-600">{msg.description}</p>
              </div>
              <button 
                onClick={() => readNotification(msg._id)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ✓
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 6. Friend Request Notifications

```javascript
import useNotifications from '../hooks/useNotifications';

export function FriendRequestNotifications() {
  const { getByType, readNotification } = useNotifications();

  const requests = getByType('friend_request');

  return (
    <div className="p-4 bg-purple-50 rounded-lg">
      <h3 className="font-bold mb-3">👥 Friend Requests ({requests.length})</h3>
      <ul className="space-y-2">
        {requests.map(req => (
          <li 
            key={req._id}
            className="p-3 bg-white rounded border-l-4 border-purple-500 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{req.title}</p>
              <p className="text-sm text-gray-600">{req.actorId_expanded?.username}</p>
            </div>
            <button
              onClick={() => readNotification(req._id)}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Accept
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 7. Notification Settings Panel

```javascript
import useNotifications from '../hooks/useNotifications';

export function NotificationSettings() {
  const { 
    soundEnabled, 
    toggleSound, 
    testSound,
    readAllNotifications,
    clearAllNotifications,
    unreadCount,
    notifications
  } = useNotifications();

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-4">
      <h2 className="text-xl font-bold">Notification Settings</h2>

      {/* Sound Toggle */}
      <div className="flex items-center justify-between p-3 border rounded">
        <label className="font-medium">🔔 Notification Sounds</label>
        <button
          onClick={toggleSound}
          className={`px-4 py-2 rounded font-medium transition ${
            soundEnabled
              ? 'bg-green-500 text-white'
              : 'bg-gray-300 text-gray-700'
          }`}
        >
          {soundEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Test Sound */}
      {soundEnabled && (
        <button
          onClick={testSound}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
        >
          🔊 Test Sound
        </button>
      )}

      {/* Mark All as Read */}
      <button
        onClick={readAllNotifications}
        disabled={unreadCount === 0}
        className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded disabled:opacity-50 transition"
      >
        ✓ Mark All as Read ({unreadCount})
      </button>

      {/* Clear All */}
      <button
        onClick={clearAllNotifications}
        disabled={notifications.length === 0}
        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 transition"
      >
        🗑️ Clear All ({notifications.length})
      </button>

      {/* Sound Volume Note */}
      <p className="text-sm text-gray-600 text-center border-t pt-3">
        Sound volume is set to 50%. Adjust in code if needed.
      </p>
    </div>
  );
}
```

### 8. Notification Toast/Alert

```javascript
import { useEffect, useState } from 'react';
import useNotifications from '../hooks/useNotifications';

export function NotificationToast() {
  const { notifications } = useNotifications();
  const [visible, setVisible] = useState(null);

  useEffect(() => {
    // Show latest unread notification as toast
    const unread = notifications.find(n => !n.isRead);
    if (unread) {
      setVisible(unread);
      const timer = setTimeout(() => setVisible(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 
                    max-w-sm border-l-4 border-blue-500 animate-pulse">
      <div className="flex gap-3">
        <span className="text-2xl">💬</span>
        <div className="flex-1">
          <h4 className="font-bold text-sm">{visible.title}</h4>
          <p className="text-sm text-gray-600">{visible.description}</p>
        </div>
        <button 
          onClick={() => setVisible(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

### 9. Notifications Dashboard

```javascript
import useNotifications from '../hooks/useNotifications';

export function NotificationsDashboard() {
  const { 
    notifications,
    unreadCount,
    getByType,
    getTypeIcon,
    getTypeLabel
  } = useNotifications();

  const types = ['message', 'friend_request', 'friend_accepted', 'call_incoming', 'call_missed'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600">{unreadCount}</div>
          <p className="text-sm text-gray-600">Unread</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600">{notifications.length}</div>
          <p className="text-sm text-gray-600">Total</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">
            {notifications.filter(n => n.isRead).length}
          </div>
          <p className="text-sm text-gray-600">Read</p>
        </div>
      </div>

      {/* By Type */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {types.map(type => {
          const count = getByType(type).length;
          return (
            <div key={type} className="p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <span>{getTypeIcon(type)}</span>
                <span className="font-medium">{getTypeLabel(type)}</span>
              </div>
              <div className="text-2xl font-bold mt-2">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Full List */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications yet</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div 
                key={notif._id}
                className={`p-3 border-l-4 rounded ${
                  notif.isRead 
                    ? 'bg-gray-50 border-gray-300' 
                    : 'bg-blue-50 border-blue-300'
                }`}
              >
                <p className="font-medium">{notif.title}</p>
                <p className="text-sm text-gray-600">{notif.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 10. Integrating into Main Layout

```javascript
import { useState } from 'react';
import { NotificationPanel, NotificationBadge } from '../components/notifications';
import NotificationToast from '../components/notifications/NotificationToast';

export function Layout({ children }) {
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold">FreeCall</h1>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifPanelOpen(!notifPanelOpen)}
                className="p-2 hover:bg-gray-100 rounded relative"
              >
                🔔
                <NotificationBadge size="md" className="top-1 right-1" />
              </button>

              {/* Dropdown Panel */}
              {notifPanelOpen && (
                <div className="absolute right-0 mt-2 z-50">
                  <NotificationPanel 
                    isOpen={true}
                    onClose={() => setNotifPanelOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Notification Toast */}
      <NotificationToast />
    </div>
  );
}
```

---

## Integration Patterns

### Pattern 1: Notification Count in Multiple Places

```javascript
function App() {
  return (
    <>
      <Header />
      <NotificationBadge />
      <NotificationCounter />
      <Routes {...} />
    </>
  );
}
```

### Pattern 2: Auto-Dismiss Toast

```javascript
useEffect(() => {
  const timer = setTimeout(() => setVisible(null), 3000);
  return () => clearTimeout(timer);
}, [notifications]);
```

### Pattern 3: Filter by Conversation

```javascript
function ChatHeader({ conversationId }) {
  const { getByType } = useNotifications();
  const messages = getByType('message');
  const relevant = messages.filter(
    m => m.metadata?.conversationId === conversationId
  );

  return <span>{relevant.length} unread in this chat</span>;
}
```

---

## Styling Customization

### Custom Notification Colors

```javascript
const customTypeColors = {
  message: 'bg-indigo-100 border-indigo-400',
  friend_request: 'bg-violet-100 border-violet-400',
  // ... more
};

// Use in components
className={customTypeColors[type]}
```

### Tailwind Dark Mode

```javascript
<div className={`
  p-4
  dark:bg-gray-800 dark:text-white
  dark:border-gray-700
  ${getTypeColor(type)}
`}>
  {notification.title}
</div>
```

---

## Performance Optimization

### Memoization

```javascript
import { useMemo } from 'react';

function MessagesList() {
  const { getByType } = useNotifications();
  
  const messages = useMemo(() => getByType('message'), []);
  
  return <...>
}
```

### Lazy Loading

```javascript
const RecentNotifications = lazy(() => 
  import('./RecentNotifications')
);

<Suspense fallback={<div>Loading...</div>}>
  <RecentNotifications />
</Suspense>
```

---

## Error Handling

```javascript
function NotificationContainer() {
  const { error, clearError } = useNotifications();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p>Notification error: {error}</p>
        <button onClick={clearError}>Dismiss</button>
      </div>
    );
  }

  return <NotificationPanel />;
}
```

---

## Testing Notifications

In component:
```javascript
// Trigger test notification
const { addNotification } = useNotificationStore.getState();
addNotification({
  _id: 'test-' + Date.now(),
  type: 'message',
  title: 'Test Message',
  isRead: false,
  createdAt: new Date(),
});
```

---

## Migration Guide

If you had old notification code:

**Old:**
```javascript
socket.on('new_notification', (data) => {
  showNotification(data.message);
});
```

**New:**
```javascript
const { notifications, soundEnabled } = useNotifications();
// Everything automatic!
```

The old socket event still works - the new system wraps and enhances it.
