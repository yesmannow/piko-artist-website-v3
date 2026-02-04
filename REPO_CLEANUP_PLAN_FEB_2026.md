# Repository Cleanup Plan — February 4, 2026

**Problem:** 456+ markdown files across the repository, 60 in root alone
**Goal:** Reduce to essential docs only, archive historical phase docs
**Estimated Reduction:** ~90% of docs can be archived/removed

---

## 📊 Current State Analysis

### Root Directory (60 .md files)
**Categories:**
- Phase completion docs (PHASE_*.md): ~35 files
- Audit reports: ~8 files
- Feature-specific: ~10 files
- Essential: ~7 files

### /docs Directory (~70 .md files)
**Categories:**
- Historical phase docs
- Quick references (many outdated)
- Completion summaries
- Visual guides

### /audit Directory (~9 files)
**Categories:**
- Audit reports
- Tool installation guides
- Fix action plans

---

## ✅ Files to KEEP (Essential)

### Root Directory
```
✅ README.md                     # Main project readme
✅ CONTRIBUTING.md               # Contributor guide
✅ LICENSE                       # License file
✅ AUDIO_ENGINE_README.md        # Core architecture doc
✅ MANUAL_TEST_INSTRUCTIONS.md   # Testing guide
✅ R2_CORS_SETUP.md              # Deployment requirement
```

### /docs Directory
```
✅ docs/DEVELOPER_ONBOARDING.md       # New dev guide
✅ docs/how-to-add-tracks.md          # Essential workflow
✅ docs/KEYBOARD_SHORTCUTS_REFERENCE.md
✅ docs/STUDIO_ENV_VARS.md            # Deployment config
✅ docs/SONARLINT_GUIDE.md            # Dev tooling
```

### Create New Consolidated Docs
```
📝 docs/ARCHITECTURE.md          # Consolidate phase architecture learnings
📝 docs/QUICK_REFERENCE.md       # Consolidate all quick refs
📝 docs/DEPLOYMENT.md            # Consolidate deployment guides
```

**Total Essential:** ~12 files

---

## 🗄️ Files to ARCHIVE

### Strategy
Move historical phase completion docs to `/docs/archive/phases/`

### Root → Archive
```
PHASE1_ANALYSIS.md                      → docs/archive/phases/
PHASE1_COMPLETE.md                      → docs/archive/phases/
PHASE2_SUMMARY.md                       → docs/archive/phases/
PHASE2_VISUAL_REFERENCE.md              → docs/archive/phases/
PHASE_1.1_DAYS_3-4_VERIFICATION.md      → docs/archive/phases/
PHASE_1_IMPLEMENTATION_GUIDE.md         → docs/archive/phases/
PHASE_3_FX_CONSOLIDATION_COMPLETE.md    → docs/archive/phases/
PHASE_3_IMPLEMENTATION_SUMMARY.md       → docs/archive/phases/
PHASE_3_QUICK_REFERENCE.md              → docs/archive/phases/
PHASE_3_VERIFICATION_REPORT.md          → docs/archive/phases/
PHASE_3.3B_COMPLETE.md                  → docs/archive/phases/
PHASE_4_JOGWHEEL_REDESIGN_COMPLETE.md   → docs/archive/phases/
PHASE_4_QUICK_REFERENCE.md              → docs/archive/phases/
PHASE_5_IMPLEMENTATION_SUMMARY_FEB_2026.md → docs/archive/phases/
PHASE_5_MOBILE_STUDIO_COMPLETE.md       → docs/archive/phases/
PHASE_5_PRODUCT_COMPLETE.md             → docs/archive/phases/
PHASE_5_QUICK_REFERENCE.md              → docs/archive/phases/
PHASE_S1_QUICK_REFERENCE.md             → docs/archive/phases/
PHASE_S1_STUDIO_STABILITY_COMPLETE.md   → docs/archive/phases/
PHASE_S2_SEND_EMAIL_REFACTOR_COMPLETE.md → docs/archive/phases/
PHASE_S4_PREVENTION_SYSTEM_COMPLETE.md  → docs/archive/phases/
PHASE_S4_QUICK_REFERENCE.md             → docs/archive/phases/
PHASE_S5_CLEANUP_COMPLETE.md            → docs/archive/phases/
PHASE_S5_QUICK_REFERENCE.md             → docs/archive/phases/
PHASE_S6_MOBILE_WAVESURFER_COMPLETE.md  → docs/archive/phases/
PHASE_S7_MIXER_SETTINGS.md              → docs/archive/phases/
PHASE_S7_S8_COMPLETION_SUMMARY.md       → docs/archive/phases/
PHASE_S7_S8_QUICK_REFERENCE.md          → docs/archive/phases/
PHASE_S8_INSIGHTS.md                    → docs/archive/phases/
PHASE_S11_2_PART_1_TRACKKEY_COMPLETE.md → docs/archive/phases/
PHASE_S11_2_QUICK_REFERENCE.md          → docs/archive/phases/
```

### Audit Reports → Archive
```
AUDIT_AND_FIX_SUMMARY.md                → docs/archive/audits/
AUDIT_SESSION_SUMMARY_FEB_2026.md       → docs/archive/audits/
COMPREHENSIVE_AUDIT_REPORT_FEB_2026.md  → docs/archive/audits/
CRITICAL_FIXES_APPLIED_FEB_2026.md      → docs/archive/audits/
IMMEDIATE_FIX_REQUIRED.md               → docs/archive/audits/
PRIORITY_1_RUNTIME_BLOCKERS_FIX.md      → docs/archive/audits/
```

### Feature Completion → Archive
```
308_REDIRECT_MIGRATION_COMPLETE.md      → docs/archive/features/
KEYBOARD_SHORTCUTS_COMPLETE.md          → docs/archive/features/
KEYBOARD_SHORTCUTS_SUMMARY.md           → docs/archive/features/
LIBRARY_COLLAPSIBLE_COMPLETE.md         → docs/archive/features/
LIBRARY_COLLAPSIBLE_SUMMARY.md          → docs/archive/features/
PREFLIGHT_HARDENING_COMPLETE.md         → docs/archive/features/
PREFLIGHT_SUMMARY.md                    → docs/archive/features/
PREFLIGHT_TESTING_CHECKLIST.md          → docs/archive/features/
STUDIO_LOCAL_ASSETS_AUDIT_REPORT.md     → docs/archive/features/
STUDIO_LOCAL_ASSETS_FINAL_CHECKLIST.md  → docs/archive/features/
STUDIO_LOCAL_ASSETS_IMPLEMENTATION_SUMMARY.md → docs/archive/features/
STUDIO_LOCAL_ASSETS_TEST_PLAN.md        → docs/archive/features/
STUDIO_RESTRUCTURE_COMPLETE.md          → docs/archive/features/
STUDIO_RESTRUCTURE_SUMMARY.md           → docs/archive/features/
STUDIO_TRANSFORMATION_QUICK_REFERENCE.md → docs/archive/features/
STUDIO_TRANSFORMATION_ROADMAP_2026.md   → docs/archive/features/
VERCEL_DEPLOYMENT_AUDIT_GUIDE.md        → docs/archive/deployment/
SMOKE_TEST_CHECKLIST.md                 → docs/archive/testing/
```

**Total to Archive:** ~50 root files

---

## 🗑️ Files to DELETE

### Duplicate/Obsolete Docs
```
❌ docs/AUDIT_FIXES_APPLIED.md         # Duplicate (also in /audit)
❌ docs/AUDIT_IMPLEMENTATION_COMPLETE.md # Historical
❌ docs/AUDIT_REPORT_2026.md           # Historical
❌ docs/CHANGELOG_PHASE_VIII.md        # Old changelog
❌ docs/INTEGRATION_VERIFICATION_COMPLETE.md # Historical
❌ docs/MASTERPIECE_RECOVERY_COMPLETE.md # Historical event
❌ docs/PRE_MERGE_CHECKLIST.md         # One-time checklist
❌ docs/R2_CONNECTION_TEST_RESULTS.md  # Test results (historical)
```

### Obsolete Quick References (Consolidate to One)
```
❌ docs/PHASE_3.3B_QUICK_REFERENCE.md
❌ docs/PHASE_6_QUICK_REFERENCE.md
❌ docs/PHASE_II_QUICK_REFERENCE.md
❌ docs/PHASE_IX5_QUICK_REFERENCE.md
❌ docs/PHASE_VB_QUICK_REFERENCE.md
❌ docs/PHASE_VII_QUICK_REFERENCE.md
❌ docs/PHASE_X_QUICK_REFERENCE.md
❌ docs/STEMRACK_QUICK_REFERENCE.md
```

### Phase Completion Docs (Move to Archive First)
```
❌ docs/PHASE2_MIXER_FIRST_COMPLETE.md
❌ docs/PHASE_3.1_TRANSPORT_STRIP_COMPLETE.md
❌ docs/PHASE_3.2A_DRAG_DROP_COMPLETE.md
❌ docs/PHASE_3.3B_COMPLETION_SUMMARY.md
❌ docs/PHASE_II_COMPLETION_SUMMARY.md
❌ docs/PHASE_IV_IMPLEMENTATION_COMPLETE.md
❌ docs/PHASE_IX5_COMPLETION_SUMMARY.md
❌ docs/PHASE_IX_COMPLETION_SUMMARY.md
❌ docs/PHASE_S11_3_COMPLETE_SUMMARY.md
❌ docs/PHASE_VB_PER_DECK_FX_COMPLETE.md
❌ docs/PHASE_VIII_COMPLETION_SUMMARY.md
❌ docs/PHASE_VII_COMPLETE.md
❌ docs/PHASE_VII_IMPLEMENTATION_SUMMARY.md
❌ docs/PHASE_VI_COMPLETION_SUMMARY.md
❌ docs/PHASE_X5_2026_FINALIZATION_SUMMARY.md
❌ docs/PHASE_X_MOBILE_MASTERY_COMPLETE.md
```

**Total to Delete (after archive):** ~40 files

---

## 📝 New Consolidated Docs to Create

### 1. docs/ARCHITECTURE.md
**Consolidates:**
- AUDIO_ENGINE_README.md (root)
- docs/AUDIO_ENGINE_CORE.md
- docs/PHASE_V_STRUCTURAL_REDESIGN.md
- Key architecture decisions from phase docs

**Sections:**
- Audio Engine (Tone.js architecture)
- Component Hierarchy
- State Management (Zustand stores)
- WaveSurfer Integration
- Stem Processing
- FX Routing

### 2. docs/QUICK_REFERENCE.md
**Consolidates all Quick Reference docs:**
- Keyboard shortcuts
- Deck controls
- Mixer controls
- FX rack controls
- Library shortcuts
- Stem controls
- Jogwheel controls

### 3. docs/DEPLOYMENT.md
**Consolidates:**
- R2_CORS_SETUP.md
- VERCEL_DEPLOYMENT_AUDIT_GUIDE.md
- docs/STUDIO_ENV_VARS.md
- docs/PHASE_VII_DEPLOYMENT_CHECKLIST.md

**Sections:**
- Environment variables
- Cloudflare R2 setup
- Vercel deployment
- Supabase configuration
- Production checklist

### 4. docs/TESTING.md
**Consolidates:**
- MANUAL_TEST_INSTRUCTIONS.md
- SMOKE_TEST_CHECKLIST.md
- docs/S11_TESTING_GUIDE.md

**Sections:**
- Unit tests (Vitest)
- E2E tests (Playwright)
- Manual smoke tests
- Studio feature testing
- Mobile testing

---

## 📁 Proposed Final Structure

```
/
├── README.md                    ✅ Main readme
├── CONTRIBUTING.md              ✅ How to contribute
├── LICENSE                      ✅ MIT License
│
├── docs/
│   ├── ARCHITECTURE.md          📝 NEW: System architecture
│   ├── QUICK_REFERENCE.md       📝 NEW: All keyboard/control shortcuts
│   ├── DEPLOYMENT.md            📝 NEW: Deployment guide
│   ├── TESTING.md               📝 NEW: Testing guide
│   ├── DEVELOPER_ONBOARDING.md  ✅ New developer guide
│   ├── how-to-add-tracks.md     ✅ Track workflow
│   ├── SONARLINT_GUIDE.md       ✅ Dev tooling
│   │
│   └── archive/
│       ├── phases/              🗄️ Historical phase completion docs
│       ├── audits/              🗄️ Historical audit reports
│       ├── features/            🗄️ Feature implementation docs
│       ├── deployment/          🗄️ Old deployment guides
│       └── testing/             🗄️ Old test plans
│
└── audit/
    ├── REPO_AUDIT_FEB_4_2026.md ✅ Latest audit
    └── [tool outputs]           ✅ circularity, unused exports, etc.
```

**Result:** ~10 essential docs + archive for historical reference

---

## 🎯 Benefits

### 1. Developer Experience
- **Before:** 456 docs, unclear which are current
- **After:** ~10 docs, all current and consolidated

### 2. Maintainability
- Single source of truth for architecture
- One quick reference instead of 8+
- Clear deployment guide
- Archived history available if needed

### 3. Onboarding
- New devs see essentials immediately
- No confusion about which phase doc to read
- Clear path: README → ARCHITECTURE → QUICK_REFERENCE

### 4. Repository Health
- Cleaner root directory
- Faster file searches
- Reduced cognitive load
- Git operations faster (fewer files tracked)

---

## ✅ Execution Plan

### Phase 1: Create New Consolidated Docs
1. ✅ Create docs/ARCHITECTURE.md
2. ✅ Create docs/QUICK_REFERENCE.md
3. ✅ Create docs/DEPLOYMENT.md
4. ✅ Create docs/TESTING.md

### Phase 2: Archive Historical Docs
1. ✅ Create docs/archive/ subdirectories
2. ✅ Move phase completion docs → docs/archive/phases/
3. ✅ Move audit reports → docs/archive/audits/
4. ✅ Move feature docs → docs/archive/features/
5. ✅ Move deployment guides → docs/archive/deployment/
6. ✅ Move test plans → docs/archive/testing/

### Phase 3: Delete Obsolete Docs
1. ✅ Delete duplicate docs
2. ✅ Delete obsolete quick references (now consolidated)
3. ✅ Delete one-time checklists (historical)

### Phase 4: Verify & Update README
1. ✅ Update README.md links to new docs
2. ✅ Add "Documentation" section
3. ✅ Build passes
4. ✅ No broken links

---

## 🚀 Ready to Execute?

**Estimated Time:** 30-45 minutes
**Risk:** Low (archiving preserves all content)
**Benefit:** Massive improvement in repo clarity

**Command to start:**
```bash
# Create archive structure
mkdir -p docs/archive/{phases,audits,features,deployment,testing}

# Then run automated archival script (to be created)
```

---

**Status:** PLAN READY ✅
**Awaiting Approval:** Yes
**Rollback Available:** Yes (Git history)
