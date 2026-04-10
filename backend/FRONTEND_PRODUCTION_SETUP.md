# Frontend Production Setup Guide

Complete guide to prepare your React frontend for production deployment.

---

## 📋 Prerequisites

You have:
- React app (Create React App or Vite)
- Backend deployed on Render: `https://freecall-backend.onrender.com`
- Frontend ready to deploy on Vercel

---

## 1️⃣ CREATE ENVIRONMENT VARIABLES

### For Development (`.env.development`)

Create `freecall-frontend/.env.development`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### For Production (`.env.production`)

Create `freecall-frontend/.env.production`:

```env
REACT_APP_API_BASE_URL=https://freecall-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://freecall-backend.onrender.com
```

---

## 2️⃣ CREATE API CLIENT

Create `src/api/client.js`:

```javascript
// API Base URL from environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && !endpoint.includes('/auth/')) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// API Methods
export const api = {
  // Auth
  register: (data) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiCall('/auth/logout', { method: 'POST' }),

  refreshToken: () =>
    apiCall('/auth/refresh', { method: 'POST' }),

  // Users
  getProfile: () => apiCall('/users/profile'),

  updateProfile: (data) =>
    apiCall('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Upload
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall('/upload/profile-picture', {
      method: 'PUT',
      body: formData,
      headers: {}, // Remove Content-Type header for FormData
    });
  },

  uploadMedia: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return apiCall('/upload/media', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  deleteUploadedFile: (publicId) =>
    apiCall(`/upload/${publicId}`, { method: 'DELETE' }),

  // Chat
  getConversations: () => apiCall('/chat/conversations'),

  getMessages: (conversationId, limit = 50) =>
    apiCall(`/chat/messages/${conversationId}?limit=${limit}`),

  sendMessage: (conversationId, data) =>
    apiCall(`/chat/messages/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Friends
  getFriends: () => apiCall('/friends'),

  sendFriendRequest: (userId) =>
    apiCall(`/friends/request/${userId}`, { method: 'POST' }),

  acceptFriendRequest: (requestId) =>
    apiCall(`/friends/accept/${requestId}`, { method: 'POST' }),

  // Notifications
  getNotifications: () => apiCall('/notifications'),

  markNotificationAsRead: (notificationId) =>
    apiCall(`/notifications/${notificationId}/read`, { method: 'PUT' }),
};

// Socket.io Configuration
export const getSocketURL = () => SOCKET_URL;
```

---

## 3️⃣ USE API CLIENT IN COMPONENTS

### Example: Login Component

```javascript
import React, { useState } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login({ email, password });
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Example: Socket.io Setup

```javascript
// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getSocketURL } from '../api/client';

export function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const newSocket = io(getSocketURL(), {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✓ Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Disconnected from server');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return socket;
}
```

```javascript
// src/App.js
import { useSocket } from './hooks/useSocket';

function App() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      console.log('New message:', message);
    });

    socket.on('user_typing', (data) => {
      console.log('User typing:', data);
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [socket]);

  return <div>Your App</div>;
}
```

---

## 4️⃣ FILE UPLOAD IN REACT

### Example: Profile Picture Upload

```javascript
import { useState } from 'react';
import { api } from '../api/client';

export function ProfilePictureUpload() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setLoading(true);
    setError('');

    try {
      const response = await api.uploadProfilePicture(file);
      console.log('Upload successful:', response.imageUrl);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {preview && (
        <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={loading}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Uploading...</p>}
    </div>
  );
}
```

---

## 5️⃣ TYPESCRIPT SUPPORT (Optional but Recommended)

### Create `src/api/types.ts`

```typescript
// User Types
export interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

// Message Types
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrls?: string[];
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Response
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}
```

---

## 6️⃣ ERROR HANDLING & RETRY LOGIC

### Create `src/api/retry.js`

```javascript
export async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Only retry on network errors, not auth errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`Retry attempt ${attempt}/${maxRetries}...`);
    }
  }
}
```

Usage:
```javascript
const data = await apiCallWithRetry(() => api.getConversations());
```

---

## 7️⃣ BUILD FOR PRODUCTION

### Optimize your React app:

```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm install -g serve
serve -s build -l 3000
```

### Check build size:

```bash
npm install -D source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

### Optimize image loading:

```javascript
// Use lazy loading for images
<img src="image.jpg" alt="test" loading="lazy" />

// Use responsive images
<img 
  src="image.jpg" 
  srcSet="image-sm.jpg 480w, image-md.jpg 768w, image-lg.jpg 1200w"
  sizes="(max-width: 480px) 100vw, (max-width: 768px) 80vw, 100vw"
  alt="test"
/>
```

---

## 8️⃣ SECURITY BEST PRACTICES

### ✅ DO

- ✓ Store JWT in localStorage (OK for single-page apps)
- ✓ Set `credentials: 'include'` for cross-origin requests
- ✓ Use `https` in production (automatic on Vercel)
- ✓ Validate user input before sending
- ✓ Handle errors gracefully without exposing secrets

### ❌ DON'T

- ✗ Hardcode API URLs
- ✗ Store sensitive data in localStorage
- ✗ Make API calls in render (use useEffect)
- ✗ Log sensitive data to console
- ✗ Commit `.env.production` to Git

---

## 9️⃣ VERCEL DEPLOYMENT

### Step 1: Connect GitHub Repository

1. Push your frontend code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your repository

### Step 2: Configure Environment Variables

In Vercel Project Settings → Environment Variables:

```
REACT_APP_API_BASE_URL = https://freecall-backend.onrender.com/api
REACT_APP_SOCKET_URL = https://freecall-backend.onrender.com
```

Select "Production" environment.

### Step 3: Deploy

```bash
# Vercel will automatically detect:
Framework: React
Build Command: npm run build
Output Directory: build (or dist for Vite)
```

### Step 4: Verify

Your frontend will be deployed to:
- **Production**: `https://freecall-frontend.vercel.app`
- **Preview**: Auto-generated per PR

---

## 🔟 TESTING PRODUCTION

### Test Login Flow

1. Visit your Vercel URL
2. Register a new account
3. Login with credentials
4. Verify JWT token saved in localStorage
5. Check API calls in Network tab (F12)

### Test File Upload

1. Go to profile settings
2. Upload profile picture
3. Check Cloudinary dashboard for new image
4. Verify URL stored in MongoDB

### Test Real-Time

1. Open app in 2 browser windows
2. Login as different users
3. Send messages
4. Verify they appear in real-time
5. Check Socket.io status in DevTools

### Test CORS

Open DevTools (F12) → Network tab:
- ✓ Status 200 for API calls
- ✓ No CORS errors
- ✓ Authorization header present

---

## 🔧 TROUBLESHOOTING

### Problem: API calls return 404

```
Solution:
1. Check REACT_APP_API_BASE_URL matches backend URL
2. Verify backend is running on Render
3. Check network tab for actual request URL
4. Ensure auth endpoints exist on backend
```

### Problem: CORS errors

```
Error: Access-Control-Allow-Origin missing

Solution:
1. Check CORS_ORIGIN in Render environment variables
2. Verify your Vercel URL is in the list
3. Clear browser cache
4. Check credentials: 'include' in api client
```

### Problem: Socket.io can't connect

```
Error: WebSocket connection failed

Solution:
1. Check REACT_APP_SOCKET_URL is correct
2. Verify Socket.io is running on backend
3. Check browser console for connection errors
4. Ensure auth token is present
```

### Problem: Images don't load

```
Solution:
1. Check Cloudinary URLs are real
2. Verify public_id in database
3. Check Cloudinary delivery settings
4. Ensure CORS enabled on Cloudinary
```

---

## 📝 DEPLOYMENT CHECKLIST

- [ ] `.env.development` created with local URLs
- [ ] `.env.production` created (NOT committed)
- [ ] API client created in `src/api/client.js`
- [ ] Components use `api` client methods
- [ ] Socket.io setup in hooks
- [ ] File uploads working locally
- [ ] All environment variables in Vercel
- [ ] Build succeeds: `npm run build`
- [ ] Login works in deployed frontend
- [ ] API calls work with deployed backend
- [ ] File uploads work with Cloudinary
- [ ] Real-time messaging works
- [ ] No console errors in production

---

## 🎉 SUCCESS INDICATORS

When deployed successfully:

✅ Frontend loads from Vercel URL
✅ Can register and login
✅ JWT stored in localStorage
✅ API calls to backend succeed
✅ Files upload to Cloudinary
✅ Messages send in real-time
✅ User status updates live
✅ No CORS errors
✅ No console errors
✅ Mobile responsive

---

## 📞 NEXT STEPS

1. **Create this structure** in your React project
2. **Replace hardcoded URLs** with environment variables
3. **Test locally** with both `.env` files
4. **Deploy to Vercel** and set environment variables
5. **Verify all features** work in production

Your React app is now production-ready! 🚀

