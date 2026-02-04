# SonarLint Not Updating? Quick Fix

## The Problem
You updated `.vscode/sonarlint.json` but still seeing 213 warnings for rules you disabled (S7773, S7764, S6759, etc.)

**Root Cause:** SonarLint caches rules and doesn't auto-reload when config changes.

---

## ✅ Solution 1: Force Reload (30 seconds)

### Windows/Linux
1. Press `Ctrl+Shift+P`
2. Type: `SonarLint: Clear Analysis Results`
3. Press Enter
4. Type: `Developer: Reload Window`
5. Press Enter

### Mac
1. Press `Cmd+Shift+P`
2. Type: `SonarLint: Clear Analysis Results`
3. Press Enter
4. Type: `Developer: Reload Window`
5. Press Enter

---

## ✅ Solution 2: Manual Restart
Close VS Code completely and reopen it.

---

## Expected Results After Reload

### Before (213 problems)
- ❌ `S7773` (parseInt → Number.parseInt) - **82 occurrences**
- ❌ `S7764` (window → globalThis) - **45 occurrences**
- ❌ `S6759` (Readonly props) - **15 occurrences**
- ❌ `S7748` (1.0 → 1) - **3 occurrences**
- ❌ `S7741` (typeof → undefined) - **3 occurrences**
- ❌ `S7761` (.dataset) - **2 occurrences**
- ❌ `S6571` (union types) - **4 occurrences**
- ✅ Plus ~60 other valid warnings

### After (expect ~50-60 problems)
Only these categories should remain:
- ✅ `S6481` - Context memoization (1-2 occurrences) - **FIX THESE**
- ✅ `S6479` - Array index keys (3-4 occurrences) - **FIX THESE**
- ✅ `S6825` - aria-hidden accessibility (1 occurrence) - **FIX THIS**
- ✅ `S1090` - iframe title (1 occurrence) - **FIX THIS**
- ✅ `S1874` - Deprecated symbols (4 occurrences) - **FIX THESE**
- ✅ `S3776` - Cognitive complexity >25 (2-3 occurrences) - **REFACTOR IF DESIRED**
- ✅ Tailwind suggestions (20-30) - **IGNORE**
- ✅ Other misc warnings (S4325, S6582, etc.) - **IGNORE OR FIX LATER**

---

## Still Not Working?

### Check 1: Verify Config Syntax
Open `.vscode/sonarlint.json` and make sure it's valid JSON (no syntax errors).

### Check 2: SonarLint Extension Version
- Click Extensions icon (left sidebar)
- Search: `SonarLint`
- Check version is **4.x or newer**
- If outdated, click "Update"

### Check 3: Workspace vs User Settings
SonarLint might be reading a **user-level** config that overrides workspace config.

To check:
1. Press `Ctrl+Shift+P` → `Preferences: Open User Settings (JSON)`
2. Search for `sonarlint.rules`
3. If found, **delete it** (workspace config should win)

### Check 4: Connected Mode Override
If you connected SonarLint to a SonarQube/SonarCloud server, it might be pulling rules from there.

To check:
1. Press `Ctrl+Shift+P` → `SonarLint: Manage Connections`
2. If any connections exist, **disconnect** them (unless you need them)
3. Reload window

---

## Quick Verification Command

After reloading, check the Problems panel (`Ctrl+Shift+M`):

**Expected reduction:**
- 213 problems → ~50-60 problems (**70% reduction**)

**If still 200+:**
- SonarLint didn't reload → Try Solution 2 (manual restart)

---

## Priority Fixes (After Reload)

Focus only on these **high-value** warnings:

### 1. Context Memoization (S6481) - Performance Bug
**File:** `src/context/ThemeContext.tsx` line 54

**Before:**
```tsx
<ThemeContext.Provider value={{ theme, setTheme }}>
```

**After:**
```tsx
const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
return <ThemeContext.Provider value={value}>...</ThemeContext.Provider>;
```

### 2. Array Index Keys (S6479) - React Correctness
**Files:**
- `src/components/studio/ui/BeatGrid.tsx` line 113
- `src/components/TrackList.tsx` lines 216, 402

**Before:**
```tsx
items.map((item, index) => <Row key={index} {...item} />)
```

**After:**
```tsx
items.map(item => <Row key={item.id} {...item} />)
```

### 3. aria-hidden on Focusable (S6825) - Accessibility
**File:** `src/components/ImmersivePlayerOverlay.tsx` line 249

**Before:**
```tsx
<button aria-hidden="true" onClick={...}>Icon</button>
```

**After:**
```tsx
<button onClick={...}>Icon</button>
```

### 4. iframe Title (S1090) - Accessibility
**File:** `src/components/VideoModal.tsx` line 153

**Before:**
```tsx
<iframe src="..." />
```

**After:**
```tsx
<iframe src="..." title="Piko Official Video - {videoTitle}" />
```

### 5. Deprecated Symbols (S1874) - Library Updates
**File:** `src/components/layout/MobileNav.tsx` lines 6, 31, 36

**Issue:** `Instagram` and `Youtube` from `lucide-react` are deprecated

**Fix:**
```tsx
// Before
import { Instagram, Youtube } from 'lucide-react';

// After (check lucide-react docs for new names)
import { InstagramIcon, YoutubeIcon } from 'lucide-react';
// Or might be lowercase: instagram, youtube
```

Run `npm list lucide-react` to check installed version, then check [Lucide docs](https://lucide.dev/icons/) for the correct icon names.

---

## Ignore Everything Else

After fixing the 5 categories above, **ignore** all remaining warnings. They're either:
- Tailwind style suggestions (not errors)
- Opinionated style rules (S4325, S6582, S3358, etc.)
- Low-impact code smells

Your build works, your app runs - these are just noise.

---

## TL;DR

1. **Press `Ctrl+Shift+P`**
2. **Type: `SonarLint: Clear Analysis Results`**
3. **Type: `Developer: Reload Window`**
4. **Wait 30 seconds**
5. **Check Problems panel** - should drop from 213 → ~60
6. **Fix only the 5 high-value categories** listed above
7. **Ignore everything else**

Done! 🎯
