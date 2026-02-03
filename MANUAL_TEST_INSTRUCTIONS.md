# 🧪 Manual Testing Instructions - Studio Local Assets

## ❗ ROOT CAUSE OF YOUR ERRORS

The errors you're seeing are from a **STALE PRODUCTION BUILD** (`_next/static/chunks/*.js` files), NOT the development server!

### What Happened:
1. You ran `npm run build` which created a production build in `.next/`
2. You opened the browser which loaded those production chunks
3. The production build has issues (missing WASM, chunk loading failures)
4. Your browser CACHED those broken chunks

### The Fix:
You need to **completely clear the stale build and cache**.

---

## 🔧 Step 1: Clean Everything

Run these commands in PowerShell:

```powershell
# Stop the dev server (Ctrl+C in the terminal running it)

# Delete the production build
Remove-Item -Recurse -Force .next

# Clear npm cache (optional but recommended)
npm cache clean --force
```

---

## 🚀 Step 2: Start Fresh Dev Server

```powershell
# Start the development server
npm run dev
```

Wait for:
```
✓ Ready in X.Xs
- Local:        http://localhost:3000
```

---

## 🧹 Step 3: Hard Refresh Browser

1. Open your browser
2. Navigate to `http://localhost:3000/studio`
3. **HARD REFRESH** to bypass cache:
   - **Chrome/Edge**: Ctrl + Shift + R (or Ctrl + F5)
   - **Firefox**: Ctrl + Shift + R
   - **Safari**: Cmd + Shift + R

4. **Open DevTools** (F12) and go to Network tab
5. Check "Disable cache" checkbox
6. Refresh again (Ctrl + R)

---

## ✅ Step 4: Run the Test Plan

Once the page loads cleanly, run these tests from `STUDIO_LOCAL_ASSETS_TEST_PLAN.md`:

### Test 1: Direct Asset Access
Open these URLs in new tabs:
- http://localhost:3000/audio/tracks/te-perdi.mp3 (should download/play)
- http://localhost:3000/images/tracks/vinyl-glow-cyan.jpg (should show image)

### Test 2: API Endpoints
Open these in new tabs or use curl:
- http://localhost:3000/api/tracks (should return JSON array of 26 tracks)
- http://localhost:3000/api/tracks?trackId=te-perdi (should return single track)

### Test 3: Studio UI
1. Navigate to http://localhost:3000/studio
2. Check console (F12) - **should have ZERO errors about:**
   - ❌ "CHUNK_LOAD_FAIL"
   - ❌ "e is not a function"
   - ❌ "Failed to fetch"
   - ❌ "WebSocket" errors (unless you have ProLink hardware)

3. Click on a deck to load a track
4. Verify:
   - Track loads in library modal
   - Track plays when you click play
   - JogWheel shows artwork (deterministic from hash)
   - Waveform renders (may take a moment)

---

## 🐛 Expected Issues (Not Related to Migration)

These are **PRE-EXISTING** issues from the audit, NOT caused by the local assets migration:

### AudioContext Errors (Pre-existing)
```
The AudioContext encountered an error from the audio device or the WebAudio renderer.
```
**Cause**: Pre-existing issue with ref access during render (see audit report line 142-148)
**Impact**: Minimal - audio still works
**Fix**: Optional - listed in STUDIO_LOCAL_ASSETS_AUDIT_REPORT.md Priority 2

### Essentia Worker Errors (Expected in Dev)
```
[useEssentiaAnalysis] Worker error
```
**Cause**: Essentia.js WASM initialization (complex setup)
**Impact**: Track analysis features may not work in dev
**Fix**: Not critical for local MP3 testing

---

## ✅ Success Criteria

The migration is successful if:

1. ✅ **Zero "CHUNK_LOAD_FAIL" errors** in console
2. ✅ **Zero "Failed to fetch" errors** for MP3 files
3. ✅ **Studio page loads** without errors
4. ✅ **Tracks load from /api/tracks** (check Network tab)
5. ✅ **MP3 files play** when you click play button
6. ✅ **Artwork displays** on JogWheel (deterministic, same track = same image)
7. ✅ **Zero WebSocket errors** (unless ProLink hardware connected)

---

## 🆘 If You Still See Errors

### Browser Still Showing Chunk Errors?
1. Try Incognito/Private mode
2. Completely close browser (all windows)
3. Reopen and go to http://localhost:3000/studio

### Dev Server Not Starting?
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Restart dev server
npm run dev
```

### Port 3000 Already in Use?
```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Get-Process -Id <PID> | Stop-Process -Force

# Or use a different port
npm run dev -- -p 3001
```

---

## 📊 Quick Verification Commands

Run these in a **separate PowerShell window** (not the one running dev server):

```powershell
# Test MP3 access (should return 200)
(Invoke-WebRequest -Uri "http://localhost:3000/audio/tracks/te-perdi.mp3" -Method Head).StatusCode

# Test API endpoint (should return JSON)
(Invoke-WebRequest -Uri "http://localhost:3000/api/tracks").Content | ConvertFrom-Json | Select-Object -First 3

# Test single track endpoint
(Invoke-WebRequest -Uri "http://localhost:3000/api/tracks?trackId=te-perdi").Content | ConvertFrom-Json
```

Expected outputs:
- First command: `200`
- Second command: Array of track objects with id, title, url, artworkUrl
- Third command: Single track object for "Te Perdi"

---

## 🎯 Next Steps After Testing

Once you confirm the tests pass:

1. ✅ Mark migration as **COMPLETE**
2. 📝 Document any new issues in a separate report
3. 🚀 Proceed with production deployment (`npm run build` then `vercel deploy --prod`)
4. 🔄 Optional: Create follow-up PR for 28 pre-existing ESLint errors

---

**Last Updated**: February 3, 2026
**Dev Server**: http://localhost:3000
**Network Access**: http://192.168.0.201:3000 (from other devices on your network)
