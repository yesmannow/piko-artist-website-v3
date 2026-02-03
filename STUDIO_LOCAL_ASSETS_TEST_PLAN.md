# Studio Local Assets Migration - Test Checklist

## ✅ Build Verification
- [x] `npm run build` passes
- [x] TypeScript compilation successful
- [x] No webpack errors
- [x] Studio bundle size: 403 kB

## 🧪 Local Testing Required

### 1. Static Asset URLs (Direct Browser Access)
Test these URLs in your browser after running `npm run start`:

```
http://localhost:3000/audio/tracks/te-perdi.mp3
http://localhost:3000/audio/tracks/amor-sincero.mp3
http://localhost:3000/images/tracks/vinyl-1595847_1280.jpg
http://localhost:3000/images/tracks/dj-2581269_1280.jpg
```

**Expected**: All assets load successfully (audio plays, images display)

### 2. Track API Endpoint
Test in browser or curl:

```bash
# List all tracks
curl http://localhost:3000/api/tracks

# Get single track
curl "http://localhost:3000/api/tracks?trackId=te-perdi"
```

**Expected Response (list)**:
```json
{
  "tracks": [
    {
      "id": "te-perdi",
      "title": "Te Perdi",
      "url": "/audio/tracks/te-perdi.mp3",
      "artworkUrl": "/images/tracks/..."
    },
    ...
  ],
  "count": 26
}
```

**Expected Response (single)**:
```json
{
  "track": {
    "id": "te-perdi",
    "title": "Te Perdi",
    "url": "/audio/tracks/te-perdi.mp3",
    "artworkUrl": "/images/tracks/..."
  }
}
```

### 3. Deprecated Endpoints Return 410
```bash
curl -i "http://localhost:3000/api/get-track?key=te-perdi"
curl -i "http://localhost:3000/api/studio/track?trackId=te-perdi"
```

**Expected**: 410 Gone status with migration message

### 4. Studio Page Load
1. Navigate to `http://localhost:3000/studio`
2. Check browser console for errors
3. Verify:
   - ✅ Studio loads without fatal errors
   - ✅ No `ws://localhost:8080` WebSocket spam
   - ✅ ProLink badge shows "Hardware disabled" (unless NEXT_PUBLIC_ENABLE_PROLINK=true)
   - ✅ Track library panel opens

### 5. TrackLibrary Functionality
1. Open Track Library in Studio
2. Verify:
   - ✅ Shows 26 tracks
   - ✅ All tracks have titles (humanized from filenames)
   - ✅ All tracks have artwork thumbnails
   - ✅ Click a track to select it
3. Load track to Deck A
4. Verify:
   - ✅ Audio loads from `/audio/tracks/*.mp3`
   - ✅ JogWheel displays artwork
   - ✅ Track plays successfully
   - ✅ Waveform renders

### 6. Deterministic Artwork Assignment
Run this test 3 times (reload page each time):

1. Load "Te Perdi" track
2. Note the artwork image shown
3. Reload `/studio` completely
4. Load "Te Perdi" again
5. Verify: ✅ **Same artwork appears every time** (deterministic hash)

### 7. Console Error Check
Open browser DevTools → Console:

**Should NOT see**:
- ❌ `WebSocket connection to 'ws://localhost:8080' failed`
- ❌ `R2_ACCESS_KEY_ID not configured`
- ❌ `Failed to fetch tracks from R2`
- ❌ Any CORS errors
- ❌ 404s for `/api/get-track` or `/api/studio/track`

**Acceptable warnings**:
- ⚠️ Next.js config warning about `serverComponentsExternalPackages`
- ⚠️ Audio context autoplay policy warnings

### 8. Error Boundaries
Test Studio error handling:

1. Temporarily break something (e.g., edit `src/app/studio/page.tsx` to throw error)
2. Navigate to `/studio`
3. Verify: ✅ Custom error page shows with "Try again" button
4. Click "Try again"
5. Verify: ✅ Error boundary resets

### 9. Loading State
1. Throttle network in DevTools (Slow 3G)
2. Navigate to `/studio`
3. Verify: ✅ "Loading Studio..." spinner shows
4. Wait for load
5. Verify: ✅ Transitions to full studio UI

## 🚀 Production Deployment Checklist

Before deploying to Vercel/production:

- [ ] All 26 MP3 files exist in `public/audio/tracks/`
- [ ] All 20 artwork images exist in `public/images/tracks/`
- [ ] `.env.local` does NOT have `NEXT_PUBLIC_ENABLE_PROLINK=true` (unless you want it)
- [ ] Build passes: `npm run build`
- [ ] No errors in `npm run start` console
- [ ] Test `/studio` in incognito/private window
- [ ] Test on mobile device (responsive layout)

## 🔄 Rollback Plan

To re-enable R2/ProLink later:

### Re-enable R2 Cloud Storage
1. Add environment variables:
   ```env
   R2_ACCESS_KEY_ID=your_key
   R2_SECRET_ACCESS_KEY=your_secret
   R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
   R2_BUCKET_NAME=your-bucket
   NEXT_PUBLIC_R2_PUBLIC_URL=https://your-bucket.r2.dev
   ```

2. Update `src/app/api/tracks/route.ts`:
   - Keep local manifest as fallback
   - Add R2 fetching logic back
   - Merge local + R2 tracks

3. Update `src/hooks/useLibrarySync.ts`:
   - Parse R2 response format
   - Sync R2 tracks to IndexedDB

### Re-enable ProLink Hardware
1. Add environment variable:
   ```env
   NEXT_PUBLIC_ENABLE_PROLINK=true
   ```

2. (Optional) Make WebSocket URL configurable:
   ```env
   NEXT_PUBLIC_PROLINK_WS_URL=ws://localhost:8080
   ```

3. Update `src/components/studio/layout/StudioHeader.tsx`:
   - Use `NEXT_PUBLIC_PROLINK_WS_URL` instead of hardcoded URL

## 📊 Performance Metrics

Track these in production:

- Studio bundle size: 403 kB (current)
- First Load JS: 563 kB (current)
- Time to Interactive (TTI): Should be < 3s on 4G
- No WebSocket errors in error tracking (Sentry/etc)
- Track library loads 26 tracks instantly (IndexedDB cached)

## 🐛 Known Issues / Future Improvements

1. **Missing BPM/Key data**: Local tracks don't have BPM/key metadata yet
   - Solution: Run AI analysis on first load (Phase IX already implemented)

2. **No artist metadata**: All tracks show "Unknown Artist"
   - Solution: Add artist field to `studioTrackManifest.ts` or parse from filenames

3. **Fixed track list**: New tracks require code changes
   - Solution: Create admin panel to upload tracks + auto-update manifest

4. **No search/filter by artist**: TrackLibrary only has genre/mood/BPM filters
   - Solution: Add artist filter once artist metadata exists
