# PREFLIGHT HARDENING — Testing Checklist

## Quick Verification (5 minutes)

### ✅ Build Status
```bash
npm run build
```
**Expected**: ✓ Compiled successfully

### ✅ Studio Audit
```bash
npm run audit:studio
```
**Expected**: 0 errors, warnings only (34 warnings is normal)

---

## Manual Testing Checklist

### 1. API Endpoints Test
**Time**: 2 minutes

```bash
# Start dev server
npm run dev

# Test canonical endpoint
curl http://localhost:3000/api/tracks
# Expected: 200 OK, JSON array of tracks

# Test single track
curl "http://localhost:3000/api/tracks?trackId=te-perdi"
# Expected: 200 OK, single track object

# Test deprecated endpoints
curl http://localhost:3000/api/get-track
# Expected: 410 Gone, migration message

curl http://localhost:3000/api/studio/track
# Expected: 410 Gone, migration message
```

**Pass Criteria**:
- [ ] `/api/tracks` returns track list
- [ ] `/api/tracks?trackId=te-perdi` returns single track
- [ ] `/api/get-track` returns 410
- [ ] `/api/studio/track` returns 410

---

### 2. Service Worker Kill Switch
**Time**: 3 minutes

**Test A: Default (SW Disabled)**
```bash
# Ensure no SW env var
# Remove from .env.local if exists: NEXT_PUBLIC_ENABLE_SW

npm run build
npm start
```

1. Open http://localhost:3000/studio
2. Open DevTools > Application > Service Workers
3. **Expected**: "No service workers are registered"

**Test B: SW Enabled**
```bash
# Add to .env.local
echo "NEXT_PUBLIC_ENABLE_SW=true" >> .env.local

npm run build
npm start
```

1. Open http://localhost:3000/studio
2. Open DevTools > Application > Service Workers
3. **Expected**: Service worker "/sw.js" registered

**Pass Criteria**:
- [ ] SW not registered by default
- [ ] SW registers when `NEXT_PUBLIC_ENABLE_SW=true`

---

### 3. Reset App Button
**Time**: 2 minutes

```bash
npm run dev
```

1. Open http://localhost:3000/studio
2. Click **Settings** icon (⚙️ gear icon in top bar)
3. Scroll to bottom of settings panel
4. Find "Reset App" row
5. Click **Reset** button
6. Confirm dialog
7. **Expected**: Page reloads, console shows SW unregistered + caches cleared

**Pass Criteria**:
- [ ] Reset App button visible in settings
- [ ] Clicking triggers confirmation dialog
- [ ] Confirming reloads the page
- [ ] DevTools shows service workers unregistered
- [ ] DevTools shows caches cleared

---

### 4. Lazy Loading Verification
**Time**: 5 minutes

```bash
npm run dev
```

**Test A: Scene3D Lazy Loading**
1. Open http://localhost:3000/studio
2. Open DevTools > Network > JS filter
3. Clear network log
4. **Check**: Scene3D.tsx should NOT be loaded yet
5. Click Settings > Enable "3D visuals"
6. **Check**: Scene3D.tsx chunk loads NOW
7. **Expected**: 3D background renders

**Test B: Stem Components Lazy Loading**
1. Refresh page, clear network log
2. **Check**: StemWaveforms.tsx, StemGenerator.tsx NOT loaded
3. Enable "Stem Mode" (button in deck or control bar)
4. **Check**: Stem component chunks load NOW
5. **Expected**: Stem controls appear

**Pass Criteria**:
- [ ] Scene3D loads only when 3D enabled
- [ ] Stem components load only when stem mode enabled
- [ ] No unnecessary JS loaded on initial render

---

### 5. CI Pipeline Test (GitHub Actions)
**Time**: Varies (automated)

If you have push access:
```bash
git add .
git commit -m "chore: preflight hardening complete"
git push origin main
```

1. Go to GitHub Actions tab
2. Watch CI workflow run
3. **Expected**: All steps pass
   - ✓ TypeScript check
   - ✓ Lint
   - ✓ Studio Audit (NEW)
   - ✓ Build
   - ✓ E2E tests

**Pass Criteria**:
- [ ] CI workflow completes successfully
- [ ] Studio audit step runs (even if warnings present)

---

## Regression Testing

### Studio Functionality (Core Features)
**Time**: 5 minutes

1. Open http://localhost:3000/studio
2. **Load Track**: Drag a track from library to Deck A
   - [ ] Track loads and plays
   - [ ] Waveform renders
3. **Load Track to Deck B**: Drag different track
   - [ ] Both decks play simultaneously
4. **Crossfader**: Move crossfader left/right
   - [ ] Audio balance changes
5. **Enable 3D**: Settings > 3D visuals
   - [ ] 3D scene renders
6. **Enable Stem Mode**: Click stem mode button
   - [ ] Stem controls appear
   - [ ] Generate stems works (may take time)
7. **Settings Panel**: Open/close settings
   - [ ] All controls work
   - [ ] Reset App button present

**Pass Criteria**: All core features work as before

---

## Performance Check (Optional)

### Bundle Size
```bash
npm run build
```

Check route table output:
```
Route (app)                              Size  First Load JS
├ ○ /studio                              167 kB         326 kB
```

**Target**: /studio First Load JS ≤ 350 kB

**Pass Criteria**:
- [ ] /studio bundle size reasonable (~326 kB or less)

### Lighthouse (Optional)
```bash
npm run build
npm start
```

1. Open http://localhost:3000/studio
2. DevTools > Lighthouse
3. Run test (Performance)
4. **Target**: Performance score ≥ 60 (studio is JS-heavy, so lower is expected)

---

## Final Checklist

### Code Quality
- [ ] `npm run build` passes
- [ ] `npm run audit:studio` shows 0 errors
- [ ] No console errors in browser
- [ ] No TypeScript errors

### Functionality
- [ ] All API endpoints work correctly
- [ ] Service Worker kill switch works
- [ ] Reset App button works
- [ ] Lazy loading verified
- [ ] Studio core features work

### Documentation
- [ ] `PREFLIGHT_HARDENING_COMPLETE.md` exists
- [ ] Changes documented
- [ ] Rollback plan documented

---

## Issues Found During Testing

**Record any issues here**:

| Issue | Severity | Steps to Reproduce | Fix Status |
|-------|----------|-------------------|------------|
| (none yet) | - | - | - |

---

## Sign-Off

**Tested By**: ___________________
**Date**: ___________________
**Build Version**: ___________________
**Status**: ☐ PASS  ☐ FAIL

**Notes**:
