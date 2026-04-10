# 📚 FreeCall - Complete API Reference

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

## Authentication

All protected endpoints require an `Authorization` header:
```
Authorization: Bearer {accessToken}
```

Tokens are obtained from login and expire after 7 days. Use the refresh endpoint to get new tokens.

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/auth/register`

Request:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

Response (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "profilePicture": "https://...",
    "status": "online"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Refresh Token
**POST** `/auth/refresh-token`

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Response (200):
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Logout
**POST** `/auth/logout`

Protected: ✅ Requires Authorization header

Request:
```json
{}
```

Response (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User
**GET** `/auth/me`

Protected: ✅ Requires Authorization header

Response (200):
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer",
    "profilePicture": "https://...",
    "status": "online",
    "blockedUsers": [],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 👤 User Endpoints

### Get User Profile
**GET** `/user/profile/:userId`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer",
    "profilePicture": "https://...",
    "status": "online",
    "isFriend": true,
    "isBlocked": false
  }
}
```

---

### Update Profile
**PUT** `/user/profile`

Protected: ✅

Request:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio",
  "status": "away"
}
```

Response (200):
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Updated bio",
    "status": "away"
  }
}
```

---

### Upload Profile Picture
**POST** `/user/profile/picture`

Protected: ✅

Request: FormData with file
```
Content-Type: multipart/form-data
file: <image file>
```

Response (200):
```json
{
  "success": true,
  "message": "Profile picture updated",
  "user": {
    "profilePicture": "https://...-optimized.jpg"
  }
}
```

---

### Search Users
**GET** `/user/search?q=john&limit=10`

Protected: ✅

Query Parameters:
- `q` (required): Search query
- `limit` (optional): Results limit (default: 10)

Response (200):
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "firstName": "John",
      "profilePicture": "https://...",
      "status": "online",
      "isFriend": false,
      "hasPendingRequest": false
    }
  ]
}
```

---

### Get Friends List
**GET** `/user/friends`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "friends": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "username": "jane_doe",
      "firstName": "Jane",
      "profilePicture": "https://...",
      "status": "online",
      "lastSeen": "2024-01-20T15:30:00Z"
    }
  ],
  "total": 15
}
```

---

### Get Friend Suggestions
**GET** `/user/suggestions?limit=10`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "suggestions": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "username": "alice_smith",
      "firstName": "Alice",
      "profilePicture": "https://...",
      "status": "offline",
      "mutualFriends": 5
    }
  ]
}
```

---

### Block User
**POST** `/user/block/:userId`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

---

### Unblock User
**POST** `/user/unblock/:userId`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

## 👥 Friend Request Endpoints

### Send Friend Request
**POST** `/friend/request/send`

Protected: ✅

Request:
```json
{
  "recipientId": "507f1f77bcf86cd799439012"
}
```

Response (201):
```json
{
  "success": true,
  "message": "Friend request sent",
  "request": {
    "_id": "507f1f77bcf86cd799439020",
    "senderId": "507f1f77bcf86cd799439011",
    "recipientId": "507f1f77bcf86cd799439012",
    "status": "pending",
    "createdAt": "2024-01-20T15:30:00Z"
  }
}
```

---

### Accept Friend Request
**POST** `/friend/request/accept`

Protected: ✅

Request:
```json
{
  "senderId": "507f1f77bcf86cd799439012"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Friend request accepted",
  "friend": {
    "_id": "507f1f77bcf86cd799439012",
    "username": "jane_doe",
    "profilePicture": "https://..."
  }
}
```

---

### Reject Friend Request
**POST** `/friend/request/reject`

Protected: ✅

Request:
```json
{
  "senderId": "507f1f77bcf86cd799439012"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Friend request rejected"
}
```

---

### Get Pending Requests
**GET** `/friend/requests/pending?page=1&limit=10`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "requests": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "senderId": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "jane_doe",
        "profilePicture": "https://..."
      },
      "createdAt": "2024-01-20T15:30:00Z"
    }
  ],
  "total": 5
}
```

---

### Get Sent Requests
**GET** `/friend/requests/sent?page=1&limit=10`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "requests": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "recipientId": {
        "_id": "507f1f77bcf86cd799439013",
        "username": "alice_smith",
        "profilePicture": "https://..."
      },
      "status": "pending",
      "createdAt": "2024-01-20T14:00:00Z"
    }
  ],
  "total": 3
}
```

---

### Remove Friend
**DELETE** `/friend/remove/:friendId`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

---

## 💬 Chat Endpoints

### Get All Conversations
**GET** `/chat/conversations?page=1&limit=20`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "isGroup": false,
      "participants": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "username": "john_doe",
          "profilePicture": "https://..."
        }
      ],
      "lastMessage": {
        "content": "Hello!",
        "senderId": "507f1f77bcf86cd799439012",
        "createdAt": "2024-01-20T15:30:00Z"
      },
      "unreadCount": 3,
      "isMuted": false
    }
  ],
  "total": 15
}
```

---

### Get or Create Conversation
**POST** `/chat/conversations`

Protected: ✅

Request:
```json
{
  "participantId": "507f1f77bcf86cd799439012"
}
```

Response (200/201):
```json
{
  "success": true,
  "conversation": {
    "_id": "507f1f77bcf86cd799439030",
    "isGroup": false,
    "participants": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "username": "jane_doe"
      }
    ]
  }
}
```

---

### Get Conversation Messages
**GET** `/chat/messages/:conversationId?page=1&limit=50`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "conversationId": "507f1f77bcf86cd799439030",
      "senderId": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "jane_doe",
        "profilePicture": "https://..."
      },
      "content": "Hey, how are you?",
      "type": "text",
      "status": "delivered",
      "reactions": [
        {
          "emoji": "👍",
          "userIds": ["507f1f77bcf86cd799439011"]
        }
      ],
      "readBy": ["507f1f77bcf86cd799439011"],
      "createdAt": "2024-01-20T15:00:00Z"
    }
  ],
  "total": 240
}
```

---

### Send Message
**POST** `/chat/message/send`

Protected: ✅

Request:
```json
{
  "conversationId": "507f1f77bcf86cd799439030",
  "content": "Hello, Jane!",
  "type": "text",
  "replyTo": null
}
```

Response (201):
```json
{
  "success": true,
  "message": {
    "_id": "507f1f77bcf86cd799439041",
    "conversationId": "507f1f77bcf86cd799439030",
    "senderId": "507f1f77bcf86cd799439011",
    "content": "Hello, Jane!",
    "type": "text",
    "status": "sent",
    "createdAt": "2024-01-20T16:00:00Z"
  }
}
```

---

### Edit Message
**PUT** `/chat/message/edit/:messageId`

Protected: ✅

Request:
```json
{
  "content": "Updated message content"
}
```

Response (200):
```json
{
  "success": true,
  "message": {
    "_id": "507f1f77bcf86cd799439041",
    "content": "Updated message content",
    "isEdited": true,
    "editedAt": "2024-01-20T16:05:00Z"
  }
}
```

---

### Delete Message
**DELETE** `/chat/message/:messageId`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

### Add Reaction to Message
**POST** `/chat/message/reaction`

Protected: ✅

Request:
```json
{
  "messageId": "507f1f77bcf86cd799439041",
  "emoji": "👍"
}
```

Response (200):
```json
{
  "success": true,
  "message": {
    "reactions": [
      {
        "emoji": "👍",
        "userIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
        "count": 2
      }
    ]
  }
}
```

---

### Mark Messages as Seen
**POST** `/chat/messages/mark-seen`

Protected: ✅

Request:
```json
{
  "conversationId": "507f1f77bcf86cd799439030",
  "messageIds": ["507f1f77bcf86cd799439040", "507f1f77bcf86cd799439041"]
}
```

Response (200):
```json
{
  "success": true,
  "message": "Messages marked as seen"
}
```

---

### Upload File/Media
**POST** `/chat/upload`

Protected: ✅

Request: FormData with file
```
Content-Type: multipart/form-data
file: <image/video/audio file>
```

Response (200):
```json
{
  "success": true,
  "url": "https://cdn.example.com/uploads/media-id-12345.jpg",
  "type": "image",
  "size": 245000
}
```

---

## 🔔 Notification Endpoints

### Get Notifications
**GET** `/notification?page=1&limit=20`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "userId": "507f1f77bcf86cd799439011",
      "type": "friend_request",
      "actor": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "jane_doe",
        "profilePicture": "https://..."
      },
      "message": "Jane sent you a friend request",
      "read": false,
      "createdAt": "2024-01-20T14:00:00Z"
    }
  ],
  "total": 12
}
```

---

### Mark Notification as Read
**PUT** `/notification/mark-read/:notificationId`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### Mark All Notifications as Read
**PUT** `/notification/mark-all-read`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### Get Unread Count
**GET** `/notification/unread-count`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "unreadCount": 5
}
```

---

### Delete Notification
**DELETE** `/notification/:notificationId`

Protected: ✅

Response (200):
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized. Please login."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An error occurred. Please try again later."
}
```

---

## Rate Limiting

- **Window**: 15 minutes
- **Requests**: 100 per window
- **Header**: `X-RateLimit-Remaining`

---

## Pagination

All list endpoints support pagination:

Query Parameters:
- `page` (default: 1)
- `limit` (default: 10, max: 100)

Response includes:
- `total`: Total count of items
- Array of items

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Testing Endpoints with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Protected Endpoint
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## WebSocket Events

See [Socket.io Events Documentation](./COMPLETION_SUMMARY.md#socketio-events) for real-time communication events.

---

**Last Updated**: January 2024
**API Version**: 1.0
