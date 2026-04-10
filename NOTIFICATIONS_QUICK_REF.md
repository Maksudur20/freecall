## Notifications System Quick Reference

### Most Common Operations

#### Display Badge with Count
```javascript
import { NotificationBadge } from '../components/notifications';

<div className="relative">
  <button>🔔</button>
  <NotificationBadge size="md" />
</div>
```

#### Get Unread Count
```javascript
const { unreadCount } = useNotifications();
<span>{unreadCount} unread notifications</span>
```

#### Show All Notifications
```javascript
import { NotificationPanel } from '../components/notifications';

<NotificationPanel isOpen={true} onClose={() => {}} />
```

#### Mark Single as Read
```javascript
const { readNotification } = useNotifications();
readNotification(notificationId);
```

#### Mark All as Read
```javascript
const { readAllNotifications } = useNotifications();
readAllNotifications();
```

#### Delete Notification
```javascript
const { removeNotification } = useNotifications();
removeNotification(notificationId);
```

#### Toggle Sound
```javascript
const { soundEnabled, toggleSound } = useNotifications();
<button onClick={toggleSound}>
  {soundEnabled ? '🔔' : '🔕'}
</button>
```

#### Get Messages Only
```javascript
const { getByType } = useNotifications();
const messages = getByType('message');
```

#### Get Unread Only
```javascript
const { getUnread } = useNotifications();
const unread = getUnread();
```

### Hook Options
```javascript
useNotifications({
  autoInit: true,        // Initialize listeners (default: true)
  fetchOnMount: true,    // Fetch on component mount (default: true)
  soundEnabled: true,    // Enable sound (default: true)
})
```

### Notification Types
- `message` - Chat message
- `friend_request` - Friend request
- `friend_accepted` - Request accepted
- `call_incoming` - Incoming call
- `call_missed` - Missed call
- `mention` - User mentioned
- `reaction` - Emoji reaction
- `system` - System message

### Utility Methods
```javascript
const { 
  getTypeLabel,    // 'message' → 'Message'
  getTypeIcon,     // 'message' → '💬'
  getTypeColor,    // Returns Tailwind classes
} = useNotifications();
```

### Notification Object Structure
```javascript
{
  _id: "ObjectId",
  userId: "ObjectId",
  actorId: "ObjectId",
  type: 'message|friend_request|...',
  title: "New message from John",
  description: "You have a new message",
  referenceId: "ObjectId",
  referenceModel: "Message",
  isRead: false,
  readAt: Date|null,
  actionUrl: "/chat/123",
  metadata: { conversationId: "123" },
  createdAt: Date,
  updatedAt: Date,
  actorId_expanded: { username: "john", profilePicture: "url" }
}
```

### Filter with BroadcastChannel (Advanced)
```javascript
const { broadcastToTabs } = useNotifications();
broadcastToTabs({
  type: 'unread_count',
  count: 5,
});
```

### Test Sound
```javascript
const { testSound } = useNotifications();
testSound(); // Plays notification sound
```

### Status Colors (Tailwind)
```javascript
'message' → 'bg-blue-100 border-blue-300'
'friend_request' → 'bg-purple-100 border-purple-300'
'friend_accepted' → 'bg-green-100 border-green-300'
'call_incoming' → 'bg-yellow-100 border-yellow-300'
'call_missed' → 'bg-red-100 border-red-300'
'mention' → 'bg-orange-100 border-orange-300'
```

### Socket Events (Direct)
```javascript
import { socketNotification } from '../services/socket.js';

// Emit
socketNotification.getUnreadCount(userId);
socketNotification.markNotificationRead(notificationId);
socketNotification.markAllRead(userId);
socketNotification.deleteNotification(notificationId);
socketNotification.setNotificationSound(userId, true);

// Listen
socketNotification.onNotification((data) => {});
socketNotification.onNotificationRead((data) => {});
socketNotification.onNotificationDeleted((data) => {});
```

### Store State (Direct Access)
```javascript
import { useNotificationStore } from '../store/notificationStore.js';

const store = useNotificationStore();
console.log(store.notifications);    // Array of notifications
console.log(store.unreadCount);      // Unread count
console.log(store.badgeCount);       // Badge count
console.log(store.soundEnabled);     // Sound preference
```

### Common Patterns

#### Notification Bell with Dropdown
```javascript
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { badgeCount } = useNotifications();

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2"
      >
        🔔
        {badgeCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white 
                          rounded-full w-5 h-5 text-xs flex items-center 
                          justify-center">{badgeCount}</span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
```

#### Notification Toast
```javascript
function useNotificationToast() {
  const { notifications } = useNotifications();
  const [visible, setVisible] = useState(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setVisible(latest);
      const timer = setTimeout(() => setVisible(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return visible && (
    <div className="fixed bottom-4 right-4 bg-white shadow p-4 rounded">
      {visible.title}
    </div>
  );
}
```

#### Unread Count in Tab Title
```javascript
useEffect(() => {
  const { updateDocumentTitle } = useNotificationStore.getState();
  updateDocumentTitle();
}, [unreadCount]);
```

### Data Access Patterns

#### Get notification by ID
```javascript
const { getById } = useNotifications();
const notif = getById(notificationId);
```

#### Get type label and icon
```javascript
const { getTypeLabel, getTypeIcon } = useNotifications();
console.log(getTypeLabel('message'));    // 'Message'
console.log(getTypeIcon('message'));     // '💬'
```

#### Check if has unread
```javascript
const { unreadCount } = useNotifications();
if (unreadCount > 0) { /* show badge */ }
```

### Configuration Quick Tips

**Enable sound:**
```javascript
const { soundEnabled, toggleSound } = useNotifications();
if (!soundEnabled) toggleSound();
```

**Auto-mute sound on load:**
```javascript
const { setSoundEnabled } = useNotificationStore.getState();
setSoundEnabled(false);
```

**Fetch more notifications:**
```javascript
const { getNotifications } = useNotifications();
getNotifications(50, 0); // 50 per page
```

### Error Handling
```javascript
const { error, clearError } = useNotifications();

if (error) {
  console.error(error);
  clearError();
}
```

### Cleanup
```javascript
useEffect(() => {
  return () => {
    const { cleanupListeners } = useNotificationStore.getState();
    cleanupListeners();
  };
}, []);
```
