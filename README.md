# 🎉 FreeCall - Real-Time Messaging & Calling Platform

A **production-ready, high-performance, scalable real-time messaging and calling web application** built with **Node.js, Express, MongoDB, Socket.io, WebRTC, and React (Vite)**.

## 🌟 Features

### 🎨 UI/UX
- Ultra-smooth scrolling (GPU-accelerated)
- Glassmorphism design with animations
- Animated gradient background
- Custom animated cursor with hover effects
- Micro-interactions (ripple effects, smooth transitions)
- Dark/Light mode toggle
- Fully responsive (mobile-first)
- Virtual scrolling for large chats

### 🔐 Authentication & Security
- JWT Authentication (Access + Refresh tokens)
- HTTP-only cookies
- Password hashing (bcrypt)
- Session/device management
- Rate limiting & input validation
- XSS & injection protection (Helmet.js)
- CSRF protection

### 👥 Social Features
- Real-time friend requests
- Friend suggestions
- Online status tracking
- Profile pictures & cover photos
- Mutual friend system

### 💬 Messaging
- One-to-one real-time chat (Socket.io)
- Message status (sent, delivered, seen)
- Reply to messages
- Edit/delete messages
- Emoji picker & reactions
- Markdown & code block support
- Link preview
- Search within chats
- Typing indicators

### 📁 Media Management
- Image/video/file uploads
- Drag & drop upload
- Image compression & thumbnails
- Chunk upload with resume
- Preview before sending

### 📞 Voice & Video Calling
- WebRTC P2P calling
- Mute/unmute & camera on/off
- Draggable video window
- Connection status indicator
- Ringtone notifications

### 🔔 Advanced Features
- Real-time notifications
- Presence tracking (online/offline/idle)
- Message scheduling
- Self-destruct messages
- Block/unblock users
- Account deletion with confirmation
- Settings panel
- Command palette (Ctrl + K)
- Keyboard shortcuts

## 📂 Project Structure

```
freecall/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand state management
│   │   ├── services/        # API & Socket services
│   │   └── styles/          # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── middlewares/      # Express middlewares
│   │   ├── services/        # Business logic
│   │   └── sockets/         # Socket.io handlers
│   ├── uploads/             # File storage
│   ├── package.json
│   └── server.js
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- MongoDB (local or Atlas)
- Redis (optional, for caching)
- npm or yarn

### Installation

```bash
# Install root dependencies
npm install

# Install all dependencies
npm run install:all
```

### Environment Variables

**Frontend** - `frontend/.env.local`
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Backend** - `backend/.env`
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/freecall
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_secret_here
REDIS_URL=redis://localhost:6379
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately
npm run dev:frontend
npm run dev:backend
```

### Build

```bash
# Build both
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Zustand** - State management
- **React Query** - Server state
- **Socket.io-client** - Real-time communication
- **Framer Motion** - Animations
- **TailwindCSS** - Styling
- **simple-peer** - WebRTC wrapper

### Backend
- **Node.js** - Runtime
- **Express** - API framework
- **Socket.io** - Real-time events
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Redis** - Caching
- **Helmet** - Security headers
- **multer** - File uploads

## 📊 Database Schema

### Collections
- **Users** - User profiles & authentication
- **Messages** - Chat messages
- **Conversations** - Chat rooms/group chats
- **FriendRequests** - Friend request management
- **Notifications** - Real-time notifications
- **Calls** - Call history

## 🔐 Security Features

✅ Input validation (frontend + backend)
✅ XSS protection
✅ SQL/NoSQL injection prevention
✅ Helmet.js for security headers
✅ Rate limiting
✅ CORS configuration
✅ Secure file uploads
✅ CSRF protection
✅ Password hashing with bcrypt
✅ HTTP-only cookies

## 📈 Performance

- Virtual scrolling for large message lists
- Image compression & CDN optimization
- Redis caching for hot data
- Gzip/Brotli compression
- React memoization
- Lazy loading of chat history
- Debounced inputs
- Optimistic UI updates

## 🐳 Docker & Deployment

### Docker
```bash
docker-compose up
```

### Deployment
- **Frontend** → Vercel / Netlify
- **Backend** → AWS / Railway / Heroku
- **Database** → MongoDB Atlas
- **Storage** → AWS S3 / Cloudinary
- **Redis** → Upstash / Redis Cloud

## 🧪 Scripts

```bash
# Development
npm run dev              # Run both frontend & backend
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend only

# Build
npm run build           # Build both
npm run build:frontend  # Frontend only
npm run build:backend   # Backend only

# Start production
npm start               # Start backend

# Install
npm run install:all     # Install all dependencies
```

## 📸 UI Features

- Command palette (Ctrl + K)
- Keyboard shortcuts (Ctrl + N for new chat)
- Hover profile preview
- Floating action buttons
- Scroll-to-bottom button
- Skeleton loaders
- Toast notifications
- Modal dialogs
- Sidebar with navigation
- Search functionality

## 🤝 Contributing

Contributions are welcome! Please follow the code style and commit conventions.

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Built with ❤️ for real-time communication

---

**Status**: 🚀 Production Ready
**Last Updated**: April 2026
