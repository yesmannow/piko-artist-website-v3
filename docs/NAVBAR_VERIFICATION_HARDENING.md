# NavBar Verification & Hardening Guide

## 🎯 Goal
Make NavBar fully interactive on both local dev and production deployment with zero hydration mismatches, runtime errors, or stale service worker issues.

---

## 📋 Quick Triage (2-Minute Diagnosis)

### Step 1A: Confirm NavBar Actually Hydrates

**Temporarily add this inside the NavBar component body:**

```tsx
useEffect(() => {
  console.log("[NavBar] hydrated/mounted");
}, []);
```

**Diagnosis:**
- ✅ **If you see the log in browser console** → NavBar hydrated successfully; proceed to Step 1B (runtime errors)
- ❌ **If you do NOT see the log** → NavBar is not hydrating (client boundary issue); proceed to Step 2

### Step 1B: Check for Runtime Errors (If Hydration Worked)

**Open DevTools Console** and look for red errors. Even one error early can break click handlers across the page.

**Common culprits:**
- `window is not defined` / `localStorage is not defined` (module-scope access)
- A component imported by NavBar that crashes on mount
- Stale service worker caching old chunks (see Step 3)

---

## 🔧 Step 2: Fix Client Boundary (Most Common Issue)

### Required Checks

1. **NavBar file must start with `"use client"` as the first statement**
   - ✅ Current: `src/components/layout/NavBar.tsx` has `"use client"` on line 2 (correct)
   - ❌ **Bad:** Any imports before `"use client"`
   - ✅ **Good:** `"use client"` is the first statement

2. **All imported components must be client-safe**
   - Check: `LabsToggle`, `Sheet` components, `useUIStore`
   - ✅ `LabsToggle.tsx` has `"use client"` ✓
   - ✅ `useUIStore` uses Zustand with `persist` (localStorage only in effects) ✓
   - ✅ `Sheet` from shadcn/ui is client-safe ✓

3. **No module-scope `window`/`localStorage` access**
   - ✅ Current NavBar: `window.addEventListener` is inside `useEffect` (correct)
   - ✅ `useUIStore` uses `createJSONStorage(() => localStorage)` which is safe
   - ❌ **Bad:** `const width = window.innerWidth` at module scope
   - ✅ **Good:** Access inside `useEffect` or use `typeof window !== 'undefined'` checks

### Verification Checklist

```tsx
// ✅ CORRECT - NavBar.tsx
"use client";  // First statement

import Link from "next/link";
// ... rest of imports

// ✅ CORRECT - window access in useEffect
useEffect(() => {
  const handler = (e: KeyboardEvent) => { /* ... */ };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [router]);
```

---

## 📱 Step 3: Mobile Menu Reliability (shadcn Sheet)

### Current Implementation Status

✅ **Using shadcn Sheet** (correct approach)
- `Sheet`, `SheetTrigger`, `SheetContent` from `@/components/ui/sheet`
- `SheetTrigger` uses `asChild` prop (correct)
- Sheet closes on pathname change via `useEffect`

### Potential Issues to Check

1. **Overlay blocking pointer events**
   - Ensure no `pointer-events: none` on the button
   - Check z-index conflicts (NavBar is `z-[101]`)

2. **Sheet state management**
   - ✅ Current: `const [sheetOpen, setSheetOpen] = useState(false)`
   - ✅ Closes on navigation: `useEffect(() => setSheetOpen(false), [pathname])`

3. **Button accessibility**
   - ✅ Current: `aria-label="Toggle navigation"` present
   - ✅ Button has proper className for touch targets

### If Sheet Still Doesn't Work

This points back to:
- Hydration/runtime errors (Step 1B)
- Stale service worker (Step 4)
- Not the Sheet component itself

---

## 🔄 Step 4: PWA / Service Worker Sanity Check

### If NavBar Works Locally But Broken on Deployed Site

**This is VERY LIKELY a stale service worker issue.**

### Immediate Fix (One-Time)

1. **Chrome DevTools → Application → Service Workers**
   - Click "Unregister" for any active service workers

2. **Application → Storage → Clear site data**
   - Check all boxes
   - Click "Clear site data"

3. **Hard reload**
   - `Ctrl+Shift+R` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)

### Production-Safe Service Worker Strategy (Serwist)

**Current Setup:** Using `@serwist/next` with Serwist

**Service Worker Files:**
- `src/app/sw.ts` - Service worker entry point
- `next.config.mjs` - Serwist configuration
- `src/components/shared/ServiceWorkerRegistration.tsx` - SW registration component

**Current Caching Strategy:**
- ✅ `/worklets/*` and `/studio*` routes: **NetworkOnly** (preserves COOP/COEP headers)
- ✅ Next.js static chunks: **StaleWhileRevalidate** (7 days)
- ✅ Audio files: **CacheFirst** with limits (prevents QuotaExceededError)
- ✅ 3D assets (.glb): **CacheFirst** (30 days, 4 entries max)
- ✅ WASM files: **CacheFirst** (30 days)

**Serwist Auto-Update Behavior:**
- Serwist automatically handles service worker updates
- New service workers activate on next navigation (not immediately)
- `ServiceWorkerRegistration.tsx` includes cache purge logic on first load

**If NavBar is Broken Due to Stale SW:**

1. **Immediate Fix (One-Time):**
   - Chrome DevTools → Application → Service Workers → Unregister
   - Application → Storage → Clear site data
   - Hard reload (`Ctrl+Shift+R`)

2. **Force Service Worker Update (Development):**
   ```typescript
   // In ServiceWorkerRegistration.tsx, the purge logic should handle this
   // But if needed, you can manually trigger:
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.getRegistrations().then(registrations => {
       registrations.forEach(reg => reg.unregister());
     });
     caches.keys().then(keys => {
       keys.forEach(key => caches.delete(key));
     });
   }
   ```

3. **Production Update Strategy:**
   - Serwist automatically precaches new chunks on deploy
   - Service worker updates activate on next page navigation
   - If stale chunks persist, the cache purge in `ServiceWorkerRegistration.tsx` should handle it

**Check Service Worker Status:**
```bash
# Check Serwist config
cat next.config.mjs | grep -A 5 "withSerwist"

# Check service worker file
cat src/app/sw.ts | head -50
```

---

## 🛠️ Step 5: Runtime Error Sweep

### Common Module-Scope Errors

**❌ BAD:**
```tsx
// At module scope (outside component)
const width = window.innerWidth;  // Crashes on server
const token = localStorage.getItem('token');  // Crashes on server
```

**✅ GOOD:**
```tsx
// Inside component or hook
useEffect(() => {
  const width = window.innerWidth;
  // ...
}, []);

// Or with guard
if (typeof window !== 'undefined') {
  // Safe to access window
}
```

### Check All NavBar Dependencies

1. **`useUIStore`** - Uses Zustand `persist` with `localStorage`
   - ✅ Safe: `createJSONStorage(() => localStorage)` is lazy
   - ✅ Safe: `onRehydrateStorage` checks `typeof window !== 'undefined'`

2. **`LabsToggle`** - Client component, no server-side access

3. **`Sheet` components** - shadcn/ui components are client-safe

4. **`usePathname`, `useRouter`** - Next.js hooks, client-safe

### Run Error Check

```bash
# Build and check for errors
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check for console errors in browser
# Open DevTools → Console → Look for red errors on page load
```

---

## ✅ Step 6: Complete Verification Checklist

### Pre-Deployment Checks

- [ ] **Client Boundary**
  - [ ] `"use client"` is first statement in NavBar.tsx
  - [ ] All imported components are client-safe
  - [ ] No module-scope `window`/`localStorage` access

- [ ] **Hydration Probe**
  - [ ] Added `useEffect(() => console.log("[NavBar] hydrated"), [])`
  - [ ] Log appears in browser console
  - [ ] Remove probe after verification

- [ ] **Runtime Errors**
  - [ ] DevTools Console shows no red errors
  - [ ] All TypeScript errors resolved (`npx tsc --noEmit`)
  - [ ] Build passes (`npm run build`)

- [ ] **Mobile Menu**
  - [ ] Sheet opens/closes correctly
  - [ ] Sheet closes on navigation
  - [ ] Button is clickable (no overlay blocking)
  - [ ] `SheetTrigger` uses `asChild` prop

- [ ] **Labs Toggle**
  - [ ] Toggle works in desktop nav
  - [ ] Toggle works in mobile drawer
  - [ ] State persists across page reloads
  - [ ] No hydration mismatch warnings

- [ ] **Service Worker**
  - [ ] Service worker strategy documented
  - [ ] Cache versioning implemented (if using PWA)
  - [ ] Stale cache clearing process documented

### Post-Deployment Checks

- [ ] **Production Verification**
  - [ ] NavBar renders correctly on deployed site
  - [ ] Mobile menu works on deployed site
  - [ ] Labs toggle works on deployed site
  - [ ] No console errors on deployed site
  - [ ] Hard reload (`Ctrl+Shift+R`) doesn't break functionality

---

## 🔐 Critical Security Item

**⚠️ IMPORTANT: Rotate Exposed API Tokens**

If you pasted real API tokens earlier (Cloudflare/Brave/GitHub PAT), even if moved to `.env.local`:

1. **Rotate/revoke those tokens immediately**
2. **Replace with new tokens**
3. **Never commit tokens to git**

---

## 📝 Follow-Up Prompt for Cursor

**Copy-paste this into Cursor to systematically fix NavBar:**

```
You are working in a Next.js App Router repo. The NavBar renders but interactions are still broken (mobile menu button, Labs toggle, active state updates).

Goal: make NavBar fully interactive on both local dev and production deployment with zero hydration mismatches.

Do the following in order:

1) Verify NavBar is a Client Component:
   - Ensure "use client" is the first statement in the NavBar module (no imports above it).
   - Ensure any component/hooks NavBar imports that use React hooks are client-safe.

2) Add a temporary hydration probe:
   - Add useEffect(() => console.log("[NavBar] hydrated/mounted"), []) and confirm it logs in the browser.
   - If it doesn't log, find why hydration is blocked (server boundary or runtime error before mount).

3) Runtime error sweep:
   - Run the app, open DevTools console, fix any red errors that appear on load.
   - Especially eliminate any module-scope window/localStorage references.

4) Mobile menu reliability:
   - Use shadcn/ui Sheet for the drawer.
   - Ensure Sheet open state closes on pathname change.
   - Ensure SheetTrigger uses asChild around the button and the button has no overlay blocking pointer events.

5) PWA / Service worker sanity:
   - If a service worker is present, ensure it cannot serve stale Next chunks indefinitely.
   - Add a safe update strategy (skipWaiting/clientsClaim or versioned cache) OR document a clear dev/prod reset step.

6) Verification:
   - npm run lint
   - npm run build
   - Provide a short summary of what was changed and why, and list exact files modified.

One critical security item (do this even if everything else is perfect):
   - If real API tokens were pasted earlier, rotate/revoke those tokens now and replace with new ones.
```

---

## 🐛 PowerShell Notes (Windows)

### Avoid These Common Pitfalls

**❌ BAD (PowerShell 5.1):**
```powershell
# && / || are PowerShell 7 operators, not PowerShell 5.1
npm run build && npm run lint

# if exist is cmd.exe syntax
if exist file.txt (echo "exists")
```

**✅ GOOD (PowerShell 5.1):**
```powershell
# Use semicolon for command chaining
npm run build; npm run lint

# Use Test-Path for file checks
if (Test-Path "file.txt") { Write-Host "exists" }

# Or use PowerShell 7+ if available
pwsh -c "npm run build && npm run lint"
```

---

## 📦 Vercel Deploy Safety (Large Assets)

### 100MB Upload Limit

If you hit Vercel's 100MB upload limit:

1. **Keep large assets out of deployment bundle:**
   - `.glb` models → External CDN (Cloudflare R2, AWS S3)
   - `.mp3` stems → External storage
   - `.wasm` files → External CDN

2. **Use environment variables for asset URLs:**
   ```env
   NEXT_PUBLIC_CDN_URL=https://cdn.example.com
   ```

3. **Load assets at runtime:**
   ```tsx
   const modelUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/models/deck.glb`;
   ```

---

## 📊 Summary: What to Change

### Files to Verify/Modify

1. **`src/components/layout/NavBar.tsx`**
   - ✅ Already has `"use client"` as first statement
   - ✅ Window access is in `useEffect`
   - ⚠️ Add hydration probe temporarily for verification

2. **`src/components/ui/LabsToggle.tsx`**
   - ✅ Already has `"use client"`
   - ✅ No module-scope issues

3. **`src/store/useUIStore.ts`**
   - ✅ Zustand persist is safe (lazy localStorage access)
   - ✅ `onRehydrateStorage` has window guard

4. **Service Worker Config** (if exists)
   - ⚠️ Check `next.config.js` or `next.config.mjs` for PWA config
   - ⚠️ Implement cache versioning if using PWA

### Expected Changes

- **Minimal changes needed** (NavBar is already well-structured)
- **Add hydration probe** (temporary, remove after verification)
- **Document service worker strategy** (if PWA is used)
- **Verify no runtime errors** in console

---

## 🎯 Success Criteria

✅ NavBar fully interactive:
- Mobile menu opens/closes
- Labs toggle works (desktop + mobile)
- Active state updates on navigation
- No console errors
- No hydration warnings
- Works on deployed site after hard reload

---

**Last Updated:** Based on current NavBar implementation analysis
**Status:** Ready for systematic verification
