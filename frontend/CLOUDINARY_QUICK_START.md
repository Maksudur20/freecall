# 🚀 Cloudinary Setup - 10 Minute Quick Start

## 1. Get Cloudinary Credentials (2 min)

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up for Free"
3. Sign up and verify email
4. Go to **Dashboard**
5. Copy:
   - **Cloud Name** (top right)
   - **API Key** (settings gear)
   - **API Secret** (settings gear)

## 2. Configure Backend (2 min)

Edit `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## 3. Configure Frontend (2 min)

Edit `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
```

## 4. Install Dependencies (1 min)

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## 5. Restart Servers (1 min)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 6. Update Chat Component (1 min)

In your ChatPage or wherever MessageInput is used:

```jsx
// BEFORE
<MessageInput
  onSendMessage={handleSendMessage}
  onTyping={handleTyping}
/>

// AFTER
<MessageInput
  conversationId={conversationId}  // ADD THIS
  onSendMessage={handleSendMessage}
  onTyping={handleTyping}
/>
```

Update the handler:

```jsx
// BEFORE
const handleSendMessage = (message, replyId) => {
  // ...
};

// AFTER
const handleSendMessage = (message, replyId, media) => {
  // Now you have media array if files were uploaded
  console.log('Media:', media);
};
```

## 7. Test Upload (1 min)

1. Open a chat conversation
2. Click attachment button (📎)
3. Select an image or video
4. See preview appear
5. Click send
6. Done! ✅

---

## ✨ It's Working If:

✅ Preview shows before upload
✅ Progress bar displays (%)
✅ Message sends with media
✅ Image is compressed (if > 2MB)
✅ URL is from Cloudinary (res.cloudinary.com)
✅ Files don't save locally

## 🎯 What Now Works

| Feature | Status |
|---------|--------|
| Upload images | ✅ |
| Upload videos | ✅ |
| Auto compress | ✅ |
| Preview before send | ✅ |
| Drag & drop files | ✅ |
| Progress bar | ✅ |
| Error handling | ✅ |
| Secure backend route | ✅ |

## 📚 Need More Info?

- **Setup Details**: Read `CLOUDINARY_SETUP.md`
- **API Reference**: Check `CLOUDINARY_QUICK_REF.md`
- **Implementation**: See `CLOUDINARY_IMPLEMENTATION_SUMMARY.md`

## 🆘 Troubleshooting

### "Upload failed: Invalid credentials"
- Double-check cloud name
- Verify API key and secret
- Restart backend server

### Preview not showing
- Check browser console (F12)
- Verify file type is image/video
- Make sure conversationId is passed

### Image not compressing
- Only compresses if > 2MB
- Check file size before/after

### Still not working?
- Check backend logs
- Check browser network tab (F12)
- Verify .env variables loaded
- Restart both servers

---

**That's it!** You're ready to upload media to Cloudinary. 🎉
