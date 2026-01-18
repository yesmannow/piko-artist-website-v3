# Scroll Restoration Verification Checklist

**Component**: `ScrollRestorationManager.tsx`
**Purpose**: Fix sporadic blank/black screens after navigating from `/videos` by ensuring each route starts at `scrollTop=0` and preventing Lenis momentum from carrying into the next route.

---

## Pre-Deployment Verification

### ✅ Basic Navigation Tests

#### Test 1: Videos → Music Navigation
- [ ] Navigate to `/videos`
- [ ] Scroll down to near the bottom of the page
- [ ] Click navigation link to `/music`
- [ ] **Expected**: Page loads at top (scrollTop=0), no blank screen
- [ ] **Verify**: Content is immediately visible

#### Test 2: Rapid Navigation
- [ ] Navigate quickly between multiple pages:
  - `/` → `/videos` → `/music` → `/tour` → `/beatmaker` → `/`
- [ ] **Expected**: Each page loads at top, no blank screens
- [ ] **Verify**: No visual glitches or content jumping

#### Test 3: Videos → Other Routes
- [ ] Navigate to `/videos`
- [ ] Scroll to middle of page
- [ ] Navigate to `/music`
- [ ] Navigate to `/tour`
- [ ] Navigate to `/beatmaker`
- [ ] **Expected**: All subsequent pages load at top
- [ ] **Verify**: No blank screens on any route

---

### ✅ Modal Integration Tests

#### Test 4: Modal Scroll Lock
- [ ] Open any modal (e.g., video player, event modal)
- [ ] **Expected**: Lenis is paused/stopped while modal is open
- [ ] **Verify**: Cannot scroll page content behind modal
- [ ] Close modal
- [ ] **Expected**: Lenis resumes, scrolling works normally

#### Test 5: Modal Close on Route Change
- [ ] Open a modal (e.g., event modal on `/tour`)
- [ ] Navigate to another route (e.g., `/music`)
- [ ] **Expected**:
  - Modal closes (existing behavior)
  - Page loads at top
  - No blank screen
- [ ] **Verify**: Navigation works smoothly

#### Test 6: Multiple Modals
- [ ] Open video player modal
- [ ] Open event modal (if applicable)
- [ ] **Expected**: Lenis remains stopped
- [ ] Close all modals
- [ ] **Expected**: Lenis resumes

---

### ✅ Smooth Scrolling Tests

#### Test 7: Anchor Links Still Work
- [ ] Navigate to home page (`/`)
- [ ] Click "About" link (should scroll to `#rap-sheet`)
- [ ] **Expected**: Smooth scroll to section with offset
- [ ] **Verify**: Navbar scroll-to-section still works

#### Test 8: Logo Click Scroll
- [ ] Scroll down on home page
- [ ] Click logo
- [ ] **Expected**: Smooth scroll to top
- [ ] **Verify**: Logo scroll behavior unchanged

---

### ✅ Edge Cases

#### Test 9: Browser Back/Forward
- [ ] Navigate: `/` → `/videos` → `/music`
- [ ] Use browser back button
- [ ] **Expected**: `/videos` loads at top
- [ ] Use browser forward button
- [ ] **Expected**: `/music` loads at top

#### Test 10: Direct URL Navigation
- [ ] Type `/videos` directly in address bar
- [ ] **Expected**: Page loads at top
- [ ] Navigate to another route
- [ ] **Expected**: New route loads at top

#### Test 11: Page Refresh
- [ ] Navigate to `/videos` and scroll down
- [ ] Refresh page (F5 or Cmd+R)
- [ ] **Expected**: Page loads at top (browser default behavior)
- [ ] **Verify**: No blank screen

---

### ✅ Performance Tests

#### Test 12: Rapid Clicking
- [ ] Rapidly click between navigation links (5-10 times quickly)
- [ ] **Expected**:
  - No console errors
  - Each page loads correctly
  - No blank screens
  - No infinite loops

#### Test 13: Scroll During Navigation
- [ ] Start scrolling on `/videos`
- [ ] Immediately click navigation link to `/music`
- [ ] **Expected**:
  - Scroll momentum is stopped
  - `/music` loads at top
  - No blank screen

---

### ✅ Visual/UX Tests

#### Test 14: Page Transitions
- [ ] Navigate between pages
- [ ] **Expected**:
  - PageTransition animations still work
  - No visual glitches
  - Smooth transitions

#### Test 15: Navbar Interaction
- [ ] Navigate to any page
- [ ] Click navbar links
- [ ] **Expected**:
  - Navbar remains clickable
  - Navigation works immediately
  - No delays or freezes

#### Test 16: Mobile Navigation
- [ ] Test on mobile device or mobile viewport
- [ ] Navigate: `/videos` → scroll down → navigate to `/music`
- [ ] **Expected**:
  - Mobile nav works
  - Pages load at top
  - No blank screens

---

## Console Verification

### ✅ Development Mode Checks

When running in development (`npm run dev`), check browser console:

- [ ] Look for `[ScrollRestorationManager]` debug logs on route changes
- [ ] **Expected**: Debug logs show route changes (e.g., `/videos -> /music`)
- [ ] **Verify**: No errors related to Lenis API calls
- [ ] **Verify**: No errors related to scroll reset

### ✅ Production Mode Checks

When running in production (`npm run build && npm start`):

- [ ] **Expected**: No console logs (debug logs are disabled)
- [ ] **Verify**: No console errors
- [ ] **Verify**: No warnings

---

## Technical Verification

### ✅ Code Quality

- [ ] Run `npm run lint`
- [ ] **Expected**: No linting errors
- [ ] Run `npx tsc --noEmit`
- [ ] **Expected**: No TypeScript errors

### ✅ Build Verification

- [ ] Run `npm run build`
- [ ] **Expected**: Build succeeds
- [ ] **Verify**: No build-time errors related to ScrollRestorationManager

---

## Known Behaviors

### ✅ Expected Behavior

1. **Route Changes**: Every route change triggers scroll-to-top
2. **Lenis Control**: Lenis is stopped before reset, then resumed after
3. **Modal Awareness**: Lenis pauses when modals are open
4. **Multiple Resets**: Scroll reset runs multiple times (immediate, RAF, setTimeout) for reliability
5. **Manual Scroll Restoration**: Browser's automatic scroll restoration is disabled

### ⚠️ Notes

- The component uses multiple scroll reset methods for maximum reliability
- Modal detection uses both MutationObserver and polling (100ms interval) as backup
- Debug logs only appear in development mode
- The component returns `null` (no visual output)

---

## Troubleshooting

### If blank screens still occur:

1. **Check Console**: Look for Lenis API errors
2. **Check Lenis Version**: Verify `lenis` package version supports `stop()` and `start()` methods
3. **Check Modal Detection**: Verify `data-modal-open="true"` is set on modals
4. **Check Route Changes**: Verify `usePathname()` is detecting route changes correctly

### If smooth scrolling breaks:

1. **Check Lenis Resume**: Verify Lenis is resuming after scroll reset
2. **Check Modal State**: Ensure modals are not keeping Lenis stopped
3. **Check Navbar**: Verify anchor link scrolling still works

### If modals don't lock scroll:

1. **Check Modal Attributes**: Verify modals have `data-modal-open="true"`
2. **Check Observer**: Verify MutationObserver is working
3. **Check Console**: Look for observer errors

---

## Success Criteria

✅ **All tests pass**
✅ **No blank screens on any route**
✅ **Pages always load at top**
✅ **Modals lock scroll correctly**
✅ **Smooth scrolling still works**
✅ **No console errors**
✅ **No performance issues**

---

**Last Updated**: 2024-12-19
**Component**: `ScrollRestorationManager.tsx`
**Integration**: `src/app/layout.tsx` (inside `<SmoothScroll>`)

