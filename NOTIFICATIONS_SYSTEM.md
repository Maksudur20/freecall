## Real-Time Notifications System Documentation

### Overview

A complete real-time notifications system with:
- **Real-Time Events**: Socket.io integration for instant notifications
- **Notification Badge**: Unread count indicator
- **Cross-Tab Sync**: Notifications sync across browser tabs using BroadcastChannel API
- **Sound Effects**: Optional notification sounds (can be enabled/disabled)
- **Message & Friend Notifications**: Automatic notifications for messages and friend requests
- **Notification Management**: Mark as read, delete, clear all
- **Type Filtering**: Filter notifications by type

**Status**: ✅ **Complete and Ready to Use**

---

## Backend Architecture

### Files Modified/Created

#### 1. **notificationService.js** (ENHANCED)
The notification service now includes methods for creating specific notification types:
- `createMessageNotification()` - Create message notifications
- `createFriendRequestNotification()` - Create friend request notifications
- `createFriendAcceptedNotification()` - Create friend accepted notifications
- `createIncomingCallNotification()` - Create incoming call notifications
- `createMissedCallNotification()` - Create missed call notifications

#### 2. **notifications.js** (CREATED)
New socket handler file for notification operations:
- `get_unread_count` - Get unread notification count
- `get_notifications` - Get notifications with pagination
- `mark_notification_read` - Mark single notification as read
- `mark_all_notifications_read` - Mark all as read
- `delete_notification` - Delete a notification
- `set_notification_sound` - User sound preference

#### 3. **chat.js** (ENHANCED)
Updated to use NotificationService:
- Message notifications now use `NotificationService.createMessageNotification()`
- Emits richer notification events with full notification objects
- Better notification payload structure

#### 4. **index.js** (UPDATED)
Added `setupNotificationSockets` to socket handler setup

### Socket Events

#### Client → Server
| Event | Payload | Purpose |
|-------|---------|---------|
| `get_unread_count` | `userId` | Get unread notification count |
| `get_notifications` | `userId, limit, skip` | Fetch notifications paginated |
| `mark_notification_read` | `notificationId` | Mark as read |
| `mark_all_notifications_read` | `userId` | Mark all as read |
| `delete_notification` | `notificationId` | Delete notification |
| `set_notification_sound` | `userId, enabled` | Toggle sound preferences |

#### Server → Client
| Event | Payload | Purpose |
|-------|---------|---------|
| `notification` | Full notification object | New notification received |
| `notification_read` | `{ notificationId, notification }` | Notification marked read |
| `all_notifications_read` | (none) | All notifications marked read |
| `notification_deleted` | `{ notificationId }` | Notification deleted |
| `unread_count` | `{ count }` | Current unread count |
| `notifications_list` | Array of notifications | Result of get_notifications |

---

## Frontend Architecture

### Files Modified/Created

#### 1. **notificationStore.js** (ENHANCED)
Zustand store with new features:
- Real-time listener initialization
- BroadcastChannel API for cross-tab sync
- Sound management
- Document title badge updates
- Notification filtering and queries

**State:**
```javascript
{
  notifications: [],        // Array of notification objects
  unreadCount: 0,          // Count of unread notifications
  badgeCount: 0,           // Badge count (for title)
  isLoading: false,        // Loading state
  error: null,             // Error message
  soundEnabled: true,      // Sound preference
}
```

**Actions:**
- `initializeNotificationListeners()` - Setup real-time listeners
- `getNotifications()` - Fetch from server
- `addNotification()` - Add new notification
- `markAsRead()` - Mark single as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification()` - Delete a notification
- `setSoundEnabled()` - Toggle sound
- `playNotificationSound()` - Play sound
- `broadcastToTabs()` - Broadcast to other tabs

#### 2. **useNotifications.js** (CREATED)
React hook for easy component integration

**Returns:**
```javascript
{
  // State
  notifications,
  unreadCount,
  badgeCount,
  isLoading,
  error,
  soundEnabled,

  // Actions
  fetchUnreadCount(),
  readNotification(id),
  readAllNotifications(),
  removeNotification(id),
  clearAllNotifications(),

  // Sound
  testSound(),
  toggleSound(),

  // Utilities
  getByType(type),
  getUnread(),
  getById(id),
  getTypeLabel(type),
  getTypeIcon(type),
  getTypeColor(type),
}
```

#### 3. **socket.js** (ENHANCED)
New `socketNotification` export with methods:
- `onNotification()` / `offNotification()`
- `onNotificationRead()` / `offNotificationRead()`
- `onAllNotificationsRead()` / `offAllNotificationsRead()`
- `onNotificationDeleted()` / `offNotificationDeleted()`
- `getUnreadCount()` / `onUnreadCount()`
- `getNotifications()` / `onNotificationsList()`
- `markNotificationRead()`
- `markAllRead()`
- `deleteNotification()`
- `setNotificationSound()`

#### 4. **NotificationBadge.jsx** (CREATED)
Component showing unread count badge

**Props:**
```javascript
<NotificationBadge 
  size="md"           // sm, md, lg
  className=""        // Additional CSS classes
/>
```

#### 5. **NotificationItem.jsx** (CREATED)
Individual notification display component

**Props:**
```javascript
<NotificationItem 
  notification={notification}
  onDismiss={() => {}}
/>
```

#### 6. **NotificationPanel.jsx** (CREATED)
Complete notification panel with filtering

**Props:**
```javascript
<NotificationPanel 
  isOpen={true}
  onClose={() => {}}
/>
```

---

## Notification Types

| Type | Icon | Color | Event |
|------|------|-------|-------|
| `message` | 💬 | Blue | New chat message |
| `friend_request` | 👥 | Purple | Incoming friend request |
| `friend_accepted` | ✅ | Green | Friend request accepted |
| `call_incoming` | 📞 | Yellow | Incoming call |
| `call_missed` | 📭 | Red | Missed call |
| `mention` | @ | Orange | User mentioned |
| `reaction` | 😊 | Pink | Message reaction |
| `system` | ℹ️ | Gray | System message |

---

## Usage Examples

### Basic Setup - Show Notification Badge

```javascript
import { NotificationBadge } from '../components/notifications/NotificationBadge.jsx';

export function Header() {
  return (
    <div className="relative">
      <button className="p-2">
        🔔
        <NotificationBadge size="md" />
      </button>
    </div>
  );
}
```

### Show Full Notification Panel

```javascript
import { useState } from 'react';
import { NotificationPanel } from '../components/notifications/NotificationPanel.jsx';

export function NotificationsPage() {
  return (
    <div className="p-4">
      <NotificationPanel isOpen={true} />
    </div>
  );
}
```

### Custom Hook Usage

```javascript
import useNotifications from '../hooks/useNotifications.js';

export function MyComponent() {
  const {
    unreadCount,
    notifications,
    readNotification,
    readAllNotifications,
    soundEnabled,
    toggleSound,
  } = useNotifications();

  return (
    <div>
      <h2>Unread: {unreadCount}</h2>
      
      <button onClick={readAllNotifications}>
        Mark All as Read
      </button>

      <button onClick={toggleSound}>
        {soundEnabled ? '🔔 Sound' : '🔕 Muted'}
      </button>

      <ul>
        {notifications.map(notif => (
          <li key={notif._id}>
            <span>{notif.title}</span>
            <button onClick={() => readNotification(notif._id)}>
              {notif.isRead ? '✓' : 'Read'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Filter Notifications by Type

```javascript
import useNotifications from '../hooks/useNotifications.js';

export function MessageNotifications() {
  const { getByType } = useNotifications();
  const messages = getByType('message');

  return (
    <div>
      <h3>Message Notifications ({messages.length})</h3>
      <ul>
        {messages.map(msg => (
          <li key={msg._id}>{msg.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Sound Control

```javascript
import useNotifications from '../hooks/useNotifications.js';

export function SoundSettings() {
  const { soundEnabled, toggleSound, testSound } = useNotifications();

  return (
    <div className="space-y-2">
      <button onClick={toggleSound}>
        {soundEnabled ? 'Disable Sound' : 'Enable Sound'}
      </button>
      
      {soundEnabled && (
        <button onClick={testSound}>
          Test Sound
        </button>
      )}
    </div>
  );
}
```

---

## Cross-Tab Synchronization

The system automatically syncs notifications across browser tabs:

```
Tab 1: Receives notification "User sent message"
  ↓
BroadcastChannel broadcasts to all other tabs
  ↓
Tab 2: Also receives notification
Tab 3: Also receives notification
  ↓
All tabs show unread badge: 1
  ↓
User reads in Tab 1
  ↓
BroadcastChannel broadcasts "notification_read"
  ↓
Tab 2 & 3: Also mark as read, badge updates to 0
```

No manual sync required - happens automatically when using the hook.

---

## Sound Setup

### Enable Sound
1. Place audio file at `/public/notification-sound.mp3`
2. File should be MP3 format, ~1-2 seconds
3. User can toggle in notification settings

### Recommended Sound
- Short, non-intrusive beep
- ~0.5 second duration
- Moderate volume (can adjust in code at 0.5)

### Volume Control
Modify in `notificationStore.js`:
```javascript
const audio = new Audio('/notification-sound.mp3');
audio.volume = 0.5; // Change from 0 to 1
```

---

## Notification Persistence

Notifications are stored in MongoDB and persist:
- Across sessions
- Across devices (same user account)
- Until explicitly deleted

### Cleanup
Old notifications can be archived/deleted with:
```javascript
const { clearAllNotifications } = useNotifications();
clearAllNotifications(); // Clears local only
```

---

## Performance

### Memory
- Notifications cached in Zustand store
- Auto-cleanup on session end
- BroadcastChannel in memory only

### Network
- Paginated fetching (20 per request)
- Socket updates only on state change
- Debounced sound playing

### Database
- Indexed queries: `userId`, `isRead`, `createdAt`
- Efficient updates for read status
- No N+1 queries (uses populate)

---

## Testing

### Test New Notifications
```javascript
// In browser console
const { addNotification } = useNotificationStore.getState();
addNotification({
  _id: 'test-' + Date.now(),
  userId: 'your-id',
  type: 'message',
  title: 'Test Notification',
  description: 'This is a test',
  isRead: false,
  createdAt: new Date(),
});
```

### Test Cross-Tab Sync
1. Open app in Tab 1
2. Open app in Tab 2
3. In Tab 1 console: `window.bc = new BroadcastChannel('notifications'); bc.postMessage({type: 'unread_count', count: 5})`
4. Tab 2 should update

### Test Sound
```javascript
const { testSound } = useNotificationStore.getState();
testSound();
```

---

## Configuration

### Change Notification Limit
In `useNotifications.js`:
```javascript
getNotifications(50, 0) // Change 20 to 50
```

### Change Auto-Play Sound
In `notificationStore.js`, comment out:
```javascript
// if (get().soundEnabled) {
//   get().playNotificationSound();
// }
```

### Disable Cross-Tab Sync
In `notificationStore.js`, comment out BroadcastChannel section.

---

## Troubleshooting

### Sound Not Playing
- Check `/public/notification-sound.mp3` exists
- Check browser autoplay policy (may require user interaction)
- Check volume isn't muted in browser
- Check console for errors

### Notifications Not Appearing
- Check Socket.io connection
- Check `initializeNotificationListeners` is called
- Check browser DevTools Network tab for socket events
- Check unread count is > 0

### Cross-Tab Sync Not Working
- BroadcastChannel only works same origin
- Check browser supports BroadcastChannel (all modern browsers)
- Check console for errors

---

## Breaking Changes

✅ **None** - Fully backward compatible with:
- Existing notification socket events
- Existing notification model
- Live features system
- Presence system
- Chat messages

Old notification code continues to work.

---

## Future Enhancements

- [ ] Notification preferences per type
- [ ] Desktop notifications (Web Notification API)
- [ ] Email digest notifications
- [ ] Notification scheduling
- [ ] Notification analytics/stats
- [ ] Rich media notifications (images, thumbnails)
- [ ] Notification grouping by type/sender
- [ ] Notification archiving instead of deletion
- [ ] Notification read receipts
- [ ] Custom notification sounds per type

---

## File Structure

**Backend:**
- `/backend/src/services/notificationService.js` (Enhanced)
- `/backend/src/sockets/notifications.js` (New)
- `/backend/src/sockets/chat.js` (Enhanced)
- `/backend/src/sockets/index.js` (Updated)

**Frontend:**
- `/frontend/src/store/notificationStore.js` (Enhanced)
- `/frontend/src/hooks/useNotifications.js` (New)
- `/frontend/src/services/socket.js` (Enhanced)
- `/frontend/src/components/notifications/NotificationBadge.jsx` (New)
- `/frontend/src/components/notifications/NotificationItem.jsx` (New)
- `/frontend/src/components/notifications/NotificationPanel.jsx` (New)

**Documentation:**
- `/NOTIFICATIONS_SYSTEM.md` (This file)
- `/NOTIFICATIONS_QUICK_REF.md` (Quick reference)
- `/NOTIFICATIONS_INTEGRATION_GUIDE.md` (Integration guide)

---

## Summary

Complete real-time notifications system with:
✅ Real-time Socket.io integration
✅ Notification badge indicators
✅ Sound alerts (optional)
✅ Cross-tab synchronization
✅ Message & friend request notifications
✅ Full notification management (read, delete, clear)
✅ Type filtering and categorization
✅ Zero breaking changes

**Ready to use immediately in any component.**
