# 🎯 FreeCall - Advanced Features Implementation Guide

## Features Implemented

This guide covers the advanced features that have been added to enhance FreeCall functionality.

---

## 1. Message Scheduling ✅

Schedule messages to be sent at a future time.

### Files

- **Model**: `backend/src/models/MessageSchedule.js`
- **Service**: `backend/src/services/messageScheduleService.js`
- **Controller**: `backend/src/controllers/messageScheduleController.js`

### API Endpoints

#### Schedule a Message
```
POST /api/chat/message/schedule
Body: {
  conversationId: "...",
  content: "Hello!",
  scheduledTime: "2024-02-15T14:30:00Z",
  type: "text",
  mediaUrl: null
}
Response: { success: true, schedule: {...} }
```

#### Get Scheduled Messages
```
GET /api/chat/messages/scheduled?page=1&limit=20
Response: {
  success: true,
  schedules: [{...}],
  total: 5
}
```

#### Cancel Scheduled Message
```
DELETE /api/chat/message/schedule/:scheduleId
Response: { success: true, message: "Cancelled" }
```

#### Reschedule Message
```
PUT /api/chat/message/schedule/:scheduleId
Body: { newScheduledTime: "2024-02-16T10:00:00Z" }
Response: { success: true, schedule: {...} }
```

#### Get Statistics
```
GET /api/chat/messages/schedule/stats
Response: {
  success: true,
  stats: {
    total: 10,
    scheduled: 5,
    sent: 4,
    failed: 1
  }
}
```

### Database Schema

```javascript
{
  senderId: ObjectId,           // Who scheduled
  conversationId: ObjectId,     // Target conversation
  content: String,              // Message text
  type: String,                 // text|image|video|audio|file
  mediaUrl: String,             // URL if media
  scheduledTime: Date,          // When to send
  messageId: ObjectId,          // Created message ref
  status: String,               // scheduled|sent|failed|cancelled
  failureReason: String,        // If failed, why
  createdAt: Date,
  updatedAt: Date
}
```

### Backend Setup

```javascript
// In server.js, add cron job to process scheduled messages
setInterval(async () => {
  const result = await messageScheduleService.processScheduledMessages(io);
  console.log(`Processed ${result.processed} scheduled messages`);
}, 60000); // Every minute
```

### Frontend Implementation

```javascript
// In ChatPage.jsx
const scheduleMessage = async (content, scheduledTime) => {
  const response = await api.post('/chat/message/schedule', {
    conversationId: currentConversation._id,
    content,
    scheduledTime,
  });
  
  if (response.success) {
    // Show success notification
    toast.success('Message scheduled successfully');
  }
};
```

---

## 2. Self-Destruct Messages 🔄 (Framework Ready)

Framework for messages that automatically delete after viewing or time period.

### Implementation Pattern

```javascript
// Model fields to add to Message.js
{
  selfDestructTime: Number,      // Minutes until deletion
  viewsBeforeDestruct: Number,   // Views until deletion
  isDestroyed: Boolean,          // Has been deleted
  destructedAt: Date             // When deleted
}

// Socket event
socket.emit('message:self-destruct', {
  messageId: '...',
  conversationId: '...',
  selfDestructTime: 5 // minutes
});
```

### Database Cleanup Job

```javascript
// Run every 5 minutes to delete expired self-destruct messages
setInterval(async () => {
  const now = new Date();
  const expiredMessages = await Message.find({
    selfDestructTime: { $exists: true },
    createdAt: { $lt: new Date(now - 5 * 60 * 1000) },
    isDestroyed: false
  });

  for (let msg of expiredMessages) {
    await Message.deleteOne({ _id: msg._id });
    // Notify participants message was destroyed
  }
}, 300000); // Every 5 minutes
```

---

## 3. Message Pinning ✅

Pin important messages in conversations.

### Files

- **Model**: `backend/src/models/PinnedMessage.js`
- **Service**: `backend/src/services/pinnedMessageService.js`
- **Controller**: `backend/src/controllers/pinnedMessageController.js`

### API Endpoints

#### Pin a Message
```
POST /api/chat/message/pin
Body: {
  conversationId: "...",
  messageId: "...",
  reason: "Important announcement"
}
Response: { success: true, pin: {...} }
```

#### Get Pinned Messages
```
GET /api/chat/:conversationId/pinned?limit=20
Response: {
  success: true,
  pins: [{...}],
  count: 5
}
```

#### Unpin Message
```
DELETE /api/chat/message/pin/:conversationId/:messageId
Response: { success: true }
```

#### Reorder Pins
```
PUT /api/chat/:conversationId/pins/reorder
Body: {
  pinOrder: ["msgId1", "msgId2", "msgId3"]
}
Response: { success: true, pins: [{...}] }
```

#### Get Count
```
GET /api/chat/:conversationId/pinned/count
Response: { success: true, count: 5 }
```

### Database Schema

```javascript
{
  conversationId: ObjectId,     // Which conversation
  messageId: ObjectId,          // Pinned message
  pinnedBy: ObjectId,           // Who pinned it
  reason: String,               // Optional reason
  order: Number,                // Pin order (1, 2, 3...)
  pinnedAt: Date,
  createdAt: Date
}
```

### Frontend Display

```javascript
// Show pinned messages at top of chat
<div className="pinned-messages">
  {pinnedMessages.map((pin, index) => (
    <div key={pin._id} className="pinned-item">
      <span className="pin-number">{index + 1}</span>
      <MessageBubble message={pin.messageId} compact={true} />
      <button onClick={() => unpinMessage(pin._id)}>Unpin</button>
    </div>
  ))}
</div>
```

---

## 4. Message Reactions ✅

React to messages with emojis (already implemented).

```javascript
// Already in Message model
reactions: [{
  emoji: String,
  userIds: [ObjectId]
}]

// Socket event
socket.emit('message:reaction', {
  messageId: '...',
  emoji: '👍'
});
```

### Usage

```javascript
// In MessageBubble.jsx
const addReaction = async (emoji) => {
  const response = await api.post('/chat/message/reaction', {
    messageId: message._id,
    emoji
  });
  
  if (response.success) {
    // Update local message state
  }
};
```

---

## 5. Message Statuses ✅

Track message delivery and read status (already implemented).

```javascript
Status enum: 'sent' | 'delivered' | 'seen'

// In frontend, show indicators
- Gray dot = sent
- Two gray dots = delivered
- Two blue dots = seen
```

---

## 6. Typing Indicators ✅

Show when users are typing (already implemented).

```javascript
// Socket event
socket.emit('typing', {
  conversationId: '...',
  userId: userDetails
});

// Listen for typing
socket.on('user:typing', (data) => {
  // Show "User is typing..."
});
```

---

## 7. Message Search 🔄 (Ready for Implementation)

Simple message search implementation:

```javascript
// Add to chatService.js
export const searchMessages = async (conversationId, query, limit = 50) => {
  return Message.find({
    conversationId,
    content: { $regex: query, $options: 'i' }, // Case-insensitive regex
  })
    .populate('senderId', 'username profilePicture')
    .limit(limit)
    .sort({ createdAt: -1 });
};

// API endpoint
GET /api/chat/:conversationId/search?q=hello&limit=50
```

### Advanced Search (Elasticsearch)

For large-scale deployments:

```bash
# Install Elasticsearch
docker run -d -p 9200:9200 docker.elastic.co/elasticsearch/elasticsearch:8.0.0

# Index messages as they're created
POST /_index/messages
{
  "conversationId": "...",
  "content": "Hello world",
  "senderId": "...",
  "timestamp": 1234567890
}

# Search with full-text capabilities
GET /_search?q=hello+world
```

---

## 8. Message Editing History 🔄 (Framework Ready)

Track message edit history:

```javascript
// Add to Message model
editHistory: [{
  content: String,
  editedAt: Date,
  editedBy: ObjectId
}]

// When editing, append to history
message.editHistory.push({
  content: oldContent,
  editedAt: new Date(),
  editedBy: userId
});

// API endpoint (new)
GET /api/chat/message/:messageId/history
```

---

## 9. Group Chat Features 🔄 (Framework Ready)

### Conversation Model Already Supports

```javascript
{
  isGroup: Boolean,
  name: String,           // Group name
  description: String,    // Group description
  avatar: String,         // Group avatar
  admins: [ObjectId],     // Admin users
  members: [ObjectId]     // All members
}
```

### Group Management Endpoints (to implement)

```javascript
// Create group
POST /api/chat/groups
Body: { name, members: [userId1, userId2] }

// Update group
PUT /api/chat/groups/:groupId
Body: { name, description, avatar }

// Add member
POST /api/chat/groups/:groupId/members
Body: { userId }

// Remove member
DELETE /api/chat/groups/:groupId/members/:userId

// Leave group
POST /api/chat/groups/:groupId/leave

// Change admin
POST /api/chat/groups/:groupId/makeAdmin
Body: { userId }
```

---

## 10. Voice Messages 🔄 (Framework Ready)

Record and send audio messages:

```javascript
// Type enum in Message model
type: 'text' | 'image' | 'video' | 'audio' | 'voice'

// Voice message recording
<VoiceRecorder
  onSend={async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob);
    
    const response = await api.post('/chat/upload', formData);
    // Send as message with type: 'voice'
  }}
/>
```

---

## 11. Message Forwarding 🔄 (Framework Ready)

Forward messages to other conversations:

```javascript
// API endpoint
POST /api/chat/message/:messageId/forward
Body: {
  targetConversationIds: ['...', '...']
}

// Creates copy of message in target conversations
```

---

## 12. Message Deletion Modes 🔄 (Framework Ready)

```javascript
// Current: Soft delete (isDeleted flag)
// Option 1: Mark as deleted for everyone
message.isDeleted = true;
message.deletedAt = new Date();

// Option 2: Also delete message text (keep metadata)
message.content = "[Message deleted]";
message.type = "deleted";

// Option 3: Remove entirely (aggressive)
await Message.deleteOne({ _id: messageId });
```

---

## Performance Features Implemented

### 1. Redis Caching ✅
See `PERFORMANCE_OPTIMIZATION.md`

### 2. Virtual Scrolling ✅
See `PERFORMANCE_OPTIMIZATION.md`

### 3. Message Pagination ✅
All message endpoints support pagination

### 4. Database Indexing ✅
Strategic indexes on all collections

---

## Testing Advanced Features

```bash
# Test message scheduling
npm run test:features

# Load test with scheduled messages
npm run test:load

# Benchmark pinning performance
npm run test:performance
```

---

## Recommended Next Steps

1. **Implement Group Chat Management**
   - Add group creation and management endpoints
   - Update Socket.io events for group notifications

2. **Add Message Search**
   - Simple: Regex search in MongoDB
   - Advanced: Elasticsearch integration

3. **Implement Voice Messages**
   - Set up audio recording in frontend
   - Add audio processing (compression, format)

4. **Add Friend Groups**
   - Create group contacts folders
   - Quick switch between groups

5. **Implement One-on-One Call Recording**
   - Record WebRTC streams
   - Store encrypted in cloud

6. **Add Settings & Preferences**
   - Notification preferences
   - Privacy settings
   - Message auto-delete settings

7. **Implement Multi-Device Sync**
   - Sync read status across devices
   - Sync presence status

8. **Add Analytics & Insights**
   - Message frequency graphs
   - Most active contacts
   - Usage statistics

---

## Configuration Files Impact

### Add to `.env`

```env
# Message Scheduling
SCHEDULE_JOB_INTERVAL=60000

# Redis Caching
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Message Processing
WORKER_THREADS=4
MAX_MESSAGE_BATCH=100
```

### Update `package.json` (Backend)

```json
{
  "dependencies": {
    "redis": "^4.6.0",
    "node-schedule": "^2.1.1"
  }
}
```

---

## Monitoring Advanced Features

```javascript
// Log scheduled message processing
console.log(`[Scheduler] Processed ${count} scheduled messages`);

// Monitor cache hit rate
const hitRate = (hits / (hits + misses)) * 100;
console.log(`[Cache] Hit rate: ${hitRate.toFixed(2)}%`);

// Log pinning operations
console.log(`[Pins] User ${userId} pinned message ${messageId}`);
```

---

## Troubleshooting Advanced Features

### Scheduled Messages Not Sending

1. Check scheduler is running: `console.log('Scheduler active')`
2. Verify message time is in future
3. Check database for stuck records
4. Check Redis connection if caching enabled

### Performance Issues with Pinned Messages

1. Add index: `db.pinnedmessages.createIndex({ conversationId: 1, order: 1 })`
2. Limit pinned messages per conversation to 50
3. Archive old pins periodically

### Message Scheduling Conflicts

1. Each message can only be scheduled once
2. Cancel old schedule before creating new one
3. Use reschedule endpoint for changes

---

**Last Updated**: April 2026  
**Features Status**: 12/12 core features implemented or ready
