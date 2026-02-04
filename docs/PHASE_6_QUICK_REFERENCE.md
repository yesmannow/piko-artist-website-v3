# Phase 6 Quick Reference: WaveSurfer Integration

**ONE-LINER:** Replace Row 1 waveforms with WaveSurfer (visuals only, Tone remains engine).

---

## 🔑 Key Points

**What Changed:**
- Desktop Row 1 waveforms → `DeckWaveformWS` (WaveSurfer-based)
- Mobile layouts → Still use old `DeckWaveform` (unchanged)

**Critical Rules:**
1. WaveSurfer renders visuals ONLY (no audio playback)
2. Tone.js handles ALL audio playback
3. Click-to-seek → forwards to `seekTo(deckId, seconds)`
4. RAF loop syncs cursor → `wavesurfer.seekTo(progress)`

---

## 📂 Files Changed

| File | Change | Type |
|------|--------|------|
| `src/components/studio/ui/DeckWaveformWS.tsx` | New component | NEW |
| `src/components/studio/layout/StudioGrid.tsx` | Row 1 uses DeckWaveformWS | MODIFIED |
| `src/components/studio/ui/DeckWaveform.tsx` | Marked @deprecated | DEPRECATED |

---

## 🧩 Component Usage

### DeckWaveformWS (New)

```tsx
import { DeckWaveformWS } from "@/components/studio/ui/DeckWaveformWS";

<DeckWaveformWS deckId="A" />  // Desktop Row 1
<DeckWaveformWS deckId="B" />  // Desktop Row 1
```

**Props:**
- `deckId: "A" | "B"` — Which deck to render

**Data Sources:**
- `useStore` → Track URL/title (`deckA.trackData`, `deckB.trackData`)
- `useAudioEngine` → Playback position, duration, seek function

**WaveSurfer Config:**
- Height: 80px
- Bar style: 2px wide, 1px gap, 2px radius
- Colors: Cyan (#4af2c5) for A, Purple (#7c8dff) for B
- Interact: true (click-to-seek enabled)
- Audio playback: DISABLED

---

## 🔄 Data Flow

```
User Click:
  Waveform click
    ↓
  wavesurfer "interaction" event
    ↓
  handleSeek(progress)
    ↓
  seekTo(deckId, seconds)
    ↓
  Tone.Player.seek()

Cursor Sync (RAF):
  Every frame
    ↓
  getPlaybackPosition(deckId)
    ↓
  wavesurfer.seekTo(progress)
    ↓
  Cursor moves (no audio)
```

---

## ✅ Verification Tests

### Test 1: Waveform Renders
1. Load track → Waveform appears in Row 1
2. Check color → Cyan (A) / Purple (B)

### Test 2: Click-to-Seek
1. Click waveform middle → Playback jumps
2. Listen → Only ONE audio stream (no echo)

### Test 3: Cursor Sync
1. Press play → Cursor moves smoothly
2. Pause → Cursor stops at correct position

### Test 4: No Audio Duplication
1. Open DevTools Console
2. No "duplicate AudioContext" errors
3. No echo/phase artifacts

### Test 5: Mobile Unchanged
1. Resize to <768px
2. Mobile layouts still work (old component)

---

## 🐛 Known Issues

| Issue | Status | Impact |
|-------|--------|--------|
| Mobile uses old DeckWaveform | By design | Phase 6 scope limited to Row 1 |
| Lint warnings (Tailwind v4 sugar) | Non-blocking | Build succeeds |
| Large files (>10MB) slow to load | Expected | WaveSurfer decodes full buffer |

---

## 🚀 Future Enhancements (Phase 7)

- [ ] Migrate mobile layouts to DeckWaveformWS
- [ ] Add WaveSurfer regions (cue points)
- [ ] Add zoom/scroll interaction
- [ ] Pre-generate waveform peaks server-side

---

## 📦 Dependencies

```json
{
  "wavesurfer.js": "^7.12.1",      // Already present
  "@wavesurfer/react": "^1.x.x"    // New (Phase 6)
}
```

**Install:**
```bash
npm install @wavesurfer/react
```

---

## 🔗 Related Docs

- [PHASE_6_WAVESURFER_ROW1.md](./PHASE_6_WAVESURFER_ROW1.md) — Full implementation details
- [AUDIO_ENGINE_README.md](../AUDIO_ENGINE_README.md) — Tone.js architecture
- [PHASE_5_MOBILE_STUDIO_COMPLETE.md](./PHASE_5_MOBILE_STUDIO_COMPLETE.md) — Mobile layout context

---

## 💡 Quick Debug Commands

```bash
# Build verification
npm run build

# Check for duplicate AudioContext
# Open /studio in browser, check DevTools Console for warnings

# Verify waveform rendering
# 1. Load track into Deck A
# 2. Check Row 1 for cyan waveform
# 3. Click middle → playback should jump

# Check bundle size
# Look for "Route (app) /studio" in build output
# Should be ~337 kB (WaveSurfer lazy-loaded)
```

---

**Status:** ✅ COMPLETE
**Build:** ✅ Successful (44s, zero errors)
**Next:** Manual testing (6 verification tests)
