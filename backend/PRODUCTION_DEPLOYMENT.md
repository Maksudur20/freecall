# Full-Stack Production Deployment Guide

Complete guide to deploy FreeCall on **Render (Backend) + Vercel (Frontend)**.

---

## 📋 Pre-Deployment Checklist

### Backend Check
- [ ] MongoDB Atlas cluster created
- [ ] Cloudinary account created with credentials
- [ ] All environment variables documented
- [ ] Server runs without errors locally
- [ ] No hardcoded secrets in code
- [ ] All dependencies in package.json

### Frontend Check
- [ ] React app configured for production
- [ ] API base URL uses environment variable
- [ ] No hardcoded localhost URLs
- [ ] Build completes without errors
- [ ] Dependencies in package.json

---

## 🔧 PART 1: BACKEND DEPLOYMENT (Render)

### Step 1: Prepare Backend for Production

**1.1 Update `src/server.js` for production**

```javascript
// Already set up correctly, verify:
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

**1.2 Verify `.env` variables are set correctly**

Check `backend/.env.example`:
```env
# These MUST be in environment variables on Render
MONGODB_ATLAS_URI=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_SECRET=
REFRESH_TOKEN_SECRET=
CORS_ORIGIN=
NODE_ENV=production
```

**1.3 Add Compression Middleware** (for performance)

Update `src/server.js` - add after `dotenv.config()`:

```javascript
import compression from 'compression';

// Add after middleware setup (around line 50)
app.use(compression());
```

Install compression:
```bash
npm install compression
```

---

### Step 2: Create Render Account & Deploy

**2.1 Go to Render.com**
1. Visit [render.com](https://render.com)
2. Sign up (use GitHub for easier deployment)
3. Click "New" → "Web Service"

**2.2 Connect GitHub Repository**
1. Authorize Render to access GitHub
2. Select your FreeCall repository
3. Select `main` branch

**2.3 Configure Deployment**

Fill in these fields:
```
Name: freecall-backend
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free (for testing)
```

**2.4 Add Environment Variables**

In Render dashboard, go to "Environment" and add:

```env
MONGODB_ATLAS_URI=mongodb+srv://20maksudur00_db_user:GAwMbmq0v74lXVny@cluster0.c2l1nho.mongodb.net/freecall?retryWrites=true&w=majority

CLOUDINARY_CLOUD_NAME=daxyxxsrg
CLOUDINARY_API_KEY=877539114575295
CLOUDINARY_API_SECRET=Bqo6kiMWIFb9iDSzUvNIm59KHcs

JWT_SECRET=your-very-long-random-secret-key-min-32-chars-change-this
REFRESH_TOKEN_SECRET=your-very-long-random-refresh-secret-min-32-chars

CORS_ORIGIN=https://freecall-frontend.vercel.app,https://yourdomain.com

NODE_ENV=production
PORT=
```

**2.5 Deploy**
1. Click "Create Web Service"
2. Wait 2-5 minutes for deployment
3. You'll get a URL like: `https://freecall-backend.onrender.com`
4. **Copy this URL** - needed for frontend!

---

## 🎨 PART 2: FRONTEND DEPLOYMENT (Vercel)

### Step 1: Create React Frontend Structure

**1.1 Create `.env.production` file** in your React project root:

```env
REACT_APP_API_BASE_URL=https://freecall-backend.onrender.com/api
```

**1.2 Update `.env.development`** for local testing:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

**1.3 Use in your React code:**

```javascript
// Create src/api/client.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const api = {
  register: (data) => 
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  login: (data) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  uploadFile: (file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE_URL}/upload/profile-picture`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    }).then(r => r.json());
  }
};
```

**1.4 Use Socket.io for production:**

```javascript
// In your React component
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_BASE_URL.replace('/api', ''), {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});
```

---

### Step 2: Deploy to Vercel

**2.1 Go to Vercel**
1. Visit [vercel.com](https://vercel.com)
2. Sign up (use GitHub)
3. Click "New Project"

**2.2 Import Repository**
1. Select your FreeCall frontend repository
2. Select `main` branch

**2.3 Configure Build Settings**

```
Framework: React
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

**2.4 Add Environment Variables**

In Vercel Project Settings → Environment Variables:

```
REACT_APP_API_BASE_URL=https://freecall-backend.onrender.com/api
```

Make sure to select "Production" for environment.

**2.5 Deploy**
1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get URL like: `https://freecall-frontend.vercel.app`

---

## 🔐 PART 3: CORS CONFIGURATION

### Update Backend CORS Settings

**In `src/server.js`, update CORS:**

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Set in environment variables (Render):**

```env
CORS_ORIGIN=https://freecall-frontend.vercel.app,http://localhost:3000
```

---

## 📊 PART 4: DEPLOYMENT ARCHITECTURE

```
┌─────────────────────┐
│  Vercel Frontend    │
│  (React App)        │
│  https://vercel...  │
└──────────┬──────────┘
           │ API Requests
           │ Socket.io
           ↓
┌─────────────────────┐
│ Render Backend      │
│ (Node + Express)    │
│ https://onrender... │
└──────────┬──────────┘
           │ Database
           │ File Storage
           ↓
┌─────────────────────────────────────┐
│     External Services               │
├─────────────────────────────────────┤
│ • MongoDB Atlas Cloud               │
│ • Cloudinary (File Storage)         │
└─────────────────────────────────────┘
```

---

## ✅ VERIFICATION CHECKLIST

### Backend (Render)
- [ ] Visit `https://freecall-backend.onrender.com/api/health`
- [ ] Should respond: `{"status":"ok","timestamp":"..."}`
- [ ] All environment variables set in Render
- [ ] Logs show "MongoDB connected successfully"
- [ ] No exposed secrets in code

### Frontend (Vercel)
- [ ] Visit your Vercel URL
- [ ] App loads without errors
- [ ] Can register/login
- [ ] Can upload files
- [ ] Can send messages in real-time
- [ ] API requests go to production backend

### Integration
- [ ] Frontend connects to backend API
- [ ] File uploads work
- [ ] Real-time messaging works
- [ ] User authentication works
- [ ] No CORS errors in console

---

## 🚀 FINAL DEPLOYMENT STEPS

### 1. Update Production Secrets

**Generate strong random secrets:**

```bash
# Windows PowerShell
$secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
Write-Host $secret
```

**Add to Render Environment:**
- `JWT_SECRET=` (copy generated value)
- `REFRESH_TOKEN_SECRET=` (copy generated value)

### 2. Test All Features

```bash
# 1. Register new user
curl -X POST https://freecall-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Password123","confirmPassword":"Password123"}'

# 2. Login
curl -X POST https://freecall-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# 3. Test health endpoint
curl https://freecall-backend.onrender.com/api/health
```

### 3. Monitor Logs

**Render Logs:**
- Dashboard → Your Web Service → Logs
- Watch for MongoDB connection, errors

**Vercel Logs:**
- Dashboard → Your Project → Deployments → Logs
- Check for API errors, build issues

---

## 🔧 TROUBLESHOOTING

### Backend Won't Deploy

**Problem:** Build command fails
```
Solution: Check package.json scripts
         npm start must work locally first
         All dependencies must be listed
```

**Problem:** Environment variables not found
```
Solution: Re-add all env variables in Render
         Verify spelling matches code
         Restart deployment
```

### Frontend Can't Connect to Backend

**Problem:** CORS errors
```
Error: Access-Control-Allow-Origin missing
Solution: Check CORS_ORIGIN in backend
         Verify Vercel URL is listed
         Check credentials: true
```

**Problem:** 404 errors
```
Error: API endpoint not found
Solution: Verify API_BASE_URL in frontend
         Check backend is deployed
         Verify routes exist in backend
```

### Real-Time Not Working

**Problem:** Socket.io can't connect
```
Solution: Check Socket.io server running
         Verify CORS allows WebSocket
         Check firewall/proxy settings
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Backend Optimizations (Already Done)
- ✅ Compression middleware (gzip)
- ✅ Rate limiting
- ✅ Caching (Redis optional)
- ✅ Database indexing

### Frontend Optimizations

**1. Enable Production Build:**
```bash
npm run build  # Creates optimized build
```

**2. Add lazy loading in React:**
```javascript
import React, { lazy, Suspense } from 'react';

const ChatPage = lazy(() => import('./pages/Chat'));

<Suspense fallback={<Loading />}>
  <ChatPage />
</Suspense>
```

**3. Optimize images:**
```javascript
<img src="image.jpg" alt="test" loading="lazy" />
```

---

## 🔒 SECURITY BEST PRACTICES

### Deployed Backend
- [ ] All secrets in environment variables
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] CORS restricted to frontend domain only
- [ ] Rate limiting active
- [ ] Error messages don't leak secrets
- [ ] No console.log of sensitive data

### Deployed Frontend
- [ ] No hardcoded API URLs
- [ ] No JWT stored in localStorage insecurely
- [ ] HTTPS only (automatic on Vercel)
- [ ] Content Security Policy headers
- [ ] Secure cookie settings

---

## 📊 MONITORING & LOGGING

### Check Backend Health

```bash
# View Render logs
# Dashboard → Web Service → Logs tab

# Check endpoint
curl https://your-backend.onrender.com/api/health

# Check database
# MongoDB Atlas → Metrics
```

### Check Frontend

```bash
# View Vercel logs
# Dashboard → Deployments → Logs tab

# Browser DevTools
# F12 → Console tab for errors
# F12 → Network tab for API calls
```

---

## 🎉 SUCCESS INDICATORS

When everything is working:

✅ Frontend loads from Vercel URL
✅ Can register and login
✅ JWT tokens work
✅ Can upload files to Cloudinary
✅ Messages sent in real-time
✅ No CORS errors
✅ No console errors
✅ Files appear in Cloudinary
✅ Database stores data
✅ User statuses update live

---

## 📞 DEPLOYMENT SUMMARY

| Component | Where | URL Format |
|-----------|-------|-----------|
| **Backend** | Render | `https://freecall-backend.onrender.com` |
| **Frontend** | Vercel | `https://freecall-frontend.vercel.app` |
| **Database** | MongoDB Atlas | Cloud (no public URL) |
| **Files** | Cloudinary | Cloud (returns URLs) |

---

## 🚀 NEXT STEPS

1. **Update backend:**
   - Add `compression` package
   - Set all environment variables
   - Deploy to Render

2. **Update frontend:**
   - Create `.env.production`
   - Set `REACT_APP_API_BASE_URL`
   - Deploy to Vercel

3. **Test everything:**
   - Register → Login → Upload → Chat
   - All features working?
   - Check Render & Vercel logs

4. **Go live:**
   - Share Vercel URL with users
   - Monitor logs for errors
   - Scale as needed

---

Your FreeCall application is now production-ready! 🎉

