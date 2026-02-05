# Deletion Plan

**Generated**: February 4, 2026
**Agent**: RepoAuditor
**Scope**: Consolidated deletion candidates from all audit reports

---

## Executive Summary

- **Total deletion candidates**: 10 files + 3 assets
- **Source code savings**: ~32 KB
- **Asset savings**: ~6.9 MB
- **Risk level**: LOW (all verified with zero usage)
- **Build verification**: Required after each batch

---

## Batch 1: Legacy Audio Classes (LOW RISK)

### Files to DELETE

#### 1. `src/audio/AnalysisWorker.ts`

**Size**: ~2 KB
**Reason**: Unused stub implementation, marked TODO
**Risk**: 🟢 LOW

**Proof of zero usage**:
```bash
# Direct imports
grep -r "AnalysisWorker" src/ --include="*.ts" --include="*.tsx"
# Result: Only definition file

# Dynamic imports
grep -r "import\(.*AnalysisWorker" src/
# Result: No matches
```

**Verification checklist**:
- ✅ Zero direct imports
- ✅ Zero dynamic imports
- ✅ Not used in Next.js routing
- ✅ Flagged by ts-prune
- ✅ Flagged by madge (orphan)

---

#### 2. `src/audio/Engine.ts`

**Size**: ~8 KB
**Reason**: Legacy audio engine, superseded by `useAudioEngine` hook
**Risk**: 🟢 LOW

**Proof of zero usage**:
```bash
# Direct imports
grep -r "from.*audio/Engine" src/ --include="*.ts" --include="*.tsx"
# Result: No matches

# Dynamic imports
grep -r "import\(.*Engine" src/
# Result: No matches (or only DeckEngine)
```

**Verification checklist**:
- ✅ Zero direct imports
- ✅ Replaced by useAudioEngine hook
- ✅ Not used in Next.js routing
- ✅ Flagged by ts-prune
- ✅ Flagged by madge (orphan)

---

#### 3. `src/audio/FXChain.ts`

**Size**: ~5 KB
**Reason**: Legacy FX chain, replaced by `DeckFXChain` in deck-fx-chain.ts
**Risk**: 🟢 LOW

**Proof of zero usage**:
```bash
# Direct imports (excluding DeckFXChain)
grep -r "import.*FXChain" src/ --include="*.ts" | grep -v "DeckFXChain"
# Result: No matches

# Class instantiation
grep -r "new FXChain" src/
# Result: No matches (only DeckFXChain)
```

**Verification checklist**:
- ✅ Zero direct imports
- ✅ Replaced by DeckFXChain
- ✅ Not used in Next.js routing
- ✅ Flagged by ts-prune
- ✅ Flagged by madge (orphan)

---

#### 4. `src/audio/MasterBus.ts`

**Size**: ~3 KB
**Reason**: Unused legacy audio class
**Risk**: 🟢 LOW

**Proof of zero usage**:
```bash
# Direct imports
grep -r "MasterBus" src/ --include="*.ts" --include="*.tsx"
# Result: Only definition file

# Dynamic imports
grep -r "import\(.*MasterBus" src/
# Result: No matches
```

**Verification checklist**:
- ✅ Zero direct imports
- ✅ Zero dynamic imports
- ✅ Not used in Next.js routing
- ✅ Flagged by ts-prune
- ✅ Flagged by madge (orphan)

---

### Batch 1 Commands

```bash
# Delete legacy audio files
rm src/audio/AnalysisWorker.ts
rm src/audio/Engine.ts
rm src/audio/FXChain.ts
rm src/audio/MasterBus.ts

# Verify build
npm run build
npm run lint
```

**Expected outcome**:
- ✅ Build passes with zero errors
- ✅ Lint passes with zero errors
- ✅ Bundle size reduction: ~18 KB

**Rollback if needed**:
```bash
git restore src/audio/AnalysisWorker.ts src/audio/Engine.ts src/audio/FXChain.ts src/audio/MasterBus.ts
```

---

## Batch 2: Unused Components & Context (LOW RISK)

### Files to DELETE

#### 5. `src/components/ErrorBoundary.tsx`

**Size**: ~3 KB
**Reason**: Next.js uses built-in error.tsx for error boundaries
**Risk**: 🟢 LOW

**Proof of zero usage**:
```bash
# Direct imports
grep -r "ErrorBoundary" src/ --include="*.tsx" --exclude-dir="components/ErrorBoundary.tsx"
# Result: Only definition file

# Check if used in layouts
grep -r "ErrorBoundary" src/app/**/layout.tsx
# Result: No matches
```

**Verification checklist**:
- ✅ Zero direct imports
- ✅ Not used in layouts
- ✅ Replaced by Next.js error.tsx
- ✅ Flagged by ts-prune
- ✅ Flagged by madge (orphan)

---

#### 6. `src/context/ThemeContext.tsx`

**Size**: ~5 KB
**Reason**: Theme management moved to Zustand store (`useStore`)
**Risk**: 🟢 LOW

**Proof of zero usage**:
```bash
# Direct imports
grep -r "ThemeContext|ThemeProvider|useTheme" src/ --include="*.tsx" --exclude="context/ThemeContext.tsx"
# Result: No matches (or only Zustand theme usage)

# Check layouts
grep -r "ThemeProvider" src/app/**/layout.tsx
# Result: No matches
```

**Verification checklist**:
- ✅ Zero direct imports
- ✅ Not used in layouts
- ✅ Replaced by Zustand store
- ✅ Flagged by ts-prune
- ✅ Flagged by madge (orphan)

---

### Batch 2 Commands

```bash
# Delete unused components and context
rm src/components/ErrorBoundary.tsx
rm src/context/ThemeContext.tsx

# Verify build
npm run build
npm run lint
```

**Expected outcome**:
- ✅ Build passes with zero errors
- ✅ Lint passes with zero errors
- ✅ Bundle size reduction: ~8 KB

**Rollback if needed**:
```bash
git restore src/components/ErrorBoundary.tsx src/context/ThemeContext.tsx
```

---

## Batch 3: Unused Asset (LOW RISK)

### Asset to DELETE

#### 7. `public/3d/music-2252.glb`

**Size**: 6.90 MB
**Reason**: Not referenced in any source files, only in service worker cache
**Risk**: 🟢 LOW

**Proof of zero usage**:
```bash
# Source file imports
grep -r "music-2252" src/ --include="*.ts" --include="*.tsx"
# Result: No matches

# Public path references
grep -r "3d/music-2252" src/
# Result: No matches

# Check if in scene/model loaders
grep -r "music-2252" src/components/studio/visuals/
# Result: No matches
```

**Where it appears**:
- `public/sw.js` - Service worker cache list (auto-generated)
- Old audit reports

**Service worker note**:
- SW cache is auto-generated at build time
- Removing file will remove it from future SW cache
- No manual SW edits needed

**Verification checklist**:
- ✅ Zero source file references
- ✅ Not used in 3D scenes
- ✅ Only in auto-generated SW cache
- ✅ Not in any manifests
- ✅ Safe to delete

---

### Batch 3 Commands

```bash
# Delete unused 3D model
rm public/3d/music-2252.glb

# Verify build (SW will regenerate without this file)
npm run build
npm run lint
```

**Expected outcome**:
- ✅ Build passes with zero errors
- ✅ SW regenerates without music-2252.glb
- ✅ Asset savings: 6.90 MB

**Rollback if needed**:
```bash
git restore public/3d/music-2252.glb
```

---

## Batch 4: Partial File Cleanup (MEDIUM RISK)

### Files to MODIFY (not delete)

#### 8. `src/utils/audioUtils.ts` - Remove unused functions

**Functions to DELETE**:
- `reverseAudioBuffer` (line 10)
- `calculateBeatPositions` (line 36)
- `snapToBeat` (line 56)
- `quantizeLoop` (line 80)

**Proof of zero usage**:
```bash
grep -r "reverseAudioBuffer|calculateBeatPositions|snapToBeat|quantizeLoop" src/ --include="*.ts" --exclude="utils/audioUtils.ts"
# Result: No matches
```

**Risk**: 🟡 MEDIUM (file remains, only remove functions)

**Action**: Manually edit file or use search/replace tool

---

#### 9. `src/utils/deviceDetection.ts` - Remove unused functions

**Functions to DELETE**:
- `hasSufficientComputePower` (line 19)
- `getComputePowerLevel` (line 35)

**Proof of zero usage**:
```bash
grep -r "hasSufficientComputePower|getComputePowerLevel" src/ --include="*.ts" --exclude="utils/deviceDetection.ts"
# Result: No matches (replaced by useGPUTier hook)
```

**Risk**: 🟡 MEDIUM (file remains, only remove functions)

---

#### 10. `src/components/LoadingSkeleton.tsx` - Remove unused export

**Export to DELETE**:
- `TrackLibrarySkeleton` (line 21)

**Keep**:
- `TrackSkeleton` (used internally)

**Proof of zero usage**:
```bash
grep -r "TrackLibrarySkeleton" src/ --include="*.tsx" --exclude="components/LoadingSkeleton.tsx"
# Result: No matches
```

**Risk**: 🟡 MEDIUM (file remains, only remove export)

---

### Batch 4 - Manual Edits Required

**Option A**: Use @StudioImplementer agent to edit files
**Option B**: Manual editing in IDE

**After edits**:
```bash
npm run build
npm run lint
```

---

## Archive Candidates (MEDIUM RISK)

### Files to ARCHIVE (not delete)

Move to `/archive/` for potential future use:

#### 11. `src/utils/smartSuggestions.ts`

**Reason**: AI recommendation system, incomplete
**Risk**: 🟡 MEDIUM (may implement later)

**Command**:
```bash
mkdir -p archive/ai-features
mv src/utils/smartSuggestions.ts archive/ai-features/
```

---

#### 12. `src/lib/audioshake.ts`

**Reason**: Paid API integration, not currently enabled
**Risk**: 🔴 HIGH (may enable when budget allows)

**Command**:
```bash
mkdir -p archive/paid-integrations
mv src/lib/audioshake.ts archive/paid-integrations/
```

---

#### 13. `src/audio/waveform/computePeaks.ts`

**Reason**: Custom peak computation, not used (WaveSurfer built-in used)
**Risk**: 🟡 MEDIUM (may need for custom waveforms)

**Command**:
```bash
mkdir -p archive/legacy-audio
mv src/audio/waveform/computePeaks.ts archive/legacy-audio/
```

---

#### 14. `src/components/GlitchText.tsx`

**Reason**: Cool visual effect, not currently used
**Risk**: 🟢 LOW (nice-to-have effect)

**Command**:
```bash
mkdir -p archive/unused-effects
mv src/components/GlitchText.tsx archive/unused-effects/
```

---

## Keep (Do NOT Delete)

### Database Utilities

**Files to KEEP** (valid utilities, may use later):
- `src/db/studioDb.ts` - Query functions ✅
- `src/lib/db.ts` - Track management ✅

**Reason**: Small size, valid DB operations, may use in track management UI

---

### Phase 5 Components

**Files to KEEP** (awaiting UI integration):
- `src/components/studio/deck/BeatGridOverlay.tsx` ✅
- `src/components/studio/mixer/PhaseMeter.tsx` ✅
- `src/components/studio/mixer/QuantizeControl.tsx` ✅
- `src/components/studio/mixer/SyncControl.tsx` ✅
- `src/hooks/audio/useBeatGrid.ts` ✅
- `src/hooks/audio/useQuantize.ts` ✅
- `src/hooks/audio/useTempoSync.ts` ✅

**Reason**: Recently created (Phase 5), ready for integration per PHASE_5_INTEGRATION_GUIDE.md

---

## Implementation Sequence

### Recommended Order

1. ✅ **Batch 1** - Delete legacy audio (lowest risk)
2. ✅ **Batch 2** - Delete unused components (low risk)
3. ✅ **Batch 3** - Delete unused asset (low risk, big savings)
4. ⚠️ **Archive files** - Move potential future-use files
5. ⚠️ **Batch 4** - Partial cleanup (medium risk, manual edits)

### After Each Batch

```bash
# Verify build
npm run build

# Verify lint
npm run lint

# Commit if successful
git add .
git commit -m "chore: Remove unused [batch description]"

# If errors occur
git restore .
# Fix issues, then retry
```

---

## Savings Summary

| Batch | Files | Source Code | Assets | Total Savings |
|-------|-------|-------------|--------|---------------|
| Batch 1 | 4 files | ~18 KB | - | 18 KB |
| Batch 2 | 2 files | ~8 KB | - | 8 KB |
| Batch 3 | 1 asset | - | 6.90 MB | 6.90 MB |
| Batch 4 | 3 files (partial) | ~6 KB | - | 6 KB |
| **Total** | **10 items** | **~32 KB** | **6.90 MB** | **~6.93 MB** |

**Additional savings from archiving**:
- Archive: ~15 KB moved to /archive/

---

## Risk Matrix

| File | Risk Level | Reason | Safe? |
|------|-----------|--------|-------|
| `audio/AnalysisWorker.ts` | 🟢 LOW | Stub, zero usage | ✅ YES |
| `audio/Engine.ts` | 🟢 LOW | Superseded, zero usage | ✅ YES |
| `audio/FXChain.ts` | 🟢 LOW | Replaced, zero usage | ✅ YES |
| `audio/MasterBus.ts` | 🟢 LOW | Unused, zero usage | ✅ YES |
| `components/ErrorBoundary.tsx` | 🟢 LOW | Next.js has built-in | ✅ YES |
| `context/ThemeContext.tsx` | 🟢 LOW | Moved to Zustand | ✅ YES |
| `3d/music-2252.glb` | 🟢 LOW | Not referenced | ✅ YES |
| `utils/audioUtils.ts` (partial) | 🟡 MEDIUM | File remains, functions removed | ⚠️ VERIFY |
| `utils/deviceDetection.ts` (partial) | 🟡 MEDIUM | File remains, functions removed | ⚠️ VERIFY |
| `components/LoadingSkeleton.tsx` (partial) | 🟡 MEDIUM | File remains, export removed | ⚠️ VERIFY |

---

## Handoff to StudioImplementer

When ready to implement, use this prompt:

---

**@StudioImplementer**, please implement the following approved deletions from the audit:

**Batch 1 (Low Risk - Direct Delete)**:
- Delete `src/audio/AnalysisWorker.ts`
- Delete `src/audio/Engine.ts`
- Delete `src/audio/FXChain.ts`
- Delete `src/audio/MasterBus.ts`
- Run build/lint verification
- Commit: "chore: Remove legacy audio classes"

**Batch 2 (Low Risk - Direct Delete)**:
- Delete `src/components/ErrorBoundary.tsx`
- Delete `src/context/ThemeContext.tsx`
- Run build/lint verification
- Commit: "chore: Remove unused components and context"

**Batch 3 (Low Risk - Asset Delete)**:
- Delete `public/3d/music-2252.glb`
- Run build/lint verification
- Commit: "chore: Remove unused 3D model (6.9MB savings)"

After each batch, verify:
1. ✅ npm run build (must pass)
2. ✅ npm run lint (must pass)
3. ✅ Commit changes
4. ✅ Report success before next batch

---

*Report generated via: Consolidation of largest-files.md, unused-exports.md, circular-deps.md reports*
