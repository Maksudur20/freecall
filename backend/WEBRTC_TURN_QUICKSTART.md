# WebRTC TURN Server - Quick Start Guide

## 🚀 Setup in 5 Minutes

Choose your TURN provider and follow the steps below.

## Option 1: Metered.ca (Easiest - Recommended)

### Step 1: Get API Key
```bash
1. Go to https://metered.ca/
2. Click "Get Started" or "Sign Up"
3. Create account (takes 1 minute)
4. Log in to dashboard
5. Copy your API key from dashboard (looks like: xxxxxxx.metered.cloud)
```

### Step 2: Configure Backend
```bash
cd backend

# Edit .env file
# Add or update these lines:
TURN_PROVIDER=metered
METERED_API_KEY=your_api_key_here

# Save and commit
git add .env
git commit -m "config: Configure Metered TURN server"
git push
```

### Step 3: Deploy
```bash
# Render will auto-deploy on push
# Monitor deployment at: https://dashboard.render.com/

# Once deployed, test:
curl -H "Authorization: Bearer <your_token>" \
  https://freecall-backend.onrender.com/api/webrtc/ice-servers
```

### Done! ✓
Your calls now use TURN for reliable connections across networks.

---

## Option 2: Twilio (More Features)

### Step 1: Create Twilio Account
```bash
1. Go to https://www.twilio.com/
2. Click "Sign up"
3. Create account (verify email/phone)
4. Log in to https://console.twilio.com/
```

### Step 2: Get Credentials
```bash
1. In Twilio Console, go to "Account" (bottom left)
2. Copy "Account SID" (looks like: ACxxxxxxxxxxxxxxxx)
3. Under "Auth Token", copy the token (looks like: yxxxxxxxxxx)
```

### Step 3: Install Twilio Package
```bash
cd backend
npm install twilio
```

### Step 4: Configure Backend
```bash
# Edit .env file
# Add or update these lines:
TURN_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=yxxxxxxxxxx

# Save and commit
git add .env package.json
git commit -m "config: Configure Twilio TURN server"
git push
```

### Step 5: Deploy
```bash
# Render will auto-deploy and install dependencies
# Monitor at: https://dashboard.render.com/

# Test:
curl -H "Authorization: Bearer <your_token>" \
  https://freecall-backend.onrender.com/api/webrtc/ice-servers
```

### Done! ✓
Twilio provides dynamic TURN credentials with auto-refresh.

---

## Option 3: Self-Hosted TURN (Advanced)

If you have your own TURN server (e.g., coturn):

```bash
# Edit backend/.env
TURN_PROVIDER=manual
TURN_HOST=turn.yourdomain.com
TURN_PORT=3478
TURN_USERNAME=username
TURN_PASSWORD=password

# Commit and deploy
git add .env
git commit -m "config: Configure self-hosted TURN server"
git push
```

---

## Testing

### Test That TURN is Working

```bash
# 1. Get ICE servers from API
curl -H "Authorization: Bearer <access_token>" \
  https://freecall-backend.onrender.com/api/webrtc/ice-servers

# Response should include TURN servers if configured correctly

# 2. Check in browser console during a call
# Open browser console (F12 > Console)
# Type: webrtcManager.getWebRTCInfo()
# Should show: hasTurn: true
```

### Test Calls Over Different Networks

```bash
1. Start a call on WiFi (works either way)
2. Disable WiFi on one device, use cellular
3. Call should continue working (TURN helping)
4. Check browser console: [WebRTC] ICE state messages
```

---

## Troubleshooting

### Call Fails to Connect

```bash
# Check if TURN is configured
curl -H "Authorization: Bearer <token>" \
  https://freecall-backend.onrender.com/api/webrtc/ice-servers/diagnostics

# Should show:
# "turnAvailable": true
# "provider": "metered" (or "twilio")
```

### "TURN not available" Message

**Solutions:**
1. Check `.env` file has correct TURN settings
2. Verify API key/credentials (no typos)
3. If using Twilio, ensure package installed: `npm install twilio`
4. Commit changes and wait for Render to redeploy
5. Check Render logs for errors

### Still Not Working?

```bash
# Check server logs
# Render Dashboard > Your App > Logs

# Should see during startup:
# 🌐 ICE Server Configuration: 
# { provider: 'metered', turnServersCount: 1, hasTurn: true }
```

---

## Configuration Summary

| Setting | Value | Source |
|---------|-------|--------|
| `TURN_PROVIDER` | metered OR twilio OR manual | Pick one |
| `METERED_API_KEY` | From metered.ca dashboard | If using Metered |
| `TWILIO_ACCOUNT_SID` | From Twilio console | If using Twilio |
| `TWILIO_AUTH_TOKEN` | From Twilio console | If using Twilio |
| `TURN_HOST` | your-domain.com | If using manual |
| `TURN_PORT` | 3478 | If using manual |
| `TURN_USERNAME` | username | If using manual |
| `TURN_PASSWORD` | password | If using manual |

---

## What's Happening Behind the Scenes?

1. **User starts call**
   ↓
2. **Frontend fetches ICE servers from backend API**
   ↓
3. **Backend returns STUN + TURN servers**
   ↓
4. **WebRTC tries direct connection first (faster)**
   ↓
5. **If direct fails, uses TURN relay (always works)**
   ↓
6. **Call setup complete - audio/video flowing**

---

## Next Steps

### Monitoring
```bash
# In browser console during a call:
webrtcManager.checkConnectionHealth(callId)
webrtcManager.getConnectionDiagnostics(callId)
```

### Production Checklist
- [ ] TURN configured in production `.env`
- [ ] Verified with test call on cellular
- [ ] Checked backend logs for TURN status
- [ ] Documented API key securely
- [ ] Set up monitoring alerts (optional)

### Documentation
- Full guide: `backend/WEBRTC_TURN_GUIDE.md`
- API docs: See same file, "API Endpoints" section
- Troubleshooting: See same file, "Troubleshooting" section

---

## Support

| Issue | Check |
|-------|-------|
| "TURN not available" | `TURN_PROVIDER` env var set? |
| API key invalid | Copy/paste without spaces |
| Twilio failing | `npm install twilio` done? |
| Still not working | Check Render deployment logs |

## Quick Commands

```bash
# Commit TURN configuration
git add backend/.env
git commit -m "config: Add TURN server configuration"
git push

# Check deployment
# Visit: https://dashboard.render.com/

# Test API
curl -H "Authorization: Bearer <token>" \
  https://freecall-backend.onrender.com/api/webrtc/ice-servers

# View full documentation
cat backend/WEBRTC_TURN_GUIDE.md
```

---

**Setup Time**: ~5 minutes  
**Complexity**: Easy (Metered) to Medium (Twilio)  
**Cost**: Free tier available for both Metered and Twilio  
**Result**: Calls work reliably across all networks! 🎉
