## Notification Sound Setup Guide

### File Requirements

**Location:** `/public/notification-sound.mp3`

**Specifications:**
- **Format:** MP3 (required - supported across all browsers)
- **Duration:** 0.5-2 seconds (shorter is better for UX)
- **Frequency Level:** Use sound without jarring high frequencies
- **Sample Rate:** 44.1 kHz or higher
- **Bit Rate:** 128-192 kbps
- **File Size:** < 100KB

### Where to Place the File

```
freecall/
├── frontend/
│   └── public/
│       └── notification-sound.mp3  ← Place here
├── backend/
└── ...
```

### Recommended Sounds

#### Option 1: Subtle Chime
- Soft bell sound
- ~1 second
- Perfect for notifications

#### Option 2: Digital Ping
- Clean beep
- ~0.5 seconds
- Non-intrusive

#### Option 3: Gentle Notification
- Soft harmonic tone
- ~1.5 seconds
- Pleasant and noticeable

### How to Get a Sound

#### Free Sound Resources
- **Freesound.org** - Search "notification" or "alert"
- **Zapsplat.com** - Free sound effects
- **Notification.cool** - Notification sound library
- **Pixabay.com** - Free audio

#### Converting to MP3
If you have a WAV or other format:
- Use **FFmpeg**: `ffmpeg -i sound.wav -codec:a libmp3lame -b:a 192k notification-sound.mp3`
- Use online converter: **Online-convert.com**
- Use **Audacity**: Free audio editor

#### Adjusting Volume
Modify in `/frontend/src/store/notificationStore.js`:

```javascript
playNotificationSound: () => {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5; // 0 (silent) to 1 (full volume)
    audio.play();
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}
```

### Implementation Verification

To verify the sound is set up correctly:

```javascript
// In browser console
const audio = new Audio('/notification-sound.mp3');
audio.play().then(() => {
  console.log('✅ Sound file loaded and playing');
}).catch(err => {
  console.error('❌ Sound file not found or autoplay blocked:', err);
});
```

### Browser Autoplay Policy

Modern browsers may block autoplay of audio:
- **User Interaction Required**: First sound must be within user action (click, etc.)
- **Once Allowed**: Subsequent sounds will play automatically
- **Solution**: System auto-plays after first notification interaction

### Fallback Behavior

If sound file is missing or fails to play:
- System continues normally (no errors)
- Notification still displays visually
- User can toggle sound without issues

### Sound Preference Storage

User's sound preference is saved in localStorage:
```javascript
localStorage.getItem('notificationSoundEnabled')
// Returns: 'true' or 'false'
```

### Testing the Sound

```javascript
// Test in component
const { testSound } = useNotifications();
testSound(); // Plays sound immediately

// Or in console
useNotificationStore.getState().playNotificationSound();
```

### Mobile Devices

On mobile:
- Sound requires user interaction to play first time
- After user gesture, autoplay works
- Check device volume/mute settings
- Some devices may not support certain frequencies

### Example Setup Steps

1. **Download a sound file**
   - Go to Freesound.org
   - Search "notification alert"
   - Download in MP3 format

2. **Place in project**
   - Save as `/public/notification-sound.mp3`

3. **Test**
   - Open app
   - Go to Notification Settings
   - Click "🔊 Test Sound"
   - Should hear the sound

4. **Done!**
   - Sound will play on new notifications

### Troubleshooting

**Sound doesn't play:**
- Check file exists at `/public/notification-sound.mp3`
- Check browser console for errors
- Check browser autoplay policy
- Check device volume isn't muted
- Try toggling sound on/off in settings

**Sound file not found:**
```
Error: "Failed to load sound file"
Solution: File must be at /public/notification-sound.mp3
```

**Autoplay blocked:**
```
Error: "NotAllowedError: play() was prevented"
Solution: Requires user gesture first, then works
```

### Custom Sound for Different Types

To play different sounds for different notification types, modify `playNotificationSound()`:

```javascript
playNotificationSound: (type = 'default') => {
  const soundMap = {
    message: '/sounds/message.mp3',
    friend_request: '/sounds/friend.mp3',
    call_incoming: '/sounds/call.mp3',
    default: '/notification-sound.mp3',
  };

  const audioPath = soundMap[type] || soundMap.default;
  const audio = new Audio(audioPath);
  audio.volume = 0.5;
  audio.play().catch(err => console.log('Sound blocked:', err));
}
```

Then place multiple sound files:
```
public/
├── notification-sound.mp3
├── sounds/
│   ├── message.mp3
│   ├── friend.mp3
│   └── call.mp3
```

### GDPR/Privacy Notes

- Sound files are loaded from your server
- No third-party tracking
- User controls audio permission
- Preference stored locally (localStorage)

---

## Quick Links

- **Freesound.org:** https://freesound.org/
- **Zapsplat:** https://www.zapsplat.com/
- **FFmpeg Guide:** https://ffmpeg.org/
- **Online Converter:** https://online-convert.com/

---

Your notification sound is set up! Users can now enjoy audio alerts with full control.
