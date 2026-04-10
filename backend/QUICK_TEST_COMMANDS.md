# Quick Test Commands - Copy & Paste Ready

## 1️⃣ TEST REGISTRATION

```powershell
$body = @{
    username = "testuser123"
    email = "testuser@example.com"
    password = "Password123"
    confirmPassword = "Password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

$result = $response.Content | ConvertFrom-Json
Write-Host "✅ Registration Successful!"
Write-Host "User ID: $($result.user.id)"
Write-Host "Access Token: $($result.accessToken)"
Write-Host "Refresh Token: $($result.refreshToken)"

# SAVE THE ACCESS TOKEN FOR NEXT STEPS!
```

---

## 2️⃣ TEST LOGIN (Optional - if user already exists)

```powershell
$body = @{
    email = "testuser@example.com"
    password = "Password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

$result = $response.Content | ConvertFrom-Json
Write-Host "✅ Login Successful!"
Write-Host "Access Token: $($result.accessToken)"

# SAVE THE ACCESS TOKEN FOR NEXT STEPS!
```

---

## 3️⃣ TEST UPLOAD PROFILE PICTURE

**First, replace `YOUR_ACCESS_TOKEN_HERE` with token from Step 1 or 2**

```powershell
# Set your token here
$token = "YOUR_ACCESS_TOKEN_HERE"

# Create a test image first (1x1 pixel transparent PNG)
$base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
[System.Convert]::FromBase64String($base64Image) | Set-Content -Path "test-image.png" -AsByteStream

# Upload the image
$form = @{
    file = Get-Item -Path "test-image.png"
}

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/upload/profile-picture" `
  -Method PUT `
  -Headers @{
    "Authorization" = "Bearer $token"
  } `
  -Form $form

$result = $response.Content | ConvertFrom-Json
Write-Host "✅ Upload Successful!"
Write-Host "Image URL: $($result.data.url)"
Write-Host "Public ID: $($result.data.publicId)"
```

---

## 4️⃣ TEST GET CURRENT USER

```powershell
$token = "YOUR_ACCESS_TOKEN_HERE"

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $token"
  }

$result = $response.Content | ConvertFrom-Json
Write-Host "✅ Current User:"
Write-Host ($result | ConvertTo-Json -Depth 5)
```

---

## 5️⃣ TEST HEALTH ENDPOINT (No Auth Needed)

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET
$result = $response.Content | ConvertFrom-Json
Write-Host "✅ Health Check: $($result.status)"
```

---

## 🔐 Bash/Linux Alternative

**For Ubuntu/Mac users:**

```bash
# 1. Register
TOKEN=$(curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "✅ Access Token: $TOKEN"

# 2. Upload File
curl -X PUT http://localhost:5000/api/upload/profile-picture \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.jpg"

echo "✅ Upload Complete!"
```

---

## ✅ What to Expect

### Registration Response
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser123",
    "email": "testuser@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Upload Response
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/daxyxxsrg/image/upload/...",
    "publicId": "freecall/profiles/abc123xyz"
  }
}
```

---

## 🚨 Common Issues & Fixes

### ❌ "Unauthorized" on Upload
**Problem**: Token is invalid or missing
**Fix**: 
- Copy token correctly from registration response
- Make sure to include `Bearer ` prefix
- Token might have expired - get a new one via login

### ❌ "User already exists"
**Problem**: Username or email already registered
**Fix**:
- Use a different username/email
- Or login with existing credentials instead

### ❌ "File size exceeds 5MB limit"
**Problem**: Image file is too large
**Fix**:
- Use smaller image (under 5MB)
- Or compress image first

### ❌ Connection refused
**Problem**: Server not running
**Fix**:
```bash
npm start
# Wait for "🚀 Server running on http://localhost:5000"
```

---

## 📊 Complete Test Checklist

- [ ] Server running (`npm start`)
- [ ] Register new user (Step 1)
- [ ] Get access token from response
- [ ] Upload profile picture (Step 3 with token)
- [ ] Check Cloudinary dashboard for image
- [ ] Check MongoDB for stored URL
- [ ] Test logout (clear cookies)
- [ ] Login again to verify credentials

---

## 🎉 Success Indicators

✅ When working correctly, you should see:
- ✅ User registered in MongoDB
- ✅ JWT tokens issued
- ✅ Profile picture in Cloudinary cloud
- ✅ URL stored in User model
- ✅ Can upload multiple times (replaces old file)
- ✅ Token refresh works automatically

You have a complete authentication + file upload system working! 🚀

