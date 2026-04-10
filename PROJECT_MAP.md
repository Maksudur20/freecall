# 📂 FreeCall - Project Structure & File Reference

## Project Organization

```
freecall/
├── backend/                    # Node.js/Express Backend
│   ├── src/
│   │   ├── models/            # MongoDB Schemas
│   │   ├── controllers/       # Route Handlers
│   │   ├── services/          # Business Logic
│   │   ├── routes/            # API Endpoints
│   │   ├── middleware/        # Auth, Validation, Errors
│   │   ├── sockets/           # WebSocket Handlers
│   │   └── server.js          # Express Server
│   ├── .env.example           # Environment Template
│   ├── package.json           # Dependencies
│   └── Dockerfile             # Container Image
│
├── frontend/                   # React/Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable Components
│   │   ├── pages/             # Page Components
│   │   ├── stores/            # Zustand State
│   │   ├── services/          # API & Socket Clients
│   │   ├── styles/            # CSS Files
│   │   ├── App.jsx            # Root Component
│   │   └── main.jsx           # Entry Point
│   ├── .env.example           # Environment Template
│   ├── vite.config.js         # Build Configuration
│   ├── tailwind.config.js     # Styling Configuration
│   ├── package.json           # Dependencies
│   └── Dockerfile             # Container Image
│
├── Documentation/             # Project Guides
│   ├── README.md             # Project Overview
│   ├── QUICK_START.md        # Setup Instructions
│   ├── COMPLETION_SUMMARY.md # Feature Overview
│   ├── API_REFERENCE.md      # Endpoint Documentation
│   ├── DEPLOYMENT.md         # Production Setup
│   ├── TESTING.md            # Testing Guide
│   ├── TROUBLESHOOTING.md    # Error Solutions
│   └── PROJECT_MAP.md        # This File
│
├── Configuration Files/
│   ├── docker-compose.yml    # Multi-container Setup
│   ├── .env.example          # Root Env Template
│   └── .gitignore            # Source Control

```

---

## Backend Files Reference

### Core Server

**`backend/src/server.js`** (Main Entry Point)
- Purpose: Start Express server, configure middleware, initialize Socket.io
- Key: Main application initialization
- Used By: `npm start` / `npm run dev:backend`
- Dependencies: Express, Socket.io, MongoDB

### Models (Database Schemas)

**`backend/src/models/User.js`**
- Purpose: User profile schema with authentication
- Fields: username, email, password, profile, status, blockedUsers
- Indexes: email (unique), username, status
- Used By: Auth, user controllers

**`backend/src/models/Conversation.js`**
- Purpose: Chat conversation schema (1-to-1 and group)
- Fields: participants, lastMessage, lastMessageAt, unreadCount
- Indexes: participants, lastMessageAt
- Used By: Chat controllers

**`backend/src/models/Message.js`**
- Purpose: Chat message schema with reactions and editing
- Fields: conversationId, senderId, content, type, reactions, readBy, replyTo
- Indexes: conversationId, createdAt, senderId
- Used By: Chat controllers

**`backend/src/models/FriendRequest.js`**
- Purpose: Friend request lifecycle management
- Fields: senderId, recipientId, status, message
- Indexes: senderId, recipientId, status
- Used By: Friend controllers

**`backend/src/models/Notification.js`**
- Purpose: User notification storage
- Fields: userId, type, actor, message, read, relatedId
- Indexes: userId, createdAt, read
- Used By: Notification controllers

**`backend/src/models/Call.js`**
- Purpose: Call history and call records
- Fields: callerId, receiverId, type, duration, status, startedAt, endedAt
- Indexes: callerId, receiverId, createdAt
- Used By: Call handlers

### Controllers (Request Handlers)

**`backend/src/controllers/authController.js`**
- Purpose: Authentication operations
- Methods: registerUser, loginUser, refreshToken, logout, getCurrentUser
- Response: User data, tokens, success messages
- Used By: Auth routes

**`backend/src/controllers/userController.js`**
- Purpose: User profile management
- Methods: getProfile, updateProfile, uploadPicture, searchUsers, getFriends, getSuggestions, blockUser
- Response: User data, profiles, lists
- Used By: User routes

**`backend/src/controllers/friendController.js`**
- Purpose: Friend request management
- Methods: sendRequest, acceptRequest, rejectRequest, getPending, getSent, removeFriend
- Response: Request data, friendship status
- Used By: Friend routes

**`backend/src/controllers/chatController.js`**
- Purpose: Message and conversation management
- Methods: getConversations, createConversation, getMessages, sendMessage, editMessage, deleteMessage, addReaction, markSeen
- Response: Messages, conversations, status
- Used By: Chat routes

**`backend/src/controllers/notificationController.js`**
- Purpose: Notification management
- Methods: getNotifications, markRead, markAllRead, getUnreadCount, deleteNotification
- Response: Notifications, counts
- Used By: Notification routes

### Services (Business Logic)

**`backend/src/services/authService.js`**
- Purpose: Authentication logic
- Methods: registerUser, loginUser, generateTokens, verifyToken, refreshToken
- Used By: Auth controller
- Dependencies: bcryptjs, JWT

**`backend/src/services/userService.js`**
- Purpose: User profile operations
- Methods: getProfile, updateProfile, processImage, searchUsers, getFriends, blockUser
- Used By: User controller
- Dependencies: Sharp (image processing)

**`backend/src/services/friendService.js`**
- Purpose: Friend operations and logic
- Methods: sendRequest, acceptRequest, rejectRequest, removeFriend
- Used By: Friend controller
- Dependencies: User, FriendRequest models

**`backend/src/services/chatService.js`**
- Purpose: Chat operations and logic
- Methods: createConversation, sendMessage, editMessage, deleteMessage, addReaction
- Used By: Chat controller
- Dependencies: Conversation, Message, User models

**`backend/src/services/notificationService.js`**
- Purpose: Notification operations
- Methods: createNotification, getNotifications, markRead, deleteNotification
- Used By: Notification controller
- Dependencies: Notification model

### Routes (API Endpoints)

**`backend/src/routes/auth.js`**
- Endpoints: `/register`, `/login`, `/refresh-token`, `/logout`, `/me`
- Methods: POST, POST, POST, POST, GET
- Auth: None (register/login), JWT (others)

**`backend/src/routes/user.js`**
- Endpoints: `/profile`, `/profile/:userId`, `/profile/picture`, `/search`, `/friends`, `/suggestions`, `/block`, `/unblock`
- Methods: GET, GET, POST, GET, GET, GET, POST, POST
- Auth: JWT required

**`backend/src/routes/friend.js`**
- Endpoints: `/request/send`, `/request/accept`, `/request/reject`, `/requests/pending`, `/requests/sent`, `/remove/:friendId`
- Methods: POST, POST, POST, GET, GET, DELETE
- Auth: JWT required

**`backend/src/routes/chat.js`**
- Endpoints: `/conversations`, `/conversations/:userId`, `/messages/:conversationId`, `/message/send`, `/message/edit/:messageId`, `/message/:messageId`, `/message/reaction`, `/messages/mark-seen`, `/upload`
- Methods: GET, POST, GET, POST, PUT, DELETE, POST, POST, POST
- Auth: JWT required

**`backend/src/routes/notification.js`**
- Endpoints: `/`, `/mark-read/:notificationId`, `/mark-all-read`, `/unread-count`, `/:notificationId`
- Methods: GET, PUT, PUT, GET, DELETE
- Auth: JWT required

### Middleware

**`backend/src/middleware/auth.js`**
- Purpose: Verify JWT tokens, attach user to request
- Used By: Protected routes
- Headers: Authorization: Bearer <token>

**`backend/src/middleware/validation.js`**
- Purpose: Validate request data against schemas
- Used By: Create/update endpoints
- Pattern: express-validator with custom checks

**`backend/src/middleware/errorHandler.js`**
- Purpose: Centralized error handling
- Used By: All routes
- Returns: Consistent error format

### Socket.io Handlers

**`backend/src/sockets/index.js`**
- Purpose: Initialize Socket.io, handle connections
- Events: authenticate, disconnect, join-room
- Used By: Server initialization

**`backend/src/sockets/chat.js`**
- Purpose: Real-time chat events
- Events: new-message, edit-message, delete-message, typing, message-delivered, message-seen
- Used By: Chat page

**`backend/src/sockets/presence.js`**
- Purpose: User presence tracking
- Events: user-online, user-away, user-offline, idle-timeout
- Used By: Entire app

**`backend/src/sockets/call.js`**
- Purpose: WebRTC call signaling
- Events: call-incoming, call-answer, call-decline, call-end, offer, answer, ice-candidate
- Used By: Call system

### Configuration & Root Files

**`backend/.env.example`**
- Template for environment variables
- Must be copied to `.env` before running
- Contains: DB URI, JWT secrets, CORS settings, etc.

**`backend/package.json`**
- Project dependencies and scripts
- Scripts: start, dev, test
- Dependencies: Express, Mongoose, Socket.io, etc.

**`backend/Dockerfile`**
- Docker container configuration
- Base: Node.js Alpine
- Exposes: Port 5000

---

## Frontend Files Reference

### Root Components

**`frontend/src/App.jsx`**
- Purpose: Root application component
- Features: Routing, theme provider, error boundaries
- Routes: /login, /register, /chat, /profile, /friends, /settings, /terms

**`frontend/src/main.jsx`**
- Purpose: React application entry point
- Features: ReactDOM.createRoot, App mounting

**`frontend/index.html`**
- Purpose: HTML container
- Features: Meta tags, root div, Tailwind CDN (fallback)

### Components

**`frontend/src/components/auth/ProtectedRoute.jsx`**
- Purpose: Route guard for authenticated pages
- Features: Check auth status, redirect to login
- Used By: App.jsx routing

**`frontend/src/components/common/LoadingScreen.jsx`**
- Purpose: Loading spinner display
- Features: Centered spinner, logo, text
- Used By: Suspense fallback, data loading

**`frontend/src/components/chat/MessageBubble.jsx`**
- Purpose: Display individual messages
- Features: Sender info, content, reactions, edit/delete
- Used By: Chat page

**`frontend/src/components/chat/MessageInput.jsx`**
- Purpose: User message composition
- Features: Emoji picker, file upload, keyboard shortcuts
- Used By: Chat page

### Pages

**`frontend/src/pages/LoginPage.jsx`**
- Purpose: User login interface
- Features: Email/password form, validation, error display
- Route: /login

**`frontend/src/pages/RegisterPage.jsx`**
- Purpose: User registration interface
- Features: Form with password confirmation, validation
- Route: /register

**`frontend/src/pages/ChatPage.jsx`**
- Purpose: Main messaging interface
- Features: Conversation list, message display, compose
- Route: /chat (protected)

**`frontend/src/pages/ProfilePage.jsx`**
- Purpose: User profile view and edit
- Route: /profile (protected)
- Status: Placeholder (ready for implementation)

**`frontend/src/pages/FriendsPage.jsx`**
- Purpose: Friends list and management
- Route: /friends (protected)
- Status: Placeholder

**`frontend/src/pages/SettingsPage.jsx`**
- Purpose: User settings
- Route: /settings (protected)
- Status: Placeholder

**`frontend/src/pages/TermsPage.jsx`**
- Purpose: Terms of service
- Route: /terms (public)
- Status: Placeholder

**`frontend/src/pages/NotFoundPage.jsx`**
- Purpose: 404 error page
- Route: * (catch-all)

**`frontend/src/pages/index.js`**
- Purpose: Export all pages as named exports
- Pattern: Central import point

### Stores (Zustand State Management)

**`frontend/src/stores/auth.js`**
- Purpose: Authentication and user state
- State: user, token, isAuthenticated, isLoading, error
- Actions: setUser, setToken, logout, register, login
- Persistence: localStorage

**`frontend/src/stores/chat.js`**
- Purpose: Chat and message state
- State: conversations, messages, currentConversation, typing, error
- Actions: setConversations, addMessage, updateMessage, setTyping
- Updates: Via API and Socket.io

**`frontend/src/stores/notification.js`**
- Purpose: Notification state
- State: notifications, unreadCount
- Actions: addNotification, markRead, deleteNotification
- Updates: Via Socket.io

**`frontend/src/stores/user.js`**
- Purpose: User profile and friends state
- State: profile, friends, suggestions, blockedUsers
- Actions: setProfile, setFriends, blockUser, searchUsers
- Updates: Via API calls

**`frontend/src/stores/ui.js`**
- Purpose: UI state (not data)
- State: darkMode, sidebarOpen, isMobile, incomingCall
- Actions: toggleDarkMode, toggleSidebar, setIncomingCall
- Persistence: localStorage for darkMode

### Services

**`frontend/src/services/api.js`**
- Purpose: REST API client
- Features: All HTTP endpoints, token injection, auto-refresh
- Methods: auth, user, friend, chat, notification endpoints
- Headers: Automatic JWT injection, CORS

**`frontend/src/services/socket.js`**
- Purpose: Socket.io client wrapper
- Features: 30+ events, connection management, listeners
- Events: Chat, presence, calls, notifications
- Auto-reconnect: Yes

### Styles

**`frontend/src/styles/index.css`**
- Purpose: Global styles and CSS variables
- Features: Color palette, resets, animations, typography
- Theme: Dark and light mode support

**`frontend/src/styles/animations.css`**
- Purpose: Reusable animation keyframes
- Animations: 20+ custom animations (messageSlideIn, typingDot, etc.)
- Composition-ready: Can be combined

### Configuration Files

**`frontend/.env.example`**
- Template for frontend environment variables
- Variables: API_URL, SOCKET_URL, APP_NAME

**`frontend/vite.config.js`**
- Vite build configuration
- Features: React plugin, alias paths, test config
- Optimization: Code splitting, lazy loading

**`frontend/tailwind.config.js`**
- Tailwind CSS customization
- Features: Color scheme, animations, extended theme
- Mode: Dark mode support

**`frontend/postcss.config.js`**
- PostCSS configuration for Tailwind
- Plugins: Tailwind, autoprefixer

**`frontend/package.json`**
- Project dependencies and scripts
- Scripts: dev, build, preview, test
- Dependencies: React, Vite, Zustand, Socket.io, etc.

**`frontend/Dockerfile`**
- Docker container configuration
- Base: Node.js Alpine
- Exposes: Port 3000

---

## Documentation Files

**`README.md`**
- Project overview and feature highlights
- Tech stack and architecture
- Getting started link

**`QUICK_START.md`**
- Step-by-step setup guide
- Prerequisites and installation
- Development and production setup
- Troubleshooting tips

**`COMPLETION_SUMMARY.md`**
- Detailed project documentation
- All API endpoints listed
- All Socket.io events listed
- Database schema descriptions
- Feature checklist

**`API_REFERENCE.md`** (This file)
- Comprehensive API endpoint documentation
- Request/response examples
- Error handling
- cURL examples

**`DEPLOYMENT.md`**
- Production deployment guide
- Environment configuration
- Docker and cloud deployment options
- Monitoring and logging setup
- Security hardening

**`TESTING.md`**
- Testing setup and frameworks
- Unit, integration, E2E, load testing
- Code examples for all test types
- Coverage and CI/CD integration

**`TROUBLESHOOTING.md`**
- Common issues and solutions
- Debugging guides
- Performance troubleshooting
- Error reference table

**`PROJECT_MAP.md`**
- This file - complete project structure
- File purposes and dependencies
- Quick reference guide

---

## Root Configuration Files

**`docker-compose.yml`**
- Multi-container orchestration
- Services: MongoDB, Redis, Backend, Frontend
- Networks and volumes
- Development setup

**`.env.example`**
- Root level environment template
- Database, server, client configurations

**`.gitignore`**
- Source control exclusions
- node_modules, .env, dist, etc.

---

## File Dependencies Map

```
Frontend:
├── App.jsx
│   ├── pages/* (all pages)
│   ├── ProtectedRoute (auth checking)
│   └── LoadingScreen (fallback)
├── services/api.js
│   └── stores/auth.js (token injection)
├── services/socket.js
│   └── all stores (event listeners)
└── stores/*
    ├── API calls via services/api.js
    └── Socket events via services/socket.js

Backend:
├── server.js
│   ├── routes/* (all routes)
│   ├── middleware/* (auth, validation, errors)
│   └── sockets/* (WebSocket handlers)
├── routes/*
│   └── controllers/* (request handlers)
├── controllers/*
│   └── services/* (business logic)
├── services/*
│   └── models/* (database operations)
└── models/* (MongoDB schemas)
```

---

## Quick File Navigation

### Need to add a new API endpoint?
1. Create model in `backend/src/models/`
2. Create service in `backend/src/services/`
3. Create controller in `backend/src/controllers/`
4. Create/update route in `backend/src/routes/`

### Need to add a new page?
1. Create component in `frontend/src/pages/`
2. Add route to `frontend/src/App.jsx`
3. Create necessary stores if needed
4. Create components if needed

### Need to add real-time feature?
1. Create socket handler in `backend/src/sockets/`
2. Add event listener in `frontend/src/services/socket.js`
3. Connect to component via store
4. Test with Socket.io events

### Need to fix a bug?
1. Check TROUBLESHOOTING.md first
2. Check relevant service/controller layer
3. Look at stored data in relevant store
4. Check Socket.io events if real-time

---

## Total File Count

- **Backend**: 20+ files
- **Frontend**: 25+ files  
- **Configuration**: 8 files
- **Documentation**: 8 files
- **Total**: 61+ files

---

## Important Notes

1. **Environment Files**: Never commit `.env` files - use `.env.example` as template
2. **Node Modules**: Listed in `.gitignore` - install with `npm install`
3. **Build Outputs**: `dist/` and `build/` directories are in `.gitignore`
4. **Asset Paths**: Use module aliases (@) defined in config files
5. **Port Conflicts**: Change ports in .env if conflicts occur

---

**Last Updated**: January 2024  
**Project Version**: 1.0
