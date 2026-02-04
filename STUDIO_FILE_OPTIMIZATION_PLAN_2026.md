# Studio File Organization & Optimization Plan
**Date:** February 4, 2026
**Purpose:** Strategic file structure optimization for Studio assets and codebase cleanup

---

## 🎯 **Executive Summary**

**Current State:**
- ✅ Root directory cleaned (60→8 .md files) - Phase S7 complete
- ⚠️ Studio components spread across multiple directories
- ⚠️ Potential duplicate/legacy files in `src/lib/`
- ⚠️ Mixed audio engine files (old + new architecture)
- ✅ Phase 1.1 DeckEngine architecture in progress

**Goals:**
1. ✅ Identify and archive/remove duplicate or obsolete files
2. 🎯 Optimize Studio component organization
3. 🎯 Consolidate audio engine architecture
4. 🎯 Streamline hooks directory structure
5. 🎯 Create clear separation between legacy and Phase 1.1 code

---

## 📋 **Phase 1: File Duplication Audit**

### 🔍 **Potential Duplicates/Legacy Files to Investigate**

#### A. Audio Engine Files (src/audio/ & src/lib/)

**Legacy vs. New Architecture:**

| File | Type | Status | Action |
|------|------|--------|--------|
| `src/lib/audio-engine.ts` | Legacy utilities | ⚠️ Check usage | Audit for overlap with `src/audio/Engine.ts` |
| `src/audio/Engine.ts` | Main engine class | ✅ Active | Keep (integrating with DeckEngine) |
| `src/audio/engines/DeckEngine.ts` | **NEW** Phase 1.1 | ✅ Active | Keep (core new architecture) |
| `src/audio/FXChain.ts` | FX routing | ✅ Active | Keep (used by DeckEngine) |
| `src/audio/MasterBus.ts` | Master output | ✅ Active | Keep (used by Engine) |

**Investigation Required:**
```bash
# Check if src/lib/audio-engine.ts duplicates src/audio/Engine.ts functionality
rg "from.*lib/audio-engine" --type ts --type tsx
rg "from.*audio/Engine" --type ts --type tsx

# If audio-engine.ts is unused or only has utilities, consider:
# - Merging unique utilities into src/audio/utils.ts (new file)
# - Archiving if completely superseded
```

#### B. Database/Storage Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/db.ts` | General DB utilities | ⚠️ Check usage |
| `src/db/studioDb.ts` | Studio-specific Dexie DB | ✅ Active (Phase S11.2) |

**Investigation Required:**
```bash
# Check overlap between src/lib/db.ts and src/db/studioDb.ts
rg "from.*lib/db" --type ts --type tsx
rg "from.*db/studioDb" --type ts --type tsx
```

#### C. Theme/Styling Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/theme-engine.ts` | Theme utilities | ⚠️ Check if used |
| `src/context/ThemeContext.tsx` | Theme context | ✅ Active |

---

## 📁 **Phase 2: Strategic Studio File Organization**

### 🎨 **Current Studio Component Structure**

```
src/components/studio/
├── core/                    # Core controls (2 files)
│   ├── DeckFXRack.tsx
│   └── MacroKnob.tsx
├── layout/                  # Layout components (13 files)
│   ├── LibraryRow.tsx
│   ├── MixerCenter.tsx
│   ├── Mobile*.tsx (2 files)
│   ├── PerformanceRow.tsx
│   ├── StudioControlBar.tsx
│   ├── StudioGrid.tsx
│   ├── StudioHeader.tsx
│   ├── StudioLayout.tsx    ← Main layout
│   ├── StudioPanels.tsx
│   └── StudioShell.tsx
├── modals/                  # Modals (1 file)
│   └── ExportModal.tsx
├── navigation/              # Navigation (1 file)
│   └── StudioNavMenu.tsx
├── ui/                      # UI components (37 files) ⚠️ TOO LARGE
│   ├── controls/ (3 files)
│   ├── deck/ (2 files)
│   ├── Deck*.tsx (7 files)
│   ├── Stem*.tsx (9 files)
│   ├── Studio*.tsx (4 files)
│   ├── Waveform*.tsx (2 files)
│   └── [others] (10 files)
└── visuals/                 # 3D visuals (2 files)
    ├── JogPlatter3D.tsx
    └── Scene3D.tsx
```

### 🎯 **Proposed Optimized Structure**

```
src/components/studio/
├── core/                    # Core audio controls
│   ├── DeckFXRack.tsx
│   ├── MacroKnob.tsx
│   └── [future: MixerControls.tsx, TransportControls.tsx]
│
├── deck/                    # ✨ NEW: Consolidate all deck components
│   ├── Deck.tsx            ← Main deck component
│   ├── DeckHeader.tsx
│   ├── DeckTransportControls.tsx
│   ├── DeckControls.tsx
│   ├── DeckDropZone.tsx
│   ├── DeckEQ.tsx
│   ├── DeckGrid.tsx
│   ├── DeckWaveformWS.tsx
│   ├── Deck3DToggle.tsx
│   ├── HotCuePanel.tsx
│   ├── LoopControls.tsx
│   └── JogWheel.tsx
│
├── stems/                   # ✨ NEW: Consolidate all stem components
│   ├── StemControls.tsx
│   ├── StemDebugPanel.tsx
│   ├── StemGenerator.tsx
│   ├── StemMeters.tsx
│   ├── StemModeToggle.tsx
│   ├── StemPerformancePads.tsx
│   ├── StemRack.tsx
│   └── StemWaveforms.tsx
│
├── waveforms/               # ✨ NEW: Consolidate waveform components
│   ├── MainWaveform.tsx
│   ├── WaveformMini.tsx
│   ├── BeatGrid.tsx
│   └── EnergyIndicator.tsx
│
├── mixer/                   # ✨ NEW: Mixer-specific components
│   ├── MixerCenter.tsx
│   ├── Crossfader.tsx
│   ├── ChannelFader.tsx
│   └── LevelMeter.tsx
│
├── library/                 # ✨ NEW: Library/track management
│   ├── LibraryRow.tsx
│   ├── LibraryDrawer.tsx
│   ├── TrackLibrary.tsx
│   ├── TrackListing.tsx
│   ├── MatchBadge.tsx
│   └── RecommendationsPopover.tsx
│
├── layout/                  # Layout containers (keep minimal)
│   ├── StudioLayout.tsx    ← Main layout only
│   ├── StudioShell.tsx
│   ├── StudioGrid.tsx
│   ├── StudioPanels.tsx
│   ├── StudioHeader.tsx
│   ├── StudioControlBar.tsx
│   ├── LibraryRow.tsx
│   ├── PerformanceRow.tsx
│   ├── MobileLandscapeWorkstation.tsx
│   └── MobilePortraitPocketStudio.tsx
│
├── modals/                  # Modal dialogs
│   ├── ExportModal.tsx
│   └── StudioSettingsPanel.tsx (move from ui/)
│
├── navigation/              # Navigation
│   └── StudioNavMenu.tsx
│
├── visuals/                 # 3D visuals
│   ├── JogPlatter3D.tsx
│   ├── JogWheel3DWrapper.tsx (move from ui/)
│   └── Scene3D.tsx
│
└── controls/                # ✨ NEW: Shared controls (extracted from ui/)
    ├── Fader.tsx
    ├── Knob.tsx
    ├── StudioMonitor.tsx
    └── StudioOnboarding.tsx
```

### 📊 **Benefits of Reorganization**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| `ui/` directory files | 37 files | 0 files | 100% reduction |
| Top-level categories | 5 | 11 | Better organization |
| Avg files per category | 10.8 | 4.9 | 54% reduction |
| Import path clarity | ⚠️ Unclear | ✅ Self-documenting | High |

**Example Import Improvements:**
```typescript
// ❌ Before: Unclear what "ui" means
import { Deck } from '@/components/studio/ui/Deck'
import { StemRack } from '@/components/studio/ui/StemRack'
import { MainWaveform } from '@/components/studio/ui/MainWaveform'

// ✅ After: Clear semantic organization
import { Deck } from '@/components/studio/deck/Deck'
import { StemRack } from '@/components/studio/stems/StemRack'
import { MainWaveform } from '@/components/studio/waveforms/MainWaveform'
```

---

## 🎵 **Phase 3: Audio Engine Architecture Cleanup**

### 🏗️ **Current Audio Architecture**

```
src/
├── audio/
│   ├── Engine.ts                    # Main engine (being refactored)
│   ├── engines/
│   │   └── DeckEngine.ts            # ✨ NEW Phase 1.1 (711 lines)
│   ├── AnalysisWorker.ts
│   ├── FXChain.ts
│   ├── MasterBus.ts
│   ├── mixer/
│   │   └── crossfaderCurves.ts
│   └── waveform/
│       └── computePeaks.ts
│
├── lib/
│   ├── audio-engine.ts              # ⚠️ Legacy? Check for duplication
│   ├── deck-fx-chain.ts             # ⚠️ May be superseded by FXChain.ts
│   └── utils/
│       └── audioMath.ts
│
└── hooks/
    ├── useAudioEngine.ts            # Being refactored (1450 lines)
    ├── deck/
    │   ├── useDeckStems.ts
    │   ├── useDeckTransport.ts
    │   └── useDeckWaveformSync.ts
    └── [33 other hooks]
```

### 🎯 **Proposed Audio Engine Structure (Post Phase 1.1)**

```
src/audio/
├── engines/
│   ├── DeckEngine.ts               # ✅ Phase 1.1 complete (711 lines)
│   ├── MixerEngine.ts              # ⏳ Phase 1.1 Week 3 (planned)
│   └── EffectsEngine.ts            # ⏳ Future (FX consolidation)
│
├── core/
│   ├── Engine.ts                   # Main audio engine coordinator
│   ├── MasterBus.ts
│   └── AnalysisWorker.ts
│
├── fx/
│   ├── FXChain.ts
│   ├── DeckFXChain.ts              # Migrate from src/lib/deck-fx-chain.ts
│   └── effects/                    # ⏳ Future (individual FX classes)
│
├── mixer/
│   ├── crossfaderCurves.ts
│   └── channelMixer.ts             # ⏳ Future
│
├── waveform/
│   ├── computePeaks.ts
│   └── analysis/                   # ⏳ Future (beat detection, etc.)
│
└── utils/
    ├── audioMath.ts                # Migrate from src/lib/utils/audioMath.ts
    └── toneHelpers.ts              # ⏳ Future (Tone.js utilities)
```

### 🧹 **Audio Architecture Cleanup Actions**

**Step 1: Audit Legacy Files**
```bash
# Check if src/lib/audio-engine.ts is still used
rg "from.*['\"]@/lib/audio-engine" --type ts --type tsx

# Check if src/lib/deck-fx-chain.ts overlaps with src/audio/FXChain.ts
rg "from.*['\"]@/lib/deck-fx-chain" --type ts --type tsx
rg "from.*['\"]@/audio/FXChain" --type ts --type tsx
```

**Step 2: Consolidate Utilities**
- Move `src/lib/utils/audioMath.ts` → `src/audio/utils/audioMath.ts`
- Update all imports to use new path

**Step 3: FX Chain Consolidation**
- Audit `src/lib/deck-fx-chain.ts` for unique functionality
- Merge into `src/audio/fx/DeckFXChain.ts` or remove if superseded

---

## 🪝 **Phase 4: Hooks Directory Optimization**

### 📊 **Current Hooks Structure**

```
src/hooks/
├── deck/                            # Deck-specific hooks (3 files)
│   ├── useDeckStems.ts
│   ├── useDeckTransport.ts
│   └── useDeckWaveformSync.ts
│
└── [33 other hooks] ⚠️ All flat in root
```

### 🎯 **Proposed Hooks Structure**

```
src/hooks/
├── audio/                           # Audio engine hooks
│   ├── useAudioEngine.ts           ← Main audio hook (1450 lines)
│   ├── useAudioAnalyser.ts
│   ├── useEssentiaAnalysis.ts
│   ├── useMixRecorder.ts
│   └── useStemGenerator.ts
│
├── deck/                            # Deck-specific hooks
│   ├── useDeckStems.ts
│   ├── useDeckTransport.ts
│   └── useDeckWaveformSync.ts
│
├── studio/                          # Studio UI hooks
│   ├── useKeyboardControls.ts
│   ├── useStudioGestures.ts
│   ├── useLibrarySync.ts
│   └── useExporter.ts
│
├── tracks/                          # Track analysis & insights
│   ├── useTrackAnalysis.ts
│   ├── useTrackInsights.ts
│   ├── useTrackCues.ts
│   ├── useSmartTrackAnalysis.ts
│   └── useCyaniteRecommendations.ts
│
├── device/                          # Device & platform hooks
│   ├── useDeviceOrientation.ts
│   ├── useOrientation.ts
│   ├── useMobileLandscape.ts
│   ├── useMediaQuery.ts
│   └── useHaptic.ts
│
├── performance/                     # Performance & optimization
│   ├── usePerformanceHeuristics.ts
│   ├── usePerformanceMode.ts
│   ├── useComplexityMode.ts
│   └── useGPUTier.ts
│
├── ui/                              # UI interaction hooks
│   ├── useGestures.ts
│   ├── useMouseParallax.ts
│   ├── useScrollDirection.ts
│   ├── useBodyScrollLock.ts
│   └── useFocusTrap.ts
│
├── integrations/                    # External integrations
│   ├── useMidiBridge.ts
│   ├── useSocialExport.ts
│   └── useStemWorker.ts
│
└── utils/                           # Utility hooks
    ├── useArtworkPreload.ts
    └── useGyroLighting.ts
```

**Migration Impact:**
- Before: 36 hooks in 2 directories (root + deck/)
- After: 36 hooks in 9 semantic directories
- Average: 4 hooks per category (better discoverability)

---

## 🧪 **Phase 5: Test File Organization**

### 📊 **Current Test Structure**

```
tests/
├── playwright/
│   ├── helpers.ts
│   ├── studio-desktop.spec.ts
│   ├── studio-mobile.spec.ts
│   ├── studio-tablet.spec.ts
│   └── visual-regression.spec.ts
│
├── unit/
│   ├── crossfaderCurves.test.ts
│   ├── DeckEngine.test.ts           ← Phase 1.1 NEW
│   ├── haptics.test.ts
│   ├── matchScoring.test.ts
│   └── server/
│       └── email/
│           ├── rateLimit.test.ts
│           └── validateContact.test.ts
│
├── stems.spec.ts
├── studio-ux.spec.ts
└── studio.spec.ts
```

### 🎯 **Proposed Test Organization**

```
tests/
├── unit/
│   ├── audio/                       # Audio engine tests
│   │   ├── DeckEngine.test.ts
│   │   ├── crossfaderCurves.test.ts
│   │   └── MixerEngine.test.ts      ← Future
│   │
│   ├── features/                    # Feature tests
│   │   ├── matchScoring.test.ts
│   │   └── stems.test.ts
│   │
│   ├── hooks/                       # Hook tests
│   │   └── haptics.test.ts
│   │
│   └── server/                      # Server-side tests
│       └── email/
│           ├── rateLimit.test.ts
│           └── validateContact.test.ts
│
├── integration/                     # Integration tests
│   ├── studio.spec.ts
│   ├── studio-ux.spec.ts
│   └── stems.spec.ts               ← Move from root
│
└── e2e/                             # End-to-end (Playwright)
    ├── helpers/
    │   └── testHelpers.ts
    ├── studio/
    │   ├── desktop.spec.ts
    │   ├── mobile.spec.ts
    │   └── tablet.spec.ts
    └── visual-regression.spec.ts
```

---

## 📦 **Phase 6: Archive Strategy**

### 🗄️ **Archive Directory Structure**

```
archive/
├── components/
│   ├── DevResetButton.tsx.removed   ← Already archived
│   └── unused-components-feb-2026/  ← Already archived (8 files)
│
├── audio/                           # ✨ NEW: Legacy audio code
│   ├── legacy-engine/
│   │   └── [old Engine.ts if replaced]
│   └── pre-phase1.1/
│       └── [audio files before Phase 1.1]
│
├── docs/                            # Already exists with archived docs
│   ├── archive/
│   └── phases/
│
└── hooks/                           # ✨ NEW: Superseded hooks
    └── [hooks replaced during refactor]
```

---

## 🚀 **Implementation Roadmap**

### **Week 1: Audit & Planning** (Current)
- ✅ Create comprehensive file inventory
- ✅ Document current structure
- 🔄 **YOU ARE HERE:** Review optimization plan
- ⏳ Identify duplicate files via grep/ripgrep
- ⏳ Get user approval for reorganization

### **Week 2: Phase 1.1 Completion**
**Priority:** Complete audio engine refactor before file reorganization
- ⏳ Week 1 Day 5: Manual testing DeckEngine integration
- ⏳ Week 2: Complete DeckEngine (EQ, filter, pitch, quantization)
- ⏳ Week 3: Create MixerEngine class
- ⏳ Week 4: Performance optimization

**Rationale:** File organization should follow architecture, not precede it

### **Week 3: Studio Component Reorganization**
**Batch 1: Deck Components** (Low risk - clear ownership)
```bash
# Move all Deck*.tsx to studio/deck/
git mv src/components/studio/ui/Deck*.tsx src/components/studio/deck/
git mv src/components/studio/ui/deck/* src/components/studio/deck/
git mv src/components/studio/ui/HotCuePanel.tsx src/components/studio/deck/
git mv src/components/studio/ui/LoopControls.tsx src/components/studio/deck/
git mv src/components/studio/ui/JogWheel.tsx src/components/studio/deck/

# Update all imports
# Run: npm run build && npm run lint
```

**Batch 2: Stem Components** (Low risk - clear prefix)
```bash
git mv src/components/studio/ui/Stem*.tsx src/components/studio/stems/
# Update imports, verify build
```

**Batch 3: Waveform Components** (Low risk - clear functionality)
```bash
git mv src/components/studio/ui/*Waveform*.tsx src/components/studio/waveforms/
git mv src/components/studio/ui/BeatGrid.tsx src/components/studio/waveforms/
git mv src/components/studio/ui/EnergyIndicator.tsx src/components/studio/waveforms/
# Update imports, verify build
```

**Batch 4: Mixer Components** (Low risk)
```bash
git mv src/components/studio/ui/Crossfader.tsx src/components/studio/mixer/
git mv src/components/studio/ui/ChannelFader.tsx src/components/studio/mixer/
git mv src/components/studio/ui/LevelMeter.tsx src/components/studio/mixer/
git mv src/components/studio/layout/MixerCenter.tsx src/components/studio/mixer/
# Update imports, verify build
```

**Batch 5: Library Components** (Low risk)
```bash
mkdir src/components/studio/library
git mv src/components/studio/ui/Library*.tsx src/components/studio/library/
git mv src/components/studio/ui/Track*.tsx src/components/studio/library/
git mv src/components/studio/ui/MatchBadge.tsx src/components/studio/library/
git mv src/components/studio/ui/RecommendationsPopover.tsx src/components/studio/library/
# Update imports, verify build
```

**Batch 6: Remaining UI → Controls** (Medium risk - verify usage)
```bash
mkdir src/components/studio/controls
git mv src/components/studio/ui/StudioMonitor.tsx src/components/studio/controls/
git mv src/components/studio/ui/StudioOnboarding.tsx src/components/studio/controls/
# Update imports, verify build
```

**Batch 7: Visuals** (Low risk)
```bash
git mv src/components/studio/ui/JogWheel3DWrapper.tsx src/components/studio/visuals/
# Update imports, verify build
```

**Batch 8: Modals** (Low risk)
```bash
git mv src/components/studio/ui/StudioSettingsPanel.tsx src/components/studio/modals/
# Update imports, verify build
```

### **Week 4: Hooks Reorganization**
**Strategy:** Create new directories, move files in batches, update imports

**Batch 1: Audio Hooks**
```bash
mkdir -p src/hooks/audio
git mv src/hooks/useAudio*.ts src/hooks/audio/
git mv src/hooks/useEssentiaAnalysis.ts src/hooks/audio/
git mv src/hooks/useMixRecorder.ts src/hooks/audio/
git mv src/hooks/useStemGenerator.ts src/hooks/audio/
# Update imports, verify build
```

**Batch 2-7:** Follow same pattern for studio/, tracks/, device/, performance/, ui/, integrations/

### **Week 5: Audio Engine Cleanup**
**After Phase 1.1 Week 3 (MixerEngine) is complete:**

**Step 1: Audit Legacy Files**
```bash
# Check usage of src/lib/audio-engine.ts
rg "from.*['\"]@/lib/audio-engine" --type ts --type tsx > audit-audio-engine.txt

# Check usage of src/lib/deck-fx-chain.ts
rg "from.*['\"]@/lib/deck-fx-chain" --type ts --type tsx > audit-deck-fx.txt
```

**Step 2: Consolidate Utils**
```bash
mkdir -p src/audio/utils
git mv src/lib/utils/audioMath.ts src/audio/utils/
# Update imports, verify build
```

**Step 3: FX Consolidation**
```bash
mkdir -p src/audio/fx
# If deck-fx-chain.ts is unique, move it
# If it's superseded, archive it
```

### **Week 6: Test Reorganization**
**Low risk - tests are isolated:**
```bash
mkdir -p tests/unit/{audio,features,hooks}
mkdir -p tests/integration
mkdir -p tests/e2e/{helpers,studio}

# Move unit tests
git mv tests/unit/DeckEngine.test.ts tests/unit/audio/
git mv tests/unit/crossfaderCurves.test.ts tests/unit/audio/
git mv tests/unit/matchScoring.test.ts tests/unit/features/
git mv tests/unit/haptics.test.ts tests/unit/hooks/

# Move integration tests
git mv tests/studio.spec.ts tests/integration/
git mv tests/studio-ux.spec.ts tests/integration/
git mv tests/stems.spec.ts tests/integration/

# Move e2e tests
git mv tests/playwright/helpers.ts tests/e2e/helpers/testHelpers.ts
git mv tests/playwright/studio-*.spec.ts tests/e2e/studio/
git mv tests/playwright/visual-regression.spec.ts tests/e2e/

# Update test paths in vitest.config.ts and playwright.config.ts
```

---

## 📊 **Success Metrics**

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Root .md files | 60 | 8 | ✅ Complete (Phase S7) |
| Studio ui/ files | 37 | 0 | ⏳ Pending reorganization |
| Hooks categories | 2 | 9 | ⏳ Pending reorganization |
| Duplicate audio files | ? | 0 | ⏳ Pending audit |
| Average directory size | ~10 files | ~5 files | ⏳ Pending reorganization |
| Import path clarity | Medium | High | ⏳ Post-reorganization |
| Build time | ~32s | <30s | ⏳ Optimize after cleanup |

---

## ⚠️ **Risk Mitigation**

### **Pre-Reorganization Checklist**
- [ ] Full backup/commit before starting
- [ ] All Phase 1.1 code complete and tested
- [ ] Create branch: `feature/file-organization-2026`
- [ ] Run full test suite (baseline)
- [ ] Document current import patterns

### **Per-Batch Safety Protocol**
1. Create batch-specific commit before changes
2. Move files with `git mv` (preserves history)
3. Update imports using regex find/replace
4. Run `npm run build` (must exit 0)
5. Run `npm run lint` (must pass)
6. Run `npm run test` (must match baseline)
7. If ANY fail → revert batch, analyze, retry
8. Commit successful batch immediately

### **Rollback Plan**
```bash
# If batch fails and can't be fixed quickly:
git reset --hard HEAD~1  # Revert last commit
npm run build            # Verify rollback worked
npm run test             # Verify baseline restored

# Document failure for later retry
```

---

## 🎯 **Next Steps**

### **Immediate Actions (This Week)**
1. ✅ Review this optimization plan
2. ⏳ **User approval required** for reorganization strategy
3. ⏳ Run duplicate file audit commands (see Phase 1 Investigation Required sections)
4. ⏳ Create detailed import update regex patterns
5. ⏳ Set up branch: `feature/file-organization-2026`

### **Blocking Dependencies**
- ⚠️ **Wait for Phase 1.1 completion** before audio engine cleanup
- ⚠️ **Audit duplicate files** before archiving/deleting
- ⚠️ **Get user approval** for major reorganization

### **Questions for User**
1. Should we wait until Phase 1.1 Week 3 (MixerEngine) is complete before reorganizing?
2. Approve the proposed Studio component structure (deck/, stems/, waveforms/, mixer/, library/)?
3. Approve the proposed hooks categorization (audio/, deck/, studio/, tracks/, device/, etc.)?
4. Should we archive or delete files identified as duplicates?
5. Any specific file concerns or priorities?

---

**End of Plan**
*This is a living document. Update as implementation progresses.*
