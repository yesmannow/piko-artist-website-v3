# DJ Mixer UI Improvements - Implementation Notes

## Overview
This document outlines the changes made to fix z-index/layering bugs in the DJ mixer interface and improve overall layout and styling.

## Changes Made

### 1. Standardized Z-Index System

**File: `tailwind.config.ts`**

Added z-index tokens to Tailwind configuration:
- `z-base`: 0 (default)
- `z-nav`: 50 (navigation)
- `z-player`: 80 (audio players)
- `z-player-overlay`: 100 (player overlays)
- `z-overlay`: 200 (general overlays)
- `z-modal`: 300 (modals and lightboxes)
- `z-toast`: 400 (notifications/toasts)

**Usage:**
```tsx
className="z-modal"  // Instead of z-[300] or z-[100]
className="z-overlay"  // Instead of z-[200] or z-50
```

### 2. OverlayShell Component

**File: `src/components/ui/OverlayShell.tsx`**

Created a standardized overlay component with:
- Portal rendering to `document.body` (avoids stacking context traps)
- Consistent z-index system (`z-overlay` or `z-modal`)
- Automatic scroll lock via `useBodyScrollLock` hook
- ESC key handling
- Backdrop click to close
- Sets `data-modal-open="true"` on body when open
- Proper pointer-events handling

**Features:**
- Renders via `createPortal` to avoid parent stacking contexts
- Handles scroll lock automatically
- Supports custom backdrop or default dark backdrop
- Mobile-friendly with proper touch targets

### 3. Fixed Album Art Lightbox

**File: `src/components/DJInterface.tsx`**

**Before:**
- Lightbox rendered inline with `z-[100]`
- No portal, trapped in parent stacking contexts
- Manual ESC handler
- Inconsistent sizing

**After:**
- Uses `OverlayShell` with `z="modal"` (z-index 300)
- Renders via portal to `document.body`
- Automatic ESC handling via OverlayShell
- Responsive sizing:
  - Desktop: `max-w-[min(92vw,900px)] max-h-[80vh]`
  - Mobile: `max-w-[92vw] max-h-[70vh]`
- Added track title and artist caption
- Close button always visible and accessible

### 4. Fixed JogWheel Lightbox

**File: `src/components/dj-ui/JogWheel.tsx`**

**Before:**
- Lightbox rendered inline with `z-50`
- No portal
- Inconsistent with other overlays

**After:**
- Uses `OverlayShell` with `z="modal"`
- Portal rendering
- Consistent behavior with main lightbox
- Maintains circular vinyl artwork styling

### 5. Improved DJ Mixer Layout

**File: `src/components/DJMixer.tsx`**

**Visual Improvements:**
- Added card containers for each deck section (Deck A, Center, Deck B)
- Better visual grouping with subtle backgrounds (`bg-[#1a1a1a]/50`)
- Enhanced borders and shadows for depth
- Improved typography hierarchy:
  - Deck labels use deck colors (cyan for A, magenta for B)
  - Section headers with consistent tracking
  - Better spacing and padding

**Layout Structure:**
- **Left Column (Deck A):**
  - Volume fader
  - EQ section with labeled knobs (HIGH, MID, LOW)
  - Kill switches for each band

- **Center Column:**
  - Spectrum analyzer (in card container)
  - Crossfader (in card container)
  - Recording controls (in card container)
  - Master limiter (in card container)

- **Right Column (Deck B):**
  - Volume fader
  - EQ section with labeled knobs (HIGH, MID, LOW)
  - Kill switches for each band

**Responsive Behavior:**
- Maintains 3-column layout on desktop
- Stacks vertically on mobile
- Touch-friendly controls (44px minimum targets)
- Consistent spacing across breakpoints

### 6. Stacking Context Audit

**Findings:**
- Deck containers use `scale-105` transform on drag (creates stacking context)
- **Solution:** Lightboxes now render via portal, avoiding parent stacking contexts
- No changes needed to deck transforms (they don't affect portaled overlays)

**Best Practices Applied:**
- Overlays always render via portal
- Avoid transforms/filters/opacity on overlay containers
- Use consistent z-index tokens
- Test with multiple overlays open simultaneously

## Z-Index Hierarchy

```
z-toast (400)          - Notifications, toasts
z-modal (300)          - Modals, lightboxes (album art, jogwheel)
z-overlay (200)        - General overlays
z-player-overlay (100) - Player-specific overlays
z-player (80)          - Audio players
z-nav (50)             - Navigation
z-base (0)             - Default content
```

## Testing Checklist

### Lightbox Tests
- [x] Open album art lightbox from track drawer
- [x] Lightbox appears above all mixer controls
- [x] Close via ESC key
- [x] Close via backdrop click
- [x] Close via X button
- [x] Background controls not clickable when lightbox open
- [x] Navigate away while lightbox open (should close)
- [x] Open multiple album arts quickly (no conflicts)
- [x] JogWheel lightbox works correctly
- [x] No "half covered" controls

### Mixer Layout Tests
- [x] All controls visible and accessible
- [x] Proper grouping and visual hierarchy
- [x] Responsive behavior on mobile
- [x] Touch targets meet 44px minimum
- [x] No layout shifts when opening/closing overlays

### Stacking Order Tests
- [x] Lightbox above navbar
- [x] Lightbox above floating players
- [x] Lightbox above mixer controls
- [x] Multiple overlays stack correctly
- [x] No z-index conflicts

## Migration Notes

### For Future Overlays

**Use OverlayShell:**
```tsx
import { OverlayShell } from "@/components/ui/OverlayShell";

<OverlayShell
  open={isOpen}
  onClose={() => setIsOpen(false)}
  z="modal"  // or "overlay"
>
  {/* Your content */}
</OverlayShell>
```

### For Z-Index Values

**Use Tailwind tokens:**
```tsx
// ❌ Don't use arbitrary values
className="z-[100]"

// ✅ Use tokens
className="z-modal"
className="z-overlay"
className="z-nav"
```

## Files Modified

1. `tailwind.config.ts` - Added z-index tokens
2. `src/components/ui/OverlayShell.tsx` - New component
3. `src/components/DJInterface.tsx` - Updated lightbox
4. `src/components/dj-ui/JogWheel.tsx` - Updated lightbox
5. `src/components/DJMixer.tsx` - Improved layout

## Files Not Modified (But Could Be Updated)

- `src/components/tour/PosterModal.tsx` - Uses `z-[70]`, could use `z-modal`
- `src/components/tour/EventModal.tsx` - Uses `z-50`, could use `z-modal`
- `src/components/FloatingVideoPlayer.tsx` - Uses `z-[100]`, could use `z-player-overlay`
- `src/components/Navbar.tsx` - Uses `z-[100]`, could use `z-nav`

These can be updated in future refactoring for consistency, but are not critical as they don't conflict with the DJ mixer overlays.

## Performance Notes

- Portal rendering adds minimal overhead
- Scroll lock uses existing `useBodyScrollLock` hook (counter-based, safe for multiple modals)
- No performance impact from z-index tokens (compile-time)

## Accessibility

- All overlays support ESC key
- Focus management handled by OverlayShell
- ARIA labels maintained
- Touch targets meet 44px minimum
- Keyboard navigation preserved

## Browser Compatibility

- Portal rendering: All modern browsers (React 18+)
- Z-index tokens: All browsers (Tailwind compile-time)
- Scroll lock: All browsers (CSS overflow)

