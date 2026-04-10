# 🚀 DEPLOYMENT CHECKLIST & COMMANDS

Complete checklist and copy-paste commands for deploying FreeCall to production.

---

## ✅ PART 1: BACKEND DEPLOYMENT (Render)

### Pre-Deployment Checklist

- [ ] All code changes committed to `main` branch
- [ ] `npm install compression` installed locally
- [ ] `npm start` works without errors
- [ ] MongoDB Atlas connection verified
- [ ] Cloudinary credentials stored in `.env`
- [ ] No sensitive data in code comments
- [ ] Error handling implemented
- [ ] CORS_ORIGIN set correctly

### Step-by-Step Deployment

**1. Install Latest Dependencies**

```bash
cd backend
npm install compression
npm install
```

**2. Test Locally**

```bash
npm start
# Should output:
# ✓ MongoDB connected successfully
# 🚀 Server running on http://localhost:5000
```

**3. Commit to Git**

```bash
git add .
git commit -m "chore: prepare for production deployment

- Add compression middleware for performance
- Update CORS configuration for production
- Enhance environment variable handling
"
git push origin main
```

**4. Create Render Account**

```
Visit: https://render.com
Sign up with GitHub
```

**5. Connect Repository on Render**

```
1. Click "New" → "Web Service"
2. Select your GitHub repository
3. Select "main" branch
4. Name: freecall-backend
5. Build Command: npm install
6. Start Command: npm start
7. Instance Type: Free
8. Click "Create Web Service"
```

**6. Set Environment Variables on Render**

Go to Environment tab and add:

```env
# Copy-paste these exactly:
MONGODB_ATLAS_URI=mongodb+srv://20maksudur00_db_user:GAwMbmq0v74lXVny@cluster0.c2l1nho.mongodb.net/freecall?retryWrites=true&w=majority

CLOUDINARY_CLOUD_NAME=daxyxxsrg
CLOUDINARY_API_KEY=877539114575295
CLOUDINARY_API_SECRET=Bqo6kiMWIFb9iDSzUvNIm59KHcs

JWT_SECRET=your-super-secret-key-min-64-chars-change-this-IMPORTANT-very-long-string-for-production-usage

REFRESH_TOKEN_SECRET=your-refresh-secret-key-min-64-chars-change-this-IMPORTANT-very-long-string-for-production-usage

CORS_ORIGIN=https://freecall-frontend.vercel.app,http://localhost:3000

NODE_ENV=production
```

**7. Wait for Deployment**

```
Monitor logs for:
✓ Build successful
✓ MongoDB connected
✓ Server running
```

**8. Get Backend URL**

Render will give you: `https://freecall-backend.onrender.com`

**Copy this URL** - you need it for frontend!

---

## ✅ PART 2: FRONTEND DEPLOYMENT (Vercel)

### Pre-Deployment Checklist

- [ ] React build succeeds: `npm run build`
- [ ] No console errors locally
- [ ] Environment variables set in `.env.production`
- [ ] API client uses environment variables (not hardcoded)
- [ ] All imports work correctly
- [ ] No unused dependencies

### Step-by-Step Deployment

**1. Prepare Env Files**

Create `freecall-frontend/.env.production`:

```env
REACT_APP_API_BASE_URL=https://freecall-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://freecall-backend.onrender.com
```

⚠️ **DO NOT COMMIT THIS FILE** - add to `.gitignore`

**2. Test Build Locally**

```bash
cd ../freecall-frontend
npm run build
# Check that build/ directory created
# Should complete with no errors
```

**3. Commit Changes**

```bash
cd freecall-frontend
git add .
git commit -m "chore: prepare frontend for production

- Add environment variable configuration
- Update API client for production
- Optimize build settings
"
git push origin main
```

**4. Create Vercel Account**

```
Visit: https://vercel.com
Sign up with GitHub
```

**5. Import Project on Vercel**

```
1. Click "New Project"
2. Select your frontend repository
3. Select "main" branch
4. Framework: React (auto-detected)
5. Build Command: npm run build
6. Output Directory: build
```

**6. Set Environment Variables on Vercel**

In Project Settings → Environment Variables:

```
REACT_APP_API_BASE_URL = https://freecall-backend.onrender.com/api
REACT_APP_SOCKET_URL = https://freecall-backend.onrender.com
```

Select "Production" environment.

**7. Deploy**

```
Click "Deploy"
Wait 2-3 minutes
```

**8. Get Frontend URL**

Vercel will give you: `https://freecall-frontend.vercel.app`

---

## ✅ PART 3: CORS CONFIGURATION

### Update Backend CORS on Render

Go back to Render, Environment tab, add:

```env
CORS_ORIGIN=https://freecall-frontend.vercel.app,http://localhost:3000
```

**Then restart the server** (Render will auto-restart on env variable change).

---

## ✅ PART 4: COMPLETE VERIFICATION

### Test Backend Health

Run this in PowerShell:

```powershell
# Test health endpoint
curl https://freecall-backend.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"2024-01-15T10:30:45.123Z"}
```

### Test User Registration

```powershell
$body = @{
    username = "testuser123"
    email = "test@example.com"
    password = "SecurePassword123!"
    confirmPassword = "SecurePassword123!"
} | ConvertTo-Json

curl -X POST https://freecall-backend.onrender.com/api/auth/register `
  -H "Content-Type: application/json" `
  -Body $body

# Should return token and user data
```

### Test Login

```powershell
$loginBody = @{
    email = "test@example.com"
    password = "SecurePassword123!"
} | ConvertTo-Json

$response = curl -X POST https://freecall-backend.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -Body $loginBody

# Save the returned token
$token = ($response | ConvertFrom-Json).token
```

### Test File Upload

```powershell
# Create a test image file
@"
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
"@ | Convert-FromBase64String | Set-Content -Path test-image.png -AsByteStream

# Upload
curl -X PUT https://freecall-backend.onrender.com/api/upload/profile-picture `
  -H "Authorization: Bearer $token" `
  -F "file=@test-image.png"

# Should return Cloudinary URL
```

### Test Frontend

1. Visit `https://freecall-frontend.vercel.app`
2. Register with new account
3. Login
4. Try uploading profile picture
5. Send messages
6. Check real-time updates

---

## 🔍 MONITORING & DEBUGGING

### Check Render Logs

```
Dashboard → freecall-backend → Logs
Look for:
✓ MongoDB connected successfully
✓ Server running
✗ API endpoint errors
✗ Database errors
```

### Check Vercel Logs

```
Dashboard → freecall-frontend → Deployments
Click latest deployment → Logs
Look for:
✓ Build successful
✗ Build errors
✗ API errors
```

### Browser DevTools

```
Frontend (https://freecall-frontend.vercel.app)
Press F12 → Console
Look for:
✓ No red errors
✓ API calls successful
✗ CORS errors
✗ Socket.io errors
```

---

## 🆘 COMMON ISSUES & FIXES

### Issue: Backend service suspended after 15 minutes on free plan

```
Render free tier suspends after 15 min inactivity.
Solution:
1. Upgrade to paid plan ($7/month)
2. Or use Railway/Heroku
3. Ping health endpoint every 10 min
```

### Issue: CORS errors in browser console

```
Error: Access-Control-Allow-Origin missing

Fix:
1. Check CORS_ORIGIN on Render
2. Add your Vercel URL
3. Run `npm install cors` on backend
4. Restart Render service
```

### Issue: API returns 404 Not Found

```
Fix:
1. Check backend is running on Render (check logs)
2. Verify correct backend URL in frontend
3. Check route exists: GET /api/health
4. Check method is correct (GET/POST/PUT)
```

### Issue: Files won't upload

```
Fix:
1. Check Cloudinary credentials on Render
2. Verify API Key/Secret in .env
3. Check file size limits (5MB images, 50MB videos)
4. Check error response in Network tab
```

### Issue: Real-time messaging not working

```
Fix:
1. Check Socket.io URL in frontend
2. Verify WebSocket enabled on Render
3. Check auth token valid
4. Look for socket disconnect errors
```

---

## 📊 PRODUCTION PERFORMANCE CHECKLIST

- [ ] Compression enabled (gzip)
- [ ] MongoDB indexes created
- [ ] Cloudinary caching enabled
- [ ] CORS optimized (specific domains)
- [ ] Rate limiting configured
- [ ] Error logging setup
- [ ] Monitoring dashboards created
- [ ] Backup strategy planned

---

## 🎯 SUCCESS CRITERIA

Your production deployment is successful when:

✅ Backend health check returns 200
✅ User registration works
✅ User login works
✅ JWT tokens valid
✅ File uploads to Cloudinary
✅ Files appear in database
✅ Real-time messaging works
✅ No CORS errors
✅ No console errors
✅ Frontend loads from Vercel
✅ Mobile responsive
✅ Performance good (load time < 3s)

---

## 📞 AFTER DEPLOYMENT

### 1. Share with Users

Your FreeCall app is now live at:

```
🌐 https://freecall-frontend.vercel.app
```

### 2. Monitor Performance

**Daily:**
- Check Render logs for errors
- Check Vercel logs for build issues
- Monitor user feedback

**Weekly:**
- Review MongoDB metrics
- Check Cloudinary storage usage
- Monitor performance graphs

### 3. Scale if Needed

Free tier limits:
- Render: Suspends after 15 min inactivity
- Vercel: 1,000 deployments/month
- MongoDB: M0 (512MB storage)

Upgrade when:
- Users complain about slowness
- Storage exceeds 500MB
- More than 1000 concurrent users
- Need real-time collaboration at scale

---

## 🚀 FINAL SUMMARY

| Component | Service | URL |
|-----------|---------|-----|
| Backend | Render | https://freecall-backend.onrender.com |
| Frontend | Vercel | https://freecall-frontend.vercel.app |
| Database | MongoDB Atlas | Cloud (no public URL) |
| Files | Cloudinary | https://res.cloudinary.com/... |

**Deployment complete!** 🎉

Your FreeCall application is now running in production!

