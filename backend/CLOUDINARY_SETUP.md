# Cloudinary File Upload Integration

Your FreeCall backend is now integrated with Cloudinary for image and video uploads!

## ✅ What's Configured

- ✅ **Cloudinary Account Connected**
- ✅ **File Validation** (type, size, format)
- ✅ **Image Uploads** (JPEG, PNG, GIF, WebP - max 5MB)
- ✅ **Video Uploads** (MP4, MOV, WebM - max 50MB)
- ✅ **Automatic File Deletion** (when replacing)
- ✅ **Database Integration** (URLs & PublicIDs stored)

---

## 📡 Upload Endpoints

### 1. Upload Profile Picture
```
PUT /api/upload/profile-picture
Authentication: Required (Bearer token)
```

**Request:**
```bash
curl -X PUT http://localhost:5000/api/upload/profile-picture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "freecall/profiles/xxx"
  }
}
```

**Updates in Database:**
- `User.profilePicture` - Cloudinary URL
- `User.profilePicturePublicId` - For deletion

---

### 2. Upload Group Avatar
```
PUT /api/upload/avatar/:conversationId
Authentication: Required (Bearer token)
Authorization: Must be group admin
```

**Request:**
```bash
curl -X PUT http://localhost:5000/api/upload/avatar/CONVERSATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Group avatar uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "freecall/avatars/xxx"
  }
}
```

**Updates in Database:**
- `Conversation.groupAvatar` - Cloudinary URL
- `Conversation.groupAvatarPublicId` - For deletion

---

### 3. Upload Media (Images/Videos for Messages)
```
POST /api/upload/media
Authentication: Required (Bearer token)
```

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload/media \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@image1.jpg" \
  -F "files=@video1.mp4" \
  -F "files=@image2.png"
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
      "duration": 30.5,
      "width": 1280,
      "height": 720
    }
  ],
  "errors": []  // Shows if any files failed
}
```

**Features:**
- Max 10 files per request
- Automatic type detection
- Returns metadata (dimensions, duration)

---

### 4. Delete Uploaded File
```
DELETE /api/upload/:publicId
Authentication: Required (Bearer token)
```

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/upload/freecall/profiles/xxx \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": { "result": "ok" }
}
```

---

## 🎯 File Validation Rules

### Images
| Parameter | Limit |
|-----------|-------|
| **Max Size** | 5 MB |
| **Formats** | JPEG, PNG, GIF, WebP |
| **Use Case** | Profile pics, group avatars |

### Videos
| Parameter | Limit |
|-----------|-------|
| **Max Size** | 50 MB |
| **Formats** | MP4, MOV, WebM |
| **Use Case** | Chat messages, media sharing |

### Multiple Files
| Parameter | Limit |
|-----------|-------|
| **Max Files** | 10 per request |
| **Total Size** | 50 MB combined |

---

## 💾 Database Fields Added

### User Model
```javascript
profilePicture: {
  type: String,
  description: "Cloudinary URL"
}
profilePicturePublicId: {
  type: String,
  description: "Cloudinary public ID (for deletion)"
}
```

### Conversation Model
```javascript
groupAvatar: {
  type: String,
  description: "Cloudinary URL"
}
groupAvatarPublicId: {
  type: String,
  description: "Cloudinary public ID (for deletion)"
}
```

---

## 🚀 Usage Example (From Frontend)

```javascript
// Upload profile picture using FormData
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload/profile-picture', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded:', result.data.url);
```

---

## 🔧 Advanced Features

### Image URL Optimization
```javascript
// Available in uploadService.js
import { optimizeImageUrl } from '../services/uploadService.js';

const url = 'https://res.cloudinary.com/...';
const thumbnail = optimizeImageUrl(url, 'thumbnail');  // 150x150
const medium = optimizeImageUrl(url, 'medium');        // 500x500
const banner = optimizeImageUrl(url, 'banner');        // 1200x400
const avatar = optimizeImageUrl(url, 'avatar');        // 200x200 with face focus
```

### Direct Upload Service Usage
```javascript
import {
  uploadToCloudinary,
  validateFile,
  deleteFromCloudinary
} from '../services/uploadService.js';

// Validate before upload
const validation = validateFile(file, 'image');

// Upload file
const result = await uploadToCloudinary(file, 'profilePicture');

// Delete file
await deleteFromCloudinary(result.publicId, 'image');
```

---

## ✅ Testing Uploads

### Test Profile Picture Upload
```bash
# Create a test image first
# Then upload it
curl -X PUT http://localhost:5000/api/upload/profile-picture \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-image.jpg"
```

### Test Media Upload
```bash
curl -X POST http://localhost:5000/api/upload/media \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg"
```

---

## 📊 Upload Folder Structure in Cloudinary

Files are automatically organized:

```
freecall
├── images/         # Chat media images
├── videos/         # Chat media videos
├── profiles/       # User profile pictures
└── avatars/        # Group conversation avatars
```

---

## 🔐 Security Features

✅ **File Validation**
- MIME type checking
- File size limits
- Extension verification

✅ **Authentication**
- JWT token required
- Authorization checks
- User ownership verification

✅ **Auto-Cleanup**
- Old files deleted before replacing
- PublicID stored for deletion

✅ **Error Handling**
- Detailed error messages
- Validation feedback
- Graceful error responses

---

## 🚨 Error Handling

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `No file provided` | Missing file in request | Add file in form-data |
| `File size exceeds limit` | File too large | Use smaller file |
| `Invalid file type` | Wrong format | Use JPEG, PNG, GIF, WebP for images |
| `Unauthorized` | No auth token | Add Bearer token |
| `Only admin can change` | Not group admin | Use admin account |

---

## 📚 Related Files

- **Config**: `src/config/cloudinary.js`
- **Service**: `src/services/uploadService.js`
- **Middleware**: `src/middlewares/uploadMiddleware.js`
- **Controller**: `src/controllers/uploadController.js`
- **Routes**: `src/routes/upload.js`
- **Models**: `src/models/User.js`, `src/models/Conversation.js`

---

## ✨ What's Next

1. **Test uploads** via API endpoints
2. **Connect frontend** with upload forms
3. **Handle responses** in UI (show URLs)
4. **Delete functionality** when replacing files
5. **Progress tracking** for large files
6. **Image optimization** for different screen sizes

---

## 🎉 Ready to Upload!

Your backend now supports full image and video uploads with Cloudinary. All files are:
- ✅ Validated for type and size
- ✅ Stored in the cloud (Cloudinary)
- ✅ Tracked in your database
- ✅ Optimizable for different uses

Start using the upload endpoints in your frontend! 🚀

