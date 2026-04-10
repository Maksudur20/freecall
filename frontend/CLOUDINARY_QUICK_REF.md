# Cloudinary Media Upload System - Quick Reference

## What's Included

### Services
- **cloudinaryService.js** - Frontend upload, compress, preview logic
- **cloudinaryService.js** (backend) - Cloudinary API integration

### Components
- **MediaPreview.jsx** - Shows media before sending
- **DragDropZone.jsx** - Drag & drop upload interface
- **MessageInput.jsx** - Enhanced with media upload

### Routes
- `POST /api/chat/cloudinary-upload` - Secure upload endpoint
- `POST /api/chat/cloudinary-delete` - Delete endpoint

## Quick Start

### 1. Install Dependencies
```bash
# Frontend
cd frontend && npm install uuid

# Backend  
cd backend && npm install cloudinary
```

### 2. Set Environment Variables
```env
# Backend .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend .env
VITE_BACKEND_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 3. Update Chat Component
```jsx
<MessageInput
  conversationId={conversationId}
  onSendMessage={handleSendMessage}
  onTyping={handleTyping}
/>
```

### 4. Test Upload
- Drag file to chat ✅
- Or click attachment button ✅
- See preview ✅
- File auto-compresses if needed ✅
- Progress bar shows upload ✅
- Send with message ✅

## Features at a Glance

| Feature | Status | Details |
|---------|--------|---------|
| Image Upload | ✅ | JPEG, PNG, GIF, WebP |
| Video Upload | ✅ | MP4, WebM, OGG |
| Auto Compress | ✅ | Images > 2MB compress to 85% quality |
| Preview | ✅ | Shows thumbnail before send |
| Drag & Drop | ✅ | Drop files directly into chat |
| Progress | ✅ | Shows upload % for each file |
| Secure Route | ✅ | Auth required, organized by conversation |
| Metadata | ✅ | Width, height, duration captured |
| Delete | ✅ | Remove from Cloudinary when needed |

## API Endpoints

### Upload
```
POST /api/chat/cloudinary-upload
Authorization: Bearer token

Content-Type: multipart/form-data
- file (File)
- conversationId (string)

Response: { url, publicId, type, name, size, width, height, duration }
```

### Delete
```
POST /api/chat/cloudinary-delete
Authorization: Bearer token

Body: { publicId }
Response: { message: "File deleted successfully" }
```

## Frontend Service Usage

### Direct Upload
```javascript
import cloudinaryService from '@services/cloudinaryService';

const result = await cloudinaryService.uploadToCloudinary(file, {
  conversationId: 'conv-123',
  onProgress: (percent) => updateProgressBar(percent),
});

// result.url = Cloudinary URL to use
```

### Compress Image
```javascript
const compressed = await cloudinaryService.compressImage(
  file,
  1920,  // maxWidth
  1080,  // maxHeight  
  0.85   // quality 0-1
);
```

### Generate Preview/Optimized URLs
```javascript
// Get thumbnail
const thumbUrl = cloudinaryService.getPreviewUrl('public-id', 'image', 300, 300);

// Get optimized for display
const displayUrl = cloudinaryService.getOptimizedUrl('public-id', 'image', {
  width: 800,
  height: 600,
  quality: 'auto',
  format: 'auto',
});
```

### Batch Upload
```javascript
const results = await cloudinaryService.uploadMultiple(files, {
  conversationId: 'conv-123',
  onProgress: (progress) => {
    console.log(`${progress.index}/${progress.total} - ${progress.percent}%`);
  }
});

// results.successful = uploaded files
// results.failed = files that failed
// results.hasErrors = boolean
```

## Backend Service Usage

### Upload with Metadata
```javascript
import cloudinaryBackendService from '@services/cloudinaryService';

const result = await cloudinaryBackendService.uploadFile(
  fileBuffer,
  'filename.jpg',
  conversationId
);

// result.secure_url = Cloudinary URL
// result.public_id = For later deletion
```

### Get Metadata
```javascript
const metadata = await cloudinaryBackendService.getMetadata(publicId);
// { width, height, duration, format, resourceType }
```

### Delete File
```javascript
await cloudinaryBackendService.deleteFile(publicId);
```

## Component Props

### MessageInput
```jsx
<MessageInput
  conversationId={string}        // Required for uploads
  onSendMessage={function}       // (message, replyId, media) => {}
  onTyping={function}            // () => {}
  disabled={boolean}             // Optional
  replyingTo={object}            // Optional
  onCancelReply={function}       // Optional
/>
```

### MediaPreview (Internal)
```jsx
<MediaPreview
  files={array}           // Array of media objects
  onRemove={function}     // (fileId) => {}
  uploading={boolean}     // Show progress?
/>
```

### DragDropZone (Internal)
```jsx
<DragDropZone
  onFilesSelected={function}  // (files) => {}
  disabled={boolean}          // Disable dropping?
/>
```

## Message Format with Media

When message has media:

```javascript
onSendMessage(
  "[IMAGE] https://res.cloudinary.com/.../image.jpg\n[VIDEO] https://res.cloudinary.com/.../video.mp4",
  replyingToId,
  [
    {
      type: 'media',
      content: 'https://res.cloudinary.com/.../image.jpg',
      mediaType: 'image',
      fileName: 'photo.jpg',
      fileSize: 1024000,
      publicId: 'freecall/conversations/conv-id/file-id',
      dimensions: { width: 1920, height: 1080, duration: null }
    },
    {
      type: 'media',
      content: 'https://res.cloudinary.com/.../video.mp4',
      mediaType: 'video',
      fileName: 'video.mp4',
      fileSize: 5000000,
      publicId: 'freecall/conversations/conv-id/file-id',
      dimensions: { width: 1280, height: 720, duration: 45.5 }
    }
  ]
)
```

## File Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max File Size | 100 MB | Per file |
| Max Files | 10 | Per upload action |
| Image Compress | 2 MB | Compress if larger |
| Max Dimensions | 1920x1080 | Resized if larger |
| Compression Quality | 85% | Adjustable |

## Environment Variables

### Required
```env
# Backend
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_BACKEND_URL=http://localhost:5000
```

### Optional
```env
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Upload fails | Check cloud name, API key, API secret in .env |
| Preview broken | Verify file type is image/video |
| No compression | Check file > 2MB |
| Hangs on upload | Check internet, verify backend running |
| Missing uuid | Run `npm install uuid` in frontend |
| Files not deleting | Verify publicId is correct format |

## Files Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── cloudinaryService.js (NEW)
│   ├── components/
│   │   └── chat/
│   │       ├── MessageInput.jsx (UPDATED)
│   │       ├── MediaPreview.jsx (NEW)
│   │       └── DragDropZone.jsx (NEW)
│
backend/
├── src/
│   ├── services/
│   │   └── cloudinaryService.js (NEW)
│   ├── controllers/
│   │   └── chatController.js (UPDATED)
│   └── routes/
│       └── chat.js (UPDATED)
└── .env (ADD VARS)
```

## Database Schema

### Message with Media
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  senderName: String,
  content: String,  // Text + media URLs
  messageType: String,  // 'text', 'media', 'mixed'
  media: [
    {
      type: String,  // 'image' | 'video'
      url: String,   // Cloudinary secure URL
      publicId: String,  // For deletion
      name: String,
      size: Number,
      dimensions: {
        width: Number,
        height: Number,
        duration: Number
      }
    }
  ],
  timestamp: Date,
  ...
}
```

## Performance Notes

- Images auto-compress for bandwidth savings
- Cloudinary CDN globally caches files
- Only authenticated users can upload
- Files organized by conversation
- Drag & drop is instant preview
- 85% quality balances size/visuals

## Security

✅ Backend auth required
✅ Files organized by conversation
✅ Cannot access other conversations' files
✅ Auto-deletion available on message delete
✅ No public URLs without conversation access

## Next Steps

1. Create Cloudinary account
2. Get Cloud Name, API Key, API Secret
3. Add to backend .env
4. Add to frontend .env
5. Install uuid: `npm install uuid`
6. Test upload in chat
7. Update database schema (optional)
8. Deploy

## Support

- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Upload API Docs](https://cloudinary.com/documentation/image_upload_api)
- Check browser console for errors
- Check backend logs for upload errors
