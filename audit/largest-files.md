# Largest Files Report
**Generated**: February 4, 2026  
**Agent**: RepoAuditor  
**Scope**: All source files in `src/` and `public/`

---

## Executive Summary

- **Total files scanned**: 215 source files + 100+ assets
- **Largest source file**: `useAudioEngine.ts` (50.65 KB)
- **Largest asset**: Stem audio files (10+ MB each)
- **Files >20KB**: 7 source files
- **Total stem audio**: ~82 MB (8 stems × ~10 MB each)
- **Total track audio**: ~120 MB (30+ tracks × 4 MB average)
- **3D model size**: 7.07 MB (`music-2252.glb`)

---

## Source Files (Top 50)

### 🔴 Critical Size Files (>40 KB)

| Size | File | Purpose | Review Priority |
|------|------|---------|-----------------|
| 50.65 KB | `src/hooks/audio/useAudioEngine.ts` | Main audio engine hook | 🔴 HIGH - Consider splitting |
| 44.50 KB | `src/app/(site)/contact/page.tsx` | Contact form page | 🔴 HIGH - Extract components |

### 🟡 Large Files (20-40 KB)

| Size | File | Purpose | Review Priority |
|------|------|---------|-----------------|
| 29.32 KB | `src/components/ImmersivePlayerOverlay.tsx` | Overlay player UI | 🟡 MEDIUM - Split UI sections |
| 24.73 KB | `src/app/(site)/music/page.tsx` | Music catalog page | 🟡 MEDIUM - Extract filters/cards |
| 22.61 KB | `src/components/layout/MobileNav.tsx` | Mobile navigation | 🟡 MEDIUM - Extract menu items |
| 21.59 KB | `src/components/studio/library/TrackLibrary.tsx` | Track library grid | 🟡 MEDIUM - Split search/grid |
| 21.46 KB | `src/components/layout/Navbar.tsx` | Desktop navigation | 🟡 MEDIUM - Modularize sections |

### ✅ Acceptable Size (10-20 KB)

| Size | File | Purpose |
|------|------|---------|
| 19.96 KB | `src/components/TrackList.tsx` | Track listing component |
| 18.35 KB | `src/audio/engines/DeckEngine.ts` | Deck audio engine |
| 17.13 KB | `src/components/studio/deck/DeckGrid.tsx` | Deck grid layout |
| 16.28 KB | `src/components/studio/deck/Deck.tsx` | Main deck component |
| 15.00 KB | `src/components/studio/waveforms/WaveformMini.tsx` | Mini waveform display |
| 14.02 KB | `src/lib/audio-engine.ts` | Legacy audio engine |
| 13.67 KB | `src/store/useStore.ts` | Zustand global store |
| 13.23 KB | `src/lib/audio/beatDetection.ts` | Beat detection engine |
| 13.05 KB | `src/components/studio/deck/JogWheel.tsx` | Jogwheel control |
| 12.35 KB | `src/context/AudioContext.tsx` | Audio context provider |
| 12.03 KB | `src/components/studio/mixer/SyncControl.tsx` | Sync control UI |
| 11.32 KB | `src/lib/audio/quantize.ts` | Quantize engine |
| 11.31 KB | `src/components/studio/library/TrackListing.tsx` | Track list item |
| 11.26 KB | `src/components/studio/layout/StudioGrid.tsx` | Studio grid layout |
| 10.75 KB | `src/components/studio/stems/StemPerformancePads.tsx` | Stem pads UI |
| 10.34 KB | `src/features/insights/matchScoring.ts` | Track matching logic |
| 10.26 KB | `src/components/studio/modals/StudioSettingsPanel.tsx` | Settings modal |
| 10.21 KB | `src/hooks/tracks/useSmartTrackAnalysis.ts` | Smart analysis hook |
| 10.13 KB | `src/lib/deck-fx-chain.ts` | Deck FX chain |

### Remaining Files (6-10 KB)

See full output for complete listing. All files below 10 KB are within acceptable bounds.

---

## Public Assets

### 🔴 Large Audio Files (Stems)

**Jardin de Rosas Stems** (4 files × 10.07 MB = 40.28 MB):
- `public/audio/stems/jardin/jardin-de-rosas-drums-B minor-118bpm-440hz.mp3` (10.07 MB)
- `public/audio/stems/jardin/jardin-de-rosas-other-B minor-118bpm-440hz.mp3` (10.07 MB)
- `public/audio/stems/jardin/jardin-de-rosas-bass-B minor-118bpm-440hz.mp3` (10.07 MB)
- `public/audio/stems/jardin/jardin-de-rosas-vocals-B minor-118bpm-440hz.mp3` (10.07 MB)

**Amor Sincero Stems** (4 files × 8.73 MB = 34.92 MB):
- `public/audio/stems/amor/amor-sincero-vocals-E minor-110bpm-440hz.mp3` (8.73 MB)
- `public/audio/stems/amor/amor-sincero-other-E minor-110bpm-440hz.mp3` (8.73 MB)
- `public/audio/stems/amor/amor-sincero-drums-E minor-110bpm-440hz.mp3` (8.73 MB)
- `public/audio/stems/amor/amor-sincero-bass-E minor-110bpm-440hz.mp3` (8.73 MB)

**Total Stems Size**: 75.20 MB

### 🟡 3D Models

| Size | File | Usage Status |
|------|------|--------------|
| 6.90 MB | `public/3d/music-2252.glb` | ⚠️ **UNUSED** - Only in SW cache, no source imports |

### ✅ Track Audio Files (30+ files, ~120 MB total)

Average track size: 4 MB  
Range: 3.7 MB - 5.4 MB  
All tracks appear to be used in music catalog.

---

## Recommendations

### Immediate Actions (Priority 1)

1. **Split `useAudioEngine.ts` (50.65 KB)**
   - Extract deck management → `useDeckManager.ts`
   - Extract FX chain logic → `useFXChain.ts`
   - Extract transport controls → `useTransport.ts`
   - Target: <15 KB per file

2. **Refactor `contact/page.tsx` (44.50 KB)**
   - Extract form components → `ContactForm.tsx`
   - Extract validation logic → `contactValidation.ts`
   - Extract booking terminal → `BookingTerminal.tsx`
   - Target: <15 KB per file

3. **Delete unused 3D model**
   - `public/3d/music-2252.glb` (6.90 MB)
   - **Proof**: Zero imports in src/, only SW cache reference
   - **Risk**: LOW (not referenced in code)
   - **Savings**: 6.90 MB

### Medium Priority (Priority 2)

4. **Split `ImmersivePlayerOverlay.tsx` (29.32 KB)**
   - Extract player controls → `PlayerControls.tsx`
   - Extract waveform display → `PlayerWaveform.tsx`
   - Extract metadata display → `PlayerMetadata.tsx`

5. **Refactor navigation components**
   - `MobileNav.tsx` (22.61 KB) → Extract menu sections
   - `Navbar.tsx` (21.46 KB) → Extract nav items

6. **Consider stem audio optimization**
   - Current: 75.20 MB in stems (2 tracks)
   - Consider: On-demand loading vs preload
   - Consider: Compression optimization
   - Consider: Progressive loading strategy

### Low Priority (Priority 3)

7. **Monitor growing files**
   - `TrackLibrary.tsx` (21.59 KB) - approaching split threshold
   - `DeckGrid.tsx` (17.13 KB) - monitor complexity
   - `Deck.tsx` (16.28 KB) - already flagged for complexity

---

## File Size Thresholds

**Source Files**:
- ✅ Good: <10 KB
- ⚠️ Review: 10-20 KB
- 🟡 Split Soon: 20-40 KB
- 🔴 Split Now: >40 KB

**Audio Assets**:
- ✅ Acceptable: <5 MB per track
- ⚠️ Review: 5-10 MB (stems are expected to be larger)
- 🔴 Optimize: >10 MB per file

**3D Models**:
- ✅ Good: <1 MB
- ⚠️ Review: 1-5 MB
- 🔴 Optimize or Remove: >5 MB

---

## Metrics Summary

**Source Code**:
- Files >40 KB: 2 files (51.15 KB total bloat)
- Files 20-40 KB: 5 files (119.71 KB)
- Files 10-20 KB: 18 files (~260 KB)
- Files <10 KB: 190+ files ✅

**Public Assets**:
- Audio stems: 75.20 MB (2 tracks × 4 stems)
- Audio tracks: ~120 MB (30+ tracks)
- 3D models: 6.90 MB (1 unused)
- **Potential savings**: 6.90 MB (delete unused GLB)

---

*Report generated via: `Get-ChildItem` + file size analysis*
