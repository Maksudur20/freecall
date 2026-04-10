# Quick Start: MongoDB Connection

## TL;DR (5-minute setup)

### 1. Create `.env` file in `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas (recommended)
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/freecall?retryWrites=true&w=majority

# JWT & API Keys
JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:5173
```

### 2. Get MongoDB URI from Atlas:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account → Create cluster (M0 free)
3. **Network Access** → Allow `0.0.0.0/0` (development only)
4. **Database Access** → Create user: `freecall_user`
5. **Connect** → Copy full connection string
6. Replace `<username>` and `<password>` with your credentials
7. Add database name: `/freecall?retryWrites=true&w=majority`

### 3. Run server:

```bash
cd backend
npm install
npm start
# or for development with auto-reload:
npm run dev
```

### 4. Verify connection:

Open browser: `http://localhost:5000/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-10T12:00:00.000Z"
}
```

---

## What's Connected

✅ **Mongoose**: Connection management  
✅ **8 Data Models**: User, Conversation, Message, Call, Notification, etc.  
✅ **Auto Logging**: Connection status, query logs (dev mode)  
✅ **Error Handling**: Graceful reconnection attempts  
✅ **Graceful Shutdown**: Properly closes DB connection on exit  

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "URI not provided" | Add `MONGODB_ATLAS_URI` to `.env` |
| "Authentication failed" | Check username/password in connection string |
| "No IP whitelist" | Add your IP in MongoDB Atlas → Network Access |
| "ECONNREFUSED" | MongoDB not running (local) or cluster not active (Atlas) |
| "Too many connections" | Restart server: `Ctrl+C` → `npm start` |

---

## Database Structure

Your connected database will auto-create these collections:

```
freecall (database)
├── users              (User profiles)
├── conversations      (Group chats & DMs)
├── messages           (Chat messages)
├── calls              (Call history & records)
├── notifications      (Real-time notifications)
├── friendrequests     (Friend connections)
├── pinnedmessages     (Saved messages)
└── messageschedules   (Scheduled messages)
```

---

## Connection Logs

When server starts, you'll see:

```
✓ MongoDB connected successfully
  Database: freecall
  Host: cluster0.xxxxx.mongodb.net
  Environment: development

🚀 Server running on http://localhost:5000
📡 WebSocket ready for connections
```

---

## For Detailed Setup

See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for:
- Step-by-step MongoDB Atlas account creation
- Advanced configuration options
- Production deployment checklist
- Security best practices
- Troubleshooting guide

---

## For Security Details

See [SECURITY.md](./SECURITY.md) for:
- Input validation
- Rate limiting
- Password security
- JWT token management
- Data sanitization

