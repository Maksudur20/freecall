# Cloudinary Media Upload System - Setup Guide

## Overview

This guide walks you through setting up Cloudinary for media uploads with:
- ✅ Image compression before upload
- ✅ Preview before sending
- ✅ Drag & drop support
- ✅ Secure backend routes
- ✅ Automatic URL storage (no files in database)

## Files Created

### Frontend
- `src/services/cloudinaryService.js` - Cloudinary upload service
- `src/components/chat/MediaPreview.jsx` - Media preview component
- `src/components/chat/DragDropZone.jsx` - Drag & drop component
- `src/components/chat/MessageInput.jsx` - Updated with media upload

### Backend
- `src/services/cloudinaryService.js` - Backend Cloudinary integration
- `src/controllers/chatController.js` - Updated with Cloudinary endpoints
- `src/routes/chat.js` - Added upload routes

## Step 1: Install Dependencies

### Frontend
```bash
cd frontend
npm install uuid
```

### Backend
```bash
cd backend
npm install cloudinary
```

If you're using the cloudinary package, you might already have it. Version requirement: v1.30+

## Step 2: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to Dashboard
4. Copy your **Cloud Name**, **API Key**, and **API Secret**

## Step 3: Configure Backend Environment

Update `backend/.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Step 4: Configure Frontend Environment

Update `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_optional
```

**Note:** The upload preset is optional if you're uploading through the backend route (recommended for security).

## Step 5: Backend Cloudinary Service Setup

The backend service automatically:
- Uploads files to Cloudinary
- Organizes files by conversation ID
- Retrieves metadata (width, height, duration)
- Handles deletions

No additional configuration needed!

## Step 6: Update API Service (Optional)

If you want to keep the old file upload alongside Cloudinary, the API service still supports both:

```javascript
// Old method (local uploads)
uploadMedia(conversationId, files)

// New method (Cloudinary - used internally)
cloudinaryUpload POST /api/chat/cloudinary-upload
```

## Step 7: Update ChatPage/Chat Component

Make sure to pass `conversationId` to MessageInput:

```jsx
import MessageInput from '../components/chat/MessageInput';

function ChatPage() {
  const { conversationId } = useParams();

  return (
    <MessageInput
      conversationId={conversationId}
      onSendMessage={handleSendMessage}
      onTyping={handleTyping}
    />
  );
}
```

## Step 8: Verify Installation

1. Start backend: `npm start`
2. Start frontend: `npm run dev`
3. Open a conversation
4. Try uploading an image or video
5. Check that:
   - Preview appears before upload
   - File compresses automatically (if > 2MB)
   - Upload progress shows
   - Message sends with Cloudinary URL

## Features Overview

### Image Compression

- Automatic compression for images > 2MB
- Max dimensions: 1920x1080
- Quality: 85%
- Saves bandwidth and time

### Preview System

- Shows thumbnail before upload
- Displays file size
- Shows upload progress
- Allows removal before sending

### Drag & Drop

- Drag files directly into chat
- Visual feedback while dragging
- Supports multiple files

### Security

- Uploads through backend route (not directly to Cloudinary)
- Only authenticated users can upload
- Files organized by conversation
- Automatic cleanup available

## API Endpoints

### Upload to Cloudinary (Backend Route)

```
POST /api/chat/cloudinary-upload
Content-Type: multipart/form-data

Body:
- file: (File)
- conversationId: string

Response:
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "freecall/conversations/...",
  "type": "image" | "video",
  "name": "filename.jpg",
  "size": 1024000,
  "mimeType": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "duration": null
}
```

### Delete from Cloudinary

```
POST /api/chat/cloudinary-delete

Body:
{
  "publicId": "freecall/conversations/conv-id/file-id"
}

Response:
{
  "message": "File deleted successfully"
}
```

## Usage Examples

### Basic Usage

```jsx
<MessageInput
  conversationId="conv-123"
  onSendMessage={(message, replyId, media) => {
    // Handle message with media
    console.log('Message:', message);
    console.log('Media:', media);
  }}
/>
```

### Direct Upload Using Service

```javascript
import cloudinaryService from '@services/cloudinaryService';

// Upload single file
const result = await cloudinaryService.uploadToCloudinary(file, {
  conversationId: 'conv-123',
  onProgress: (percent) => console.log(`${percent}%`),
});

console.log(result.url); // Use this URL
```

### Compress Image

```javascript
import cloudinaryService from '@services/cloudinaryService';

const compressedBlob = await cloudinaryService.compressImage(
  file,
  1920, // maxWidth
  1080, // maxHeight
  0.85  // quality
);
```

## Database Schema Update

When storing messages with media, you can store just the URL:

```javascript
// Message schema
{
  conversationId: ObjectId,
  senderId: ObjectId,
  content: String, // Message text
  media: [
    {
      type: 'image' | 'video',
      url: String, // Cloudinary URL - store this
      publicId: String, // For deletion if needed
      mimeType: String,
      name: String,
      size: Number,
      dimensions: {
        width: Number,
        height: Number,
        duration: Number // For videos
      }
    }
  ],
  timestamp: Date,
  reactions: Array,
  seenBy: Array,
}
```

## Frontend Component Props

### MessageInput Props

```jsx
<MessageInput
  conversationId={string}      // Required for uploads
  onSendMessage={function}     // Called when sending
  onTyping={function}          // Called when typing
  disabled={boolean}           // Optional: disable input
  replyingTo={object}          // Optional: message being replied to
  onCancelReply={function}     // Optional: cancel reply
/>
```

### onSendMessage Callback

```javascript
onSendMessage(message, replyId, mediaArray)

// message: string - text content
// replyId: string - ID of message being replied to
// mediaArray: [
//   {
//     type: 'media',
//     content: 'https://res.cloudinary.com/...',
//     mediaType: 'image' | 'video',
//     fileName: 'photo.jpg',
//     fileSize: 1024000,
//     publicId: 'freecall/conversations/...',
//     dimensions: { width: 800, height: 600, duration: null }
//   }
// ]
```

## Environment Variables Checklist

### Backend (.env)
- [ ] CLOUDINARY_CLOUD_NAME
- [ ] CLOUDINARY_API_KEY
- [ ] CLOUDINARY_API_SECRET
- [ ] CORS_ORIGIN (includes frontend URL)

### Frontend (.env)
- [ ] VITE_BACKEND_URL
- [ ] VITE_CLOUDINARY_CLOUD_NAME

## Troubleshooting

### "Upload failed: Invalid credentials"
- Check Cloudinary cloud name in .env
- Verify API key and secret are correct
- Restart backend server

### "413 Payload Too Large"
- File size exceeds 100MB limit
- Check file size before upload
- Cloudinary free tier: max 100MB

### Preview not showing
- Check browser console for errors
- Verify file type is image or video
- Check that `conversationId` is passed to MessageInput

### Images not compressing
- Only compresses images > 2MB
- Check file size before/after
- Canvas API might be blocked (check browser console)

### Upload hangs or timeout
- Check internet connection
- Verify backend is running
- Check firewall settings
- Try smaller file first

### "Cannot find module 'uuid'"
- Run `npm install uuid` in frontend
- Restart dev server

## Security Best Practices

1. **Use Backend Route** - Always upload through backend (not direct to Cloudinary)
2. **Verify Users** - Backend verifies authentication before accepting uploads
3. **Organize Files** - Files are organized by conversation ID
4. **Add Watermarks** - Optional: add watermarks via Cloudinary transformations
5. **Delete on Message Delete** - Call `cloudinaryDelete` when message is deleted

## Performance Tips

1. **Image Compression** - Automatically compresses images > 2MB
2. **Quality Settings** - Default 85% quality (adjust if needed)
3. **Lazy Loading** - Load image thumbnails with low quality first
4. **CDN Caching** - Cloudinary automatically caches globally
5. **Format Optimization** - Use `f_auto` for automatic format selection

## Optional: Enable Direct Upload Presets

If you want clients to upload directly to Cloudinary (not recommended for private chats):

1. In Cloudinary Dashboard: Settings > Upload
2. Create Upload Preset (name: freecall_chat)
3. Set to "Unsigned"
4. Add `VITE_CLOUDINARY_UPLOAD_PRESET=freecall_chat` to frontend .env
5. Modify `cloudinaryService.js` to support direct uploads

## Migration from Local Uploads

If you had local file uploads before:

```javascript
// Old URLs: /uploads/media/filename.jpg
// New URLs: https://res.cloudinary.com/cloud/image/upload/...

// To migrate existing messages:
// 1. Export local filenames
// 2. Delete local files
// 3. Store only Cloudinary URLs going forward
```

## Storage & Quotes

### Free Tier Limits
- 10 GB storage
- 20 GB bandwidth/month
- No watermarks
- Auto format optimization

### Paid Plans
- More storage/bandwidth
- Advanced features
- Custom domain
- Priority support

## API Reference

### cloudinaryService Methods

```javascript
// Upload single file
await uploadToCloudinary(file, options)

// Upload multiple files
await uploadMultiple(files, options)

// Compress image
await compressImage(file, maxWidth, maxHeight, quality)

// Delete file
await deleteMedia(publicId)

// Get preview URL
getPreviewUrl(publicId, type, width, height)

// Get optimized URL
getOptimizedUrl(publicId, type, options)

// Backend delete
DELETE /api/chat/cloudinary-delete
```

## Support & Resources

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Upload API](https://cloudinary.com/documentation/image_upload_api)
- [Transformations](https://cloudinary.com/documentation/transformation_reference)

## Next Steps

1. ✅ Set up Cloudinary account
2. ✅ Configure environment variables
3. ✅ Install dependencies
4. ✅ Test upload functionality
5. ✅ Update message schema (optional)
6. ✅ Deploy to production

## Notes

- Images automatically compress if > 2MB
- Videos are not compressed (stream directly)
- Max file size: 100MB per file
- All files organized by conversation for easy management
- Secure backend routes prevent unauthorized uploads
