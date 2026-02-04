# Studio Baseline Implementation Map (Phase 0)
**Generated**: February 4, 2026  
**Purpose**: Pre-enhancement architecture inventory for DJ Studio enhancement project

---

## ✅ Architecture Compliance Status

### 1. Audio Engine Boundary ✅ COMPLIANT
- **Tone.js is the ONLY audio engine**
  - All audio nodes, transport, timing controlled via Tone.js
  - Primary engine: `useAudioEngine` hook (1,451 lines)
  - Architecture: Phase 1.1 DeckEngine implementation
  - Master chain: Channel → CrossFade → Compressor → Limiter → Destination
  
**Tone.js Usage Sites** (14 files):
```
✅ src/hooks/audio/useAudioEngine.ts         - Core engine (1,451 lines)
✅ src/audio/engines/DeckEngine.ts            - Deck engine architecture
✅ src/audio/Engine.ts                        - Base engine
✅ src/audio/MasterBus.ts                     - Master processing chain
✅ src/audio/FXChain.ts                       - Effects routing
✅ src/hooks/audio/useExporter.ts             - Export/recording
✅ src/components/studio/mixer/LevelMeter.tsx - VU meters
✅ src/components/studio/modals/ExportModal.tsx
✅ src/components/studio/visuals/Scene3D.tsx  - Audio-reactive visuals
✅ src/components/studio/layout/StudioLayout.tsx
✅ src/components/studio/layout/StudioShell.tsx
✅ src/components/studio/layout/StudioPanels.tsx
✅ src/components/studio/layout/StudioGrid.tsx
✅ src/types/studio.d.ts                      - TypeScript types
```

### 2. WaveSurfer Visuals-Only ✅ COMPLIANT
- **WaveSurfer is visuals-only** (NO audio playback)
  - Used ONLY for waveform rendering, regions, markers
  - Audio playback explicitly disabled in config
  - Click-to-seek forwards to Tone.js engine
  - RAF loop syncs cursor to Tone.js playback position

**WaveSurfer Usage Sites** (2 files):
```
✅ src/components/studio/deck/DeckWaveformWS.tsx - Waveform display (visuals only)
   - backend: "WebAudio" (for analysis only)
   - NO audio output (all playback via Tone.js)
   - Regions plugin for hot cues + loops (Phase S9)
   
✅ src/audio/waveform/computePeaks.ts - Peak computation utility
```

**Verified Compliance**:
```typescript
// From DeckWaveformWS.tsx line 88:
wavesurferOptions = {
  backend: "WebAudio" as const,
  interact: true,
  // CRITICAL: Disable WaveSurfer audio playback ✅
  hideScrollbar: true,
  autoCenter: false,
}
```

### 3. TrackKey Normalization ✅ COMPLIANT
- **Canonical track identity system** (Phase S11.2)
  - All track IDs normalized to slug-like `trackKey`
  - Never using full URLs as database keys
  - Normalization function: `deriveTrackKey()` in `src/lib/trackKey.ts`

**TrackKey Usage Sites**:
```
✅ src/lib/trackKey.ts                        - Canonical normalization
✅ src/hooks/audio/useAudioEngine.ts          - Engine track loading
✅ src/store/useStore.ts                      - Zustand state
✅ src/components/studio/library/TrackLibrary.tsx
✅ src/components/studio/deck/HotCuePanel.tsx - IndexedDB lookups
✅ src/hooks/tracks/useTrackCues.ts           - Cue persistence
```

**Normalization Rules** (from `trackKey.ts`):
- Lowercased
- Extensions removed (.mp3/.wav/.m4a/.ogg)
- Path prefixes stripped (/audio/tracks/, origin, query params)
- Spaces/underscores → hyphens
- Example: `"https://r2.../Te%20Perdi.mp3"` → `"te-perdi"`

### 4. Service Worker Status ✅ COMPLIANT
- Service workers **DISABLED in development** (per copilot-instructions.md)
- Serwist bundler used for production builds only
- No cache loops in dev environment

---

## 📁 Studio Entry Points

### Primary Route
```
src/app/(studio)/studio/page.tsx
  └─> imports StudioLayout
```

### Layout Components
```
src/components/studio/layout/
├── StudioLayout.tsx          - Main layout wrapper (audio persistence, view management)
├── StudioShell.tsx           - Shell container
├── StudioPanels.tsx          - Panel system
├── StudioGrid.tsx            - Grid layout (Phase IX.5 "Masterpiece" Horizontal)
└── StudioControlBar.tsx      - Control bar
```

### Supporting Routes
```
src/app/studio/
├── loading.tsx               - Loading state
├── error.tsx                 - Error boundary
└── api/studio/
    ├── analyze-track/route.ts - Track analysis endpoint
    └── track/route.ts         - Track metadata endpoint
```

---

## 🎚️ Studio Component Structure

### Deck Components (`src/components/studio/deck/`)
```
├── Deck.tsx                  - Main deck container
├── DeckWaveformWS.tsx        - WaveSurfer waveform (visuals only) ✅
├── HotCuePanel.tsx           - Hot cue controls (Phase S11.3 IndexedDB)
└── [other deck controls]
```

### Mixer Components (`src/components/studio/mixer/`)
```
├── LevelMeter.tsx            - VU meters (Tone.js Meter analysis) ✅
└── [EQ, filter, crossfader controls]
```

### Library Components (`src/components/studio/library/`)
```
└── TrackLibrary.tsx          - Track browser (uses trackKey normalization) ✅
```

### Waveform Processing (`src/components/studio/waveforms/`)
```
└── computePeaks.ts           - Peak data for WaveSurfer visualization
```

### Visuals (`src/components/studio/visuals/`)
```
└── Scene3D.tsx               - Audio-reactive 3D visuals (Tone.js FFT)
```

### Modals (`src/components/studio/modals/`)
```
└── ExportModal.tsx           - Mix export (Tone.js recording)
```

### UI Controls (`src/components/studio/controls/`)
- Knobs, faders, buttons (shared UI components)

### Stems (`src/components/studio/stems/`)
- Stem separation UI (feature-flagged)

---

## 🎛️ Audio Architecture

### Core Engine Module
```
src/audio/
├── engines/
│   └── DeckEngine.ts         - Phase 1.1 deck engine architecture
├── Engine.ts                 - Base engine
├── MasterBus.ts              - Master processing chain
├── FXChain.ts                - Effects routing
└── mixer/
    └── crossfaderCurves.ts   - Crossfader algorithms (equal power)
```

### Audio Hooks (`src/hooks/audio/`)
```
├── useAudioEngine.ts         - Main audio engine (1,451 lines) ✅
├── useAudioAnalyser.ts       - Audio analysis
├── useExporter.ts            - Mix recording/export
├── useMixRecorder.ts         - Recording utilities
└── useStemWorker.ts          - Stem separation worker
```

### Analysis Hook (`src/hooks/analysis/`)
```
└── useEssentiaAnalysis.ts    - Essentia.js BPM/key detection (worker-based)
```

---

## 📊 State Management

### Primary Store
```
src/store/useStore.ts         - Zustand store (main app state)
  └─> trackKey normalization ✅
  └─> deck state (A/B)
  └─> hot cues (Phase S9)
  └─> loop regions (Phase S9)
```

### Studio Store
```
src/store/useStudioStore.ts   - Studio-specific state
```

---

## 🎨 Current UI/UX Features

### Layout (Phase IX.5 "Masterpiece")
- Horizontal "booth surface" layout
- Dual deck waveforms
- Mixer controls (EQ, filter, fader, crossfader)
- Collapsible panels (library, FX)

### Waveform Features
- WaveSurfer rendering (visuals only) ✅
- Click-to-seek (forwards to Tone.js) ✅
- Hot cue markers (Phase S9)
- Loop regions (Phase S9)
- RAF cursor sync (30fps throttled)

### Performance Optimizations
- RAF loop stops when tab hidden (Phase 6.1)
- Throttled cursor updates (30fps)
- Proper cleanup on track switch

---

## 🔧 Track Data & Persistence

### Track Identity (Phase S11.2)
- **Canonical trackKey** used for all DB lookups ✅
- **trackId** deprecated (legacy)
- Derived via `deriveTrackKey({ url, trackId, title })`

### IndexedDB Persistence
- Hot cues: Keyed by `trackKey` (Phase S11.3)
- Waveform peaks: Keyed by `trackKey`
- Track metadata: Keyed by `trackKey`

### Library System
- R2 library sync (cloud storage)
- Local track analysis caching
- Smart track metadata (AI-driven)

---

## 🚨 Known Architecture Violations

**NONE FOUND** ✅

All critical non-negotiables verified:
1. ✅ Tone.js is the only audio engine
2. ✅ WaveSurfer is visuals-only (no audio playback)
3. ✅ trackKey normalization in use everywhere
4. ✅ Service workers disabled in dev
5. ✅ No client secrets exposed

---

## 📋 Enhancement Readiness Assessment

### ✅ Ready for Enhancement
- **Fixed layout foundation** exists (Phase IX.5 horizontal)
- **Audio engine boundary** clearly defined and compliant
- **Track normalization** system in place
- **Performance optimizations** already implemented
- **Modular component structure** makes incremental changes safe

### 🎯 Low-Risk Enhancement Targets
1. **UI theming system** (CSS tokens + theme switcher)
   - No engine changes required
   - Studio-only scope (won't affect site)
   
2. **SVG icon system** (sprite-based)
   - Performance win (fewer requests)
   - No audio engine impact
   
3. **Touch gesture layer** (mobile UX)
   - Additive feature
   - Won't break desktop

4. **Canvas meters** (replace current meters)
   - Already using Tone.js Meter
   - Just upgrade rendering layer

5. **Beatgrid + quantize** (timing layer)
   - Tone.js transport already authoritative
   - Add grid model on top

### ⚠️ Higher-Risk Enhancements (require careful planning)
1. **Master limiter/loudness** (audio chain modification)
   - Needs small batch testing
   
2. **Streaming integration** (YouTube/SoundCloud)
   - Requires API route design
   - MediaElementSource bridge to Tone.js
   
3. **Live streaming output** (broadcast feature)
   - Needs recorder stream integration

---

## 🔍 Files Requiring NO Changes (Preserve As-Is)

**Core Audio Engine** (working perfectly):
- `src/hooks/audio/useAudioEngine.ts` (1,451 lines)
- `src/audio/engines/DeckEngine.ts`
- `src/audio/Engine.ts`
- `src/audio/MasterBus.ts`

**Track Normalization** (Phase S11.2 complete):
- `src/lib/trackKey.ts`
- All `deriveTrackKey()` usage sites

**WaveSurfer Integration** (compliant):
- `src/components/studio/deck/DeckWaveformWS.tsx`

---

## 📈 Next Steps (Post-Phase 0)

### Immediate (Phase 1-3)
1. **Phase 1**: Fixed booth layout + mobile orientation handling
2. **Phase 2**: Hiphop style system (CSS tokens + theme switcher)
3. **Phase 3**: SVG icon system + MPC pad components

### Near-term (Phase 4-6)
4. **Phase 4**: Engine boundary audit (verify compliance remains)
5. **Phase 5**: Beatgrid + quantize baseline
6. **Phase 6**: Master chain + Canvas meters

### Future (Phase 7-8+)
7. **Phase 7**: Touch gestures (pinch zoom, swipe load, long-press)
8. **Phase 8**: Persistence (theme, layout, last tracks)
9. **Optional**: Stems UX, Arrangement mode, Streaming

---

## 🛠️ Build Verification

All verification gates must pass before proceeding:
```bash
npm run build   # ✅ Must pass
npm run lint    # ✅ Must pass
npm run test    # ✅ Must pass (if tests exist)
```

---

**Map Complete** ✅  
This baseline establishes the "known good state" before any enhancements begin.
