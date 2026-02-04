# Duplicate Files Audit Report
**Date:** February 4, 2026  
**Purpose:** Identify duplicate/legacy files for cleanup

---

## 🔍 **Executive Summary**

**Files Identified:**
- 🟡 `src/lib/audio-engine.ts` (540 lines) - **LEGACY** buffer management system
- ✅ `src/audio/Engine.ts` (100 lines) - **CURRENT** Tone.js singleton wrapper
- 🟡 `src/lib/deck-fx-chain.ts` - Legacy FX chain (used by legacy audio-engine.ts)
- ✅ `src/audio/FXChain.ts` - Current FX chain implementation
- ✅ `src/audio/engines/DeckEngine.ts` (711 lines) - **NEW** Phase 1.1 architecture

**Finding:** Clear architectural evolution from legacy Web Audio API → Tone.js → DeckEngine pattern

---

## 📊 **Detailed Analysis**

### **1. Audio Engine Files**

#### A. `src/lib/audio-engine.ts` (540 lines) - LEGACY ⚠️

**Purpose:** Original Web Audio API-based engine with buffer management

**Key Features:**
- AudioBufferManager for caching decoded audio
- SchedulerEngine for lookahead timing
- DeckFXChain integration (Phase V-B)
- Direct Web Audio API usage (no Tone.js)

**Current Usage:**
```typescript
// ONLY USED IN: src/components/studio/core/DeckFXRack.tsx
import { getAudioEngine } from '@/lib/audio-engine';

// Line 22 in DeckFXRack.tsx
const engine = getAudioEngine();
```

**Status:** 🟡 **PARTIALLY DEPRECATED**
- Legacy architecture (pre-Tone.js)
- Only 1 active import (DeckFXRack.tsx)
- Superseded by `src/audio/Engine.ts` + `src/audio/engines/DeckEngine.ts`

**Recommendation:**
```
OPTION 1 (Recommended): Refactor DeckFXRack.tsx to use new architecture
  - Update DeckFXRack to use Tone.js-based FX chain
  - Archive src/lib/audio-engine.ts to archive/audio/legacy-engine/
  - Delete src/lib/deck-fx-chain.ts (no longer needed)

OPTION 2 (Conservative): Keep until Phase 1.1 Week 3 (MixerEngine) complete
  - Wait until FX consolidation phase
  - Then migrate DeckFXRack in one batch
```

---

#### B. `src/audio/Engine.ts` (100 lines) - CURRENT ✅

**Purpose:** Tone.js singleton wrapper (Phase II architecture)

**Key Features:**
- Singleton pattern for Tone.js context
- Browser autoplay policy handling
- Clean initialization/disposal lifecycle

**Status:** ✅ **ACTIVE & CORRECT**
- Used throughout codebase
- Integrates with Phase 1.1 DeckEngine
- No duplication issues

**Recommendation:** **KEEP** - This is the correct current architecture

---

#### C. `src/audio/engines/DeckEngine.ts` (711 lines) - NEW ✅

**Purpose:** Phase 1.1 deck audio engine (event-driven architecture)

**Status:** ✅ **ACTIVE & CORRECT**
- Newest architecture (February 2026)
- Uses Tone.js exclusively
- Event emitter pattern
- Well-tested (33 unit tests)

**Recommendation:** **KEEP** - This is the future architecture

---

### **2. FX Chain Files**

#### A. `src/lib/deck-fx-chain.ts` - LEGACY ⚠️

**Purpose:** FX chain for legacy audio-engine.ts

**Current Usage:**
```typescript
// ONLY USED IN: src/lib/audio-engine.ts
import { DeckFXChain, type DeckFXState } from './deck-fx-chain';
```

**Status:** 🟡 **DEPRECATED** (only used by legacy audio-engine.ts)

**Recommendation:**
```
DELETE after migrating DeckFXRack.tsx to new architecture
Archive to: archive/audio/legacy-engine/deck-fx-chain.ts
```

---

#### B. `src/audio/FXChain.ts` - CURRENT ✅

**Purpose:** Tone.js-based FX chain

**Status:** ✅ **ACTIVE & CORRECT**
- Uses Tone.js
- Used by DeckEngine
- Current architecture

**Recommendation:** **KEEP** - This is the correct current architecture

---

## 🎯 **Cleanup Action Plan**

### **Phase 1: Immediate Safe Cleanup** (No code changes)

**Nothing to delete yet** - All files have active usage

---

### **Phase 2: DeckFXRack Migration** (After Phase 1.1 Manual Testing)

**Step 1: Audit DeckFXRack.tsx**
```bash
# Read the file to understand FX chain usage
code src/components/studio/core/DeckFXRack.tsx

# Check what features from audio-engine.ts are actually used
```

**Step 2: Refactor DeckFXRack.tsx**
```typescript
// ❌ OLD (legacy Web Audio API)
import { getAudioEngine } from '@/lib/audio-engine';
const engine = getAudioEngine();

// ✅ NEW (Tone.js + DeckEngine)
import { useAudioEngine } from '@/hooks/useAudioEngine';
const { engine } = useAudioEngine();
// Access DeckEngine FX chain via engine.deckEngines.current[deck]
```

**Step 3: Verify & Test**
```bash
npm run build  # Must pass
npm run lint   # Must pass
npm run test   # Must pass

# Manual test: Verify FX rack works in Studio UI
```

**Step 4: Archive Legacy Files**
```bash
# Create archive directory
mkdir -p archive/audio/legacy-engine

# Move legacy files
git mv src/lib/audio-engine.ts archive/audio/legacy-engine/
git mv src/lib/deck-fx-chain.ts archive/audio/legacy-engine/

# Commit
git add -A
git commit -m "refactor: migrate DeckFXRack to Tone.js, archive legacy audio engine

- Refactored DeckFXRack.tsx to use Phase 1.1 DeckEngine FX chain
- Archived legacy Web Audio API engine (src/lib/audio-engine.ts)
- Archived legacy deck-fx-chain.ts (replaced by src/audio/FXChain.ts)
- Verified: npm run build ✅, npm run lint ✅, manual testing ✅"
```

---

### **Phase 3: Audio Utilities Consolidation** (After Phase 1.1 Week 3)

**Step 1: Move audioMath.ts to audio directory**
```bash
mkdir -p src/audio/utils
git mv src/lib/utils/audioMath.ts src/audio/utils/

# Update imports in all files:
# ❌ OLD: from '@/lib/utils/audioMath'
# ✅ NEW: from '@/audio/utils/audioMath'
```

**Step 2: Verify & Test**
```bash
npm run build && npm run lint && npm run test
```

---

## 📋 **File Status Summary**

| File | Type | Status | LOC | Active Imports | Action |
|------|------|--------|-----|----------------|--------|
| `src/lib/audio-engine.ts` | Legacy engine | 🟡 Deprecated | 540 | 1 (DeckFXRack) | ⏳ Archive after refactor |
| `src/lib/deck-fx-chain.ts` | Legacy FX | 🟡 Deprecated | ? | 1 (audio-engine) | ⏳ Archive with audio-engine |
| `src/audio/Engine.ts` | Tone.js wrapper | ✅ Active | 100 | Many | ✅ **KEEP** |
| `src/audio/engines/DeckEngine.ts` | Phase 1.1 engine | ✅ Active | 711 | useAudioEngine | ✅ **KEEP** |
| `src/audio/FXChain.ts` | Tone.js FX | ✅ Active | ? | DeckEngine | ✅ **KEEP** |

---

## 🚦 **Implementation Timeline**

### **Week 1 (Current): Phase 1.1 Days 3-4 Complete**
- ✅ DeckEngine integration complete
- ✅ Event subscriptions connected
- ✅ Verification report created
- ⏳ Manual testing pending (Day 5)

### **Week 2: Phase 1.1 Complete DeckEngine**
- ⏳ EQ, filter, pitch migration
- ⏳ Quantization implementation
- 🚫 **DO NOT** archive legacy files yet

### **Week 3: Phase 1.1 MixerEngine**
- ⏳ Create MixerEngine class
- ⏳ Migrate crossfader, master bus
- ⏳ **AFTER COMPLETE:** Refactor DeckFXRack
- ✅ **THEN:** Archive legacy audio-engine.ts

### **Week 4: Cleanup & Optimization**
- ✅ Archive legacy files
- ✅ Move audioMath.ts to audio/utils/
- ✅ Final verification

---

## ⚠️ **Critical Warnings**

### **DO NOT DELETE before:**
1. ❌ Phase 1.1 manual testing complete (Week 1 Day 5)
2. ❌ Phase 1.1 MixerEngine complete (Week 3)
3. ❌ DeckFXRack.tsx refactored to new architecture
4. ❌ Full regression testing passed

### **Safe Deletion Criteria:**
- ✅ Zero imports from legacy files (verified via grep)
- ✅ DeckFXRack refactored to use DeckEngine FX chain
- ✅ All Phase 1.1 manual tests passing
- ✅ npm run build && npm run lint && npm run test → all pass
- ✅ User approval obtained

---

## 🎯 **Next Steps**

### **Immediate (This Week):**
1. ✅ Review this audit report
2. ⏳ Complete Phase 1.1 Day 5 manual testing
3. ⏳ User approval for cleanup timeline

### **Week 3 (After MixerEngine):**
1. ⏳ Audit DeckFXRack.tsx usage of legacy audio-engine
2. ⏳ Create refactor plan for DeckFXRack
3. ⏳ Implement refactor in small batch
4. ⏳ Archive legacy files

### **Questions for User:**
1. Approve recommended timeline (archive after Week 3)?
2. Should DeckFXRack refactor be part of Phase 1.1 or separate?
3. Any concerns about archiving legacy audio-engine.ts?

---

**End of Audit Report**

**Summary:** 
- 2 legacy files identified (audio-engine.ts, deck-fx-chain.ts)
- Both actively used by 1 component (DeckFXRack.tsx)
- Safe to archive after DeckFXRack refactor (Week 3)
- No immediate deletions recommended
