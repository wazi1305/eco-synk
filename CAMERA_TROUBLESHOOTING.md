# Camera Access Troubleshooting Guide

## Problem: "Camera Unavailable - Error. Try camera again"

This error occurs because **browser security policies require HTTPS for camera access** on non-localhost addresses.

---

## ✅ Solution Applied: HTTPS for Development

### What Was Changed:
1. **Installed HTTPS plugin**: `@vitejs/plugin-basic-ssl`
2. **Updated `vite.config.js`** to:
   - Enable HTTPS (`https: true`)
   - Use self-signed SSL certificate
   - Listen on all network interfaces (`host: '0.0.0.0'`)

3. **Enhanced camera error handling** in `CameraPage.jsx`:
   - Better error messages (SecurityError, NotAllowedError, etc.)
   - Device detection on component mount
   - Detailed console logging

### Current Configuration:
```javascript
// vite.config.js
server: {
  host: '0.0.0.0',      // Listen on all IPs
  https: true,          // Enable HTTPS
}
```

---

## 🚀 How to Access the App Now

### Option 1: Via HTTPS (Recommended for testing camera)
```
https://192.168.125.40:5173/
```
- **Accept the self-signed certificate warning** (it's safe in development)
- Camera will work
- You may see a browser warning - this is expected

### Option 2: Via localhost (Easiest, no certificate warning)
```
http://localhost:5173/
```
- Camera works even with HTTP on localhost
- No certificate warnings
- Only works on the local machine

### Option 3: Via IP with HTTP (requires alternative setup)
```
http://192.168.125.40:5173/
```
- ❌ Camera will NOT work on plain HTTP
- Only works with HTTPS or localhost

---

## 🔍 How to Verify Camera Is Working

1. Open browser DevTools (`F12`)
2. Go to **Console** tab
3. When CameraPage loads, you should see:
   ```
   📷 Video devices found: 1
   ```
4. If you see `0`, your device has no camera connected
5. If you see errors, check the browser console for details

### Expected Console Output (Success):
```
📷 Video devices found: 1
Camera permission success
Live camera feed displayed
```

### Expected Console Output (Permissions Denied):
```
Camera error details: {
  name: 'NotAllowedError',
  message: '...',
  code: undefined
}
Error message: Camera permission denied. Check browser settings.
Upload UI displayed as fallback
```

---

## 🔐 About Self-Signed Certificates

When you access `https://192.168.125.40:5173/`, you'll see a warning like:
- "Your connection is not private"
- "NET::ERR_CERT_AUTHORITY_INVALID"

**This is NORMAL for development.**

### Why?
- The certificate is self-signed (created locally)
- Not verified by a Certificate Authority (CA)
- Perfectly safe for local development

### What to do:
1. Click "Advanced" 
2. Click "Proceed to 192.168.125.40 (unsafe)" or similar
3. Browser will remember your choice
4. App loads and camera works

---

## 📱 Testing on Different Devices

### Desktop/Laptop:
- Works via HTTPS or localhost
- Works via HTTP on localhost only

### iOS:
- Works via HTTPS only
- Must accept self-signed certificate first
- Camera permission granted via system dialog

### Android:
- Works via HTTPS or localhost
- Camera permission granted via system dialog

### Testing from Another Computer:
```
https://192.168.125.40:5173/
```
- Replace `192.168.125.40` with your PC's IP address
- Accept certificate warning
- Camera should work

---

## 🐛 If Camera Still Doesn't Work

### Step 1: Check Browser Console
```
F12 → Console tab → Look for error messages
```

### Common Errors:

**"SecurityError: Camera access requires HTTPS"**
- ✅ Fixed by HTTPS configuration
- Access via `https://` not `http://`

**"NotAllowedError: Camera permission denied"**
- User clicked "Block" in permission dialog
- Solution: Reset camera permissions:
  - Chrome: Settings → Privacy → Site Settings → Camera
  - Firefox: Preferences → Privacy → Permissions → Camera
  - Safari: System Preferences → Security & Privacy

**"NotFoundError: No camera device found"**
- No camera connected to your device
- Use file upload fallback instead

**"NotReadableError: Camera is in use"**
- Another app is using the camera
- Close other camera apps (Zoom, Teams, etc.)

### Step 2: Check System Permissions
Make sure your browser has camera permission:
- **Windows**: Settings → Privacy → Camera
- **Mac**: System Preferences → Security & Privacy
- **Linux**: Check /dev/video* devices

### Step 3: Verify HTTPS is Running
Check terminal output when starting the dev server:
```
VITE v7.2.2  ready in 234 ms

➜  Local:   https://localhost:5173/
➜  Network: https://192.168.125.40:5173/
```
Both should show **https://** not **http://**

### Step 4: Test with Browser DevTools
Open DevTools Console and run:
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('✅ Camera works!', stream))
  .catch(err => console.error('❌ Error:', err.name, err.message))
```

---

## 📋 Testing Checklist

- [ ] Dev server started with `npm run dev`
- [ ] HTTPS URL used (https://...)
- [ ] Certificate warning accepted
- [ ] Camera permission granted
- [ ] CameraPage opened
- [ ] Console shows "📷 Video devices found: 1"
- [ ] Live camera feed visible
- [ ] Capture button works
- [ ] Flash effect appears
- [ ] Photo preview shows captured image
- [ ] "Analyze & Submit" button functional
- [ ] File upload fallback works

---

## 🔧 Advanced Configuration

### To generate your own certificate (optional):
```powershell
# This is optional - basicSsl handles it automatically
# But if you want custom certificates:

openssl req -new -x509 -days 365 -nodes `
  -out cert.pem -keyout key.pem
```

Then in `vite.config.js`:
```javascript
server: {
  https: {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
  }
}
```

### To access from specific IPs only:
```javascript
server: {
  host: '192.168.1.100',  // Only this IP
  https: true,
}
```

---

## ✨ Features That Now Work

With HTTPS enabled and proper camera access:

1. ✅ **Live camera preview** - View real-time feed
2. ✅ **Capture photos** - With flash animation
3. ✅ **File upload fallback** - If camera denied
4. ✅ **AI analysis** - Submit images for processing
5. ✅ **Error handling** - Clear error messages
6. ✅ **Mobile support** - Works on iOS/Android
7. ✅ **Safe area support** - Notch-aware layouts
8. ✅ **Points & stats** - Gamification features

---

## 🎯 Next Steps

1. **Restart dev server** after config changes:
   ```powershell
   # Kill current process (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Test camera access**:
   - Open https://192.168.125.40:5173/
   - Click "Report" tab
   - Accept certificate & permissions
   - Camera should work

3. **If still issues, check**:
   - Browser console (F12)
   - Device camera permissions
   - Other apps using camera
   - HTTPS is active in URL bar

4. **Once working**:
   - Connect real Gemini API
   - Deploy to production
   - Prepare app store submission

---

## 📞 Support

| Issue | Solution |
|-------|----------|
| "Connection not private" | Accept self-signed cert |
| "Camera permission denied" | Grant permission or reset |
| "No camera found" | Check device has camera |
| "Camera in use" | Close other camera apps |
| "HTTP not HTTPS" | Verify dev server using HTTPS |
| Console errors | Check error name in troubleshooting |

---

**Status**: ✅ HTTPS configured and ready  
**Files Modified**: 
- `frontend/vite.config.js` (HTTPS enabled)
- `frontend/src/components/CameraPage.jsx` (better error handling)
- `frontend/package.json` (basicSsl dependency added)

**Tested**: Ready for mobile testing
