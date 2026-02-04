# Phase S5 — Smoke Test Checklist

**Created:** February 4, 2026
**Purpose:** Validate core functionality remains intact after refactors before removing backup files

---

## ✅ Deck A/B Core Functionality

### Load Track
- [ ] Deck A: Load track from library
- [ ] Deck B: Load track from library
- [ ] Verify waveform displays correctly
- [ ] Verify track metadata (title, artist, duration)

### Playback Controls
- [ ] Deck A: Play/Pause toggle
- [ ] Deck B: Play/Pause toggle
- [ ] Verify audio output on both decks
- [ ] Cross-deck sync (BPM lock)

### Seek & Navigation
- [ ] Deck A: Seek via jogwheel/slider
- [ ] Deck B: Seek via jogwheel/slider
- [ ] Skip forward/backward buttons
- [ ] Verify playhead follows correctly

### Stems & Effects
- [ ] Generate stems (vocals, drums, bass, other)
- [ ] Toggle individual stems on/off
- [ ] Apply FX on Deck A (filter, reverb, delay)
- [ ] Apply FX on Deck B
- [ ] Verify FX controls respond correctly

---

## ✅ WaveSurfer Desktop UI (Row 1)

### Click-to-Seek
- [ ] Click anywhere on waveform → playhead jumps
- [ ] Verify audio playback matches clicked position
- [ ] Verify cursor/playhead sync during playback

### Cursor Synchronization
- [ ] Playhead moves smoothly during playback
- [ ] Seeking updates cursor position immediately
- [ ] No lag or desync between visual and audio

---

## ✅ Send Email Route

### Local Testing
- [ ] POST request to `/api/send-email` with valid payload
- [ ] Verify response (success or expected error)
- [ ] Check console for no unhandled errors

### Unit Tests (Already Covered)
- [ ] Run `npm test` or `vitest`
- [ ] Verify validation tests pass (name, email, message required)
- [ ] Verify rate limiting tests pass (per-IP throttling)

---

## ✅ Build & Type Safety

### Build Pass
- [ ] Run `npm run build`
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build completes successfully

### Development Mode
- [ ] Run `npm run dev`
- [ ] Hot reload works
- [ ] No console errors on page load

---

## 🗑️ Cleanup Targets (After Verification)

Once all tests pass:

1. **Temporary Backups** (move to `/archive/` or delete):
   - `src/components/studio/ui/Deck.backup.tsx`
   - `src/app/api/send-email/route.old.ts`

2. **Confirmed Unused Legacy Components** (delete):
   - `src/components/studio/core/FXRack.tsx`
   - `src/components/studio/ui/FXRackSheet.tsx`

3. **Git History Note:**
   - All deleted files remain accessible via git history
   - No need to keep "backup files" in active codebase

---

## Final Check

- [ ] All smoke tests pass
- [ ] Backup files removed/archived
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] No new TypeScript/ESLint errors
- [ ] Git commit with clear message

---

**Status:** Ready for cleanup after verification ✅
