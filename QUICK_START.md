# FreeCall - Quick Start Guide

## Prerequisites
- Node.js 16+ 
- MongoDB (local or Atlas)
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies for all parts
npm run install:all
```

### 2. Environment Configuration

**Backend** - Create `backend/.env`
```bash
cp backend/.env.example backend/.env
```

**Frontend** - Create `frontend/.env.local`
```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Update Environment Variables

**backend/.env**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/freecall
JWT_SECRET=change_this_to_a_secure_random_string
REFRESH_TOKEN_SECRET=change_this_to_a_secure_random_string
```

**frontend/.env.local**
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Start MongoDB (if not using Docker)

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Windows
mongod

# Linux (systemd)
sudo systemctl start mongod
```

### 5. Start Development Servers

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately in different terminals
npm run dev:frontend  # Terminal 1
npm run dev:backend   # Terminal 2
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **WebSocket**: http://localhost:5000 (Socket.io)

## Using Docker (Optional)

```bash
# Make sure you have Docker installed
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

## Default Test Credentials

After creating an account, you can use any username/email and password you set.

## Project Structure

```
freecall/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/     # Zustand stores
│   │   ├── services/  # API & Socket.io
│   │   └── styles/
│   └── vite.config.js
│
├── backend/           # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/    # MongoDB schemas
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/   # Socket.io handlers
│   │   └── server.js
│   └── uploads/       # File storage
│
└── docker-compose.yml
```

## Key Features (Built)

✅ Authentication (JWT)
✅ Database schemas
✅ API endpoints
✅ Socket.io integration
✅ UI components (React)
✅ Global state management (Zustand)
✅ Animations (Framer Motion)
✅ Styling (Tailwind CSS)

## Next Steps

1. **Test API endpoints** - Use Postman or curl to verify backend
2. **Link frontend to backend** - Ensure API calls are working
3. **Implement real-time features** - Complete chat, calls, notifications
4. **Add WebRTC** - Implement voice/video calling
5. **Deploy** - Push to production servers

## Troubleshooting

**Port already in use**
```bash
# Find process using port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```

**MongoDB connection error**
- Ensure MongoDB is running
- Check connection string in .env
- Verify credentials for MongoDB Atlas

**Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues, check the console logs and ensure all services are running properly.
