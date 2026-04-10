# FreeCall Backend - MongoDB Atlas Setup & Getting Started

## 🎯 Quick Start (5 minutes)

### 1. Copy the environment template
```bash
cd backend
cp .env.template .env
```

### 2. Get your MongoDB Atlas connection string
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create free account → Create M0 cluster
- Get connection string: Deployments → Connect → Copy URI
- Add IP to whitelist: Network Access → Allow 0.0.0.0/0

### 3. Update your `.env` file
```env
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/freecall?retryWrites=true&w=majority
JWT_SECRET=your-32-character-secret-key-here
CORS_ORIGIN=http://localhost:5173
```

### 4. Start the server
```bash
npm install
npm start
# or with auto-reload:
npm run dev
```

### 5. Verify connection
```bash
# In browser: http://localhost:5000/api/health
# Expected: {"status": "ok", "timestamp": "..."}
```

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| [MONGODB_QUICK_START.md](./MONGODB_QUICK_START.md) | TL;DR 5-minute setup |
| [MONGODB_SETUP.md](./MONGODB_SETUP.md) | Detailed step-by-step guide |
| [MONGODB_CONNECTION_SUMMARY.md](./MONGODB_CONNECTION_SUMMARY.md) | Technical implementation details |
| [SECURITY.md](./SECURITY.md) | Security best practices |
| [.env.example](./.env.example) | Configuration reference |
| [.env.template](./.env.template) | Copy this to create `.env` |

## ✅ What's Included

✅ **Mongoose Integration**
- Connection management
- 8 data models (User, Conversation, Message, Call, etc.)
- Automatic collection creation

✅ **MongoDB Atlas Support**
- Cloud database (recommended)
- Local MongoDB fallback option
- Proper connection pooling

✅ **Connection Monitoring**
- Auto-reconnection on failure
- Debug logging in development
- Graceful shutdown handling

✅ **Security**
- Environment variable configuration
- Input validation & sanitization
- Rate limiting
- JWT authentication

## 🚀 Server Commands

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production server
npm start

# Install dependencies
npm install

# Audit security vulnerabilities
npm audit
npm audit fix
```

## 📊 Database Models Included

```
freecall (database)
├── users              - User accounts & profiles
├── conversations      - Group chats & DMs
├── messages           - Chat messages & media
├── calls              - Call history
├── notifications      - Real-time alerts
├── friendrequests     - Friend connections
├── pinnedmessages     - Saved messages
└── messageschedules   - Future messages
```

## 🔐 Security Checklist

- [ ] Set unique `JWT_SECRET` (32+ random characters)
- [ ] Change `REFRESH_TOKEN_SECRET`
- [ ] Set `MONGODB_ATLAS_URI` from your cluster
- [ ] Whitelist your IP in MongoDB Atlas
- [ ] Set `NODE_ENV=development` for dev
- [ ] Never commit `.env` to Git
- [ ] Use `.env.example` as template

## 🆘 Troubleshooting

**Server won't start?**
1. Check `.env` file exists
2. Verify `MONGODB_ATLAS_URI` is set
3. Ensure MongoDB Atlas cluster is active
4. Check your IP is whitelisted

**Connection timeout?**
1. Verify cluster status (should be green)
2. Check internet connection
3. Whitelist `0.0.0.0/0` temporarily (development only)

**Database not created?**
1. MongoDB creates databases on first write
2. Run `PUT /api/users/...` to create data
3. Check MongoDB Atlas → Browse Collections

See [MONGODB_SETUP.md](./MONGODB_SETUP.md#troubleshooting) for detailed troubleshooting.

## 📖 API Endpoints

### Health Check
```
GET /api/health
Response: {"status": "ok", "timestamp": "..."}
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
GET /api/auth/me
```

### Users
```
GET /api/users/{id}
PUT /api/users/{id}
GET /api/users/search?q=...
```

### Chat
```
POST /api/chat/conversations
GET /api/chat/conversations
POST /api/chat/messages
GET /api/chat/messages/{conversationId}
```

## 🎨 WebSocket Events (Real-time)

Socket.io enabled for:
- Real-time messaging
- Online status updates
- Typing indicators
- Call notifications
- Friend request notifications

## 📦 Installed Packages

| Package | Purpose |
|---------|---------|
| **express** | Web framework |
| **mongoose** | MongoDB ODM |
| **socket.io** | Real-time communication |
| **jsonwebtoken** | JWT authentication |
| **bcryptjs** | Password hashing |
| **express-validator** | Input validation |
| **express-mongo-sanitize** | NoSQL injection prevention |
| **xss-clean** | XSS attack prevention |
| **helmet** | HTTP security headers |
| **cors** | Cross-origin requests |
| **dotenv** | Environment variables |
| **cloudinary** | Image/video hosting |
| **multer** | File uploads |
| **redis** | Caching (optional) |
| **nodemon** | Dev auto-reload |

## 🌍 Deployment Preparation

### MongoDB Atlas (Production)
1. Upgrade to paid tier (M2+)
2. Enable backups with 30+ day retention
3. Whitelist production server IPs
4. Enable encryption at rest
5. Set up monitoring alerts

### Server Environment
1. Set `NODE_ENV=production`
2. Use strong random `JWT_SECRET`
3. Disable query logging
4. Set `CORS_ORIGIN` to your domain
5. Enable HTTPS

See [SECURITY.md](./SECURITY.md) for production checklist.

## 💡 Tips

**Development:**
```bash
# Watch mode (auto-reload on file changes)
npm run dev

# View logs in real-time
npm start

# Check database in MongoDB Atlas UI
# Navigate to: Deployments → Collections
```

**Testing:**
```bash
# Health check
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

**Production:**
```bash
# Use process manager
pm2 start src/server.js

# Or Docker
docker build -t freecall-backend .
docker run -p 5000:5000 --env-file .env freecall-backend
```

## 📞 Support

For issues:
1. Check [MONGODB_SETUP.md](./MONGODB_SETUP.md) troubleshooting
2. Verify environment variables: `node -e "require('dotenv').config(); console.log(process.env)"`
3. Check MongoDB Atlas cluster status
4. Review server logs for error messages
5. Ensure all dependencies are installed: `npm install`

## 🎉 Next Steps

1. **Start development server**: `npm run dev`
2. **Build frontend**: Connect your React/Vue app
3. **Implement features**:
   - User registration/login
   - Real-time messaging
   - Voice/video calls
   - Friend system
4. **Deploy to production**: Use recommended best practices

---

**Backend is ready!** Start building your FreeCall application. 🚀

