# Quick Start: Camera Fix ⚡

## Problem
Camera shows "unavailable" when accessing via `http://192.168.125.40:5173/`

## Root Cause
**Browsers require HTTPS for camera access** on non-localhost addresses. HTTP blocks camera for security.

## Solution Applied
✅ **HTTPS is now enabled** in your dev server

## How to Test

### 1. Restart dev server (if running)
```powershell
cd c:\Users\ryanb\eco-synk\frontend
npm run dev
```

### 2. Access via HTTPS
```
https://192.168.125.40:5173/
```

### 3. Accept certificate (normal for development)
- You'll see "Not Private" warning
- Click "Advanced" → "Proceed to..." 
- This is safe - it's a self-signed dev certificate

### 4. Test camera
- Click "Report" tab
- Approve camera permission
- You should see live camera feed!

## What Changed
- ✅ Added SSL plugin to `vite.config.js`
- ✅ Enabled HTTPS in dev server
- ✅ Better error messages if camera fails
- ✅ Auto-detect video devices on startup

## Alternative (Easier)
Use `http://localhost:5173/` instead
- Camera works on localhost even with HTTP
- No certificate warnings
- Only works on your local machine

## If Still Not Working
1. Open DevTools: `F12`
2. Go to Console tab
3. Check for error messages
4. See full troubleshooting guide: `CAMERA_TROUBLESHOOTING.md`

---

**Status**: ✅ Ready to test
**Next**: Restart server and test with HTTPS URL
