# Complete Authentication + File Upload Guide

Your FreeCall backend has everything set up! Here's how to test the complete flow.

---

## 🎯 Complete Workflow

```
User Registration
     ↓
Access Token + Refresh Token
     ↓
Use Access Token to Upload Files
     ↓
Files Stored in Cloudinary + Database
```

---

## 📋 Step-by-Step Testing Guide

### **Step 1: Register a New User**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "username": "testuser",
    "email": "test@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save these tokens!** We'll use them next.

---

### **Step 2: Login (Alternative to Registration)**

If user already exists:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

**Response:**
```json
{
  "message": "Logged in successfully",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "username": "testuser",
    "email": "test@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Also receives `refreshToken` in HTTP-only cookie** (automatic)

---

### **Step 3: Upload Profile Picture**

Use the `accessToken` from Step 1 or 2:

```bash
curl -X PUT http://localhost:5000/api/upload/profile-picture \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -F "file=@C:/path/to/image.jpg"
```

Replace `YOUR_ACCESS_TOKEN_HERE` with the actual token from login/register.

**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/daxyxxsrg/image/upload/v1712800000/freecall/profiles/abc123.jpg",
    "publicId": "freecall/profiles/abc123"
  }
}
```

---

### **Step 4: Upload Media Files (Images/Videos)**

```bash
curl -X POST http://localhost:5000/api/upload/media \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -F "files=@C:/path/to/image1.jpg" \
  -F "files=@C:/path/to/image2.png" \
  -F "files=@C:/path/to/video.mp4"
```

**Response:**
```json
{
  "success": true,
  "message": "3 file(s) uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "freecall/images/xxx",
      "type": "image",
      "size": 245632,
      "width": 1920,
      "height": 1080
    },
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "freecall/videos/xxx",
      "type": "video",
      "size": 5242880,
      "duration": 30.5
    }
  ]
}
```

---

### **Step 5: Verify in MongoDB**

Check your database to see stored data:

1. Go to **[MongoDB Atlas Dashboard](https://www.mongodb.com/cloud/atlas)**
2. Click **Deployments** → Your Cluster
3. Click **Browse Collections**
4. Expand `freecall` database
5. Check collections:
   - **users** - See `profilePicture` field populated
   - **messages** - See media URLs if sent in chat

---

### **Step 6: Verify in Cloudinary**

Check if files are stored:

1. Go to **[Cloudinary Dashboard](https://cloudinary.com/console)**
2. Click **Media Library**
3. Look in folders:
   - `freecall/profiles/` - Profile pictures
   - `freecall/images/` - Chat images
   - `freecall/videos/` - Chat videos
   - `freecall/avatars/` - Group avatars

---

## 🔑 Available Endpoints Summary

### Authentication
| Method | Endpoint | Public | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/register` | ✅ Yes | Create new user |
| POST | `/api/auth/login` | ✅ Yes | Login & get tokens |
| POST | `/api/auth/refresh-token` | ✅ Yes | Get new access token |
| POST | `/api/auth/logout` | ✅ Yes | Logout (clear cookie) |
| GET | `/api/auth/me` | ❌ Protected | Get current user |

### File Upload
| Method | Endpoint | Authentication | Purpose |
|--------|----------|-----------------|---------|
| PUT | `/api/upload/profile-picture` | ✅ Required | Upload profile pic |
| PUT | `/api/upload/avatar/:conversationId` | ✅ Required | Upload group avatar |
| POST | `/api/upload/media` | ✅ Required | Upload media for messages |
| DELETE | `/api/upload/:publicId` | ✅ Required | Delete file |

---

## 🔐 Authentication Details

### Access Token
- **Lifespan**: 15 minutes
- **Stored**: In response JSON (frontend stores in localStorage/sessionStorage)
- **Usage**: `Authorization: Bearer YOUR_TOKEN`
- **Expires**: Gets a new one via refresh token

### Refresh Token
- **Lifespan**: 30 days
- **Stored**: HTTP-only cookie (automatically sent with requests)
- **Usage**: Automatic - backend uses to issue new access token
- **Security**: Cannot be accessed by JavaScript (XSS protection)

### Password Security
- **Hashing**: bcryptjs with 10 salt rounds
- **Minimum**: 8 characters
- **Requirements**: Uppercase, lowercase, numbers recommended
- **Never Stored**: Plain text passwords never stored

---

## 📱 Frontend Integration Example

### Register User
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'newuser',
    email: 'user@example.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123'
  })
});

const data = await response.json();
// Save accessToken to localStorage
localStorage.setItem('accessToken', data.accessToken);
// Refresh token auto-saved in cookie
```

### Upload File
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload/profile-picture', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: formData
});

const result = await response.json();
console.log('File URL:', result.data.url);
```

### Refresh Token (Automatic)
```javascript
const refreshAccessToken = async () => {
  const response = await fetch('/api/auth/refresh-token', {
    method: 'POST',
    credentials: 'include' // Include cookies
  });

  const data = await response.json();
  // Update token in localStorage
  localStorage.setItem('accessToken', data.accessToken);
};
```

---

## ✅ Security Checklist

✅ **Passwords**
- Hashed with bcryptjs
- Never sent back to client
- Minimum 8 characters required

✅ **Access Token**
- Short-lived (15 minutes)
- Sent in Authorization header
- Regenerated via refresh token

✅ **Refresh Token**
- Long-lived (30 days)
- HTTP-only cookie (JS can't access)
- Automatically included in requests

✅ **Routes Protected**
- File upload endpoints require token
- Database operations require auth
- User data isolated per account

✅ **Input Validation**
- All fields validated
- Email format checked
- Username constraints enforced
- Password complexity required

---

## 🚨 Error Handling

### Registration Errors
```
❌ "Username must be 3-30 characters"
❌ "Valid email required"
❌ "Password must be at least 8 characters"
❌ "User already exists"
```

### Login Errors
```
❌ "User not found"
❌ "Invalid password"
❌ "Valid email required"
```

### Upload Errors
```
❌ "No file provided"
❌ "File size exceeds 5MB limit"
❌ "Invalid file type"
❌ "Unauthorized" (missing/invalid token)
```

### Token Errors
```
❌ "Invalid token"
❌ "Token expired"
❌ "No refresh token"
```

---

## 🔄 Token Refresh Flow

### Scenario: Access Token Expires

**Frontend:**
```javascript
// Try to make API call
// Get 401 Unauthorized response
// Automatically refresh token
const newToken = await refreshAccessToken();
// Retry original request with new token
```

**Backend:**
```javascript
// Check if access token is expired
// If expired: Return 401
// Frontend refreshes automatically
// New access token issued for 15 more minutes
```

---

## 📊 Complete User Journey

```
1. User Visits App
   ↓
2. Register with Email & Password
   ✓ Password hashed with bcrypt
   ✓ User stored in MongoDB
   ✓ Access token issued (15 min)
   ✓ Refresh token set in cookie (30 days)
   ↓
3. User Uploads Profile Picture
   ✓ Request includes Access token
   ✓ Server validates token
   ✓ File uploaded to Cloudinary
   ✓ URL stored in User model
   ✓ Response with Cloudinary URL
   ↓
4. Access Token Expires
   ✓ Frontend detects 401
   ✓ Frontend uses refresh token (in cookie)
   ✓ Backend issues new access token
   ✓ Frontend retries request
   ↓
5. User Logs Out
   ✓ Refresh token cookie cleared
   ✓ Frontend removes access token
   ✓ User must login again
```

---

## 🎯 Ready to Test?

## **Test the Complete Flow Now:**

1. **Open PowerShell/Terminal**
2. **Run Register Command** (Step 1 above)
3. **Save the accessToken**
4. **Run Upload Command** (Step 3 above) with your token
5. **Check MongoDB & Cloudinary**

Your complete authentication + file upload system is ready! 🚀

---

## 📚 Related Files

- **Auth Controller**: `src/controllers/authController.js`
- **Auth Service**: `src/services/authService.js`
- **Auth Routes**: `src/routes/auth.js`
- **Auth Middleware**: `src/middlewares/auth.js`
- **Upload Controller**: `src/controllers/uploadController.js`
- **Upload Routes**: `src/routes/upload.js`

