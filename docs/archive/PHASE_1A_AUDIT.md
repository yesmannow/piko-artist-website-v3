# Phase 1A — Track UI & Drawer Audit

## Current Track UI Structure

### 1. Track Grid/List Rendering

**Location:** `src/components/DJInterface.tsx` (lines 847-890)

- **Component:** Inline JSX within `DJInterface` component
- **Grid Layout:** `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`
- **Data Source:** `audioTracks` (memoized, filtered from `tracks` array)
- **Filtering:** By search query, vibe filter, and sorting (title/artist/vibe)

### 2. Track Card UI

**Location:** `src/components/DJInterface.tsx` (lines 854-887)

**Current Structure:**
- Simple `div` container with:
  - Track title (text-xs, uppercase, gray-400)
  - Artist name (text-[10px], gray-500)
  - Two buttons: "A" and "B" for loading to decks
- **No cover art displayed**
- **No hover reveal panel**
- **Minimal styling** (bg-[#1a1a1a], border-gray-800)

**Note:** There's a separate `TrackCard` component in `src/components/TrackList.tsx` (lines 74-217) that has cover art and better styling, but it's **NOT used in DJInterface**.

### 3. Track Click Handlers / Selection State

**Location:** `src/components/DJInterface.tsx`

- **Load to Deck A:** `loadTrackToDeckA` (line 565)
- **Load to Deck B:** `loadTrackToDeckB` (line 572)
- **State:**
  - `deckAData` (line 26)
  - `deckBData` (line 35)
- **No selection state** for track cards themselves (only deck loading state)

### 4. Drawer/Sheet/Modal for Track Details

**Current Status:** ❌ **NO DRAWER EXISTS IN DJInterface**

- `TrackDrawer` component exists (`src/components/TrackDrawer.tsx`) but is **only used in TrackList component** (music page)
- DJInterface track cards have **no drawer/modal** for track details
- Track cards are clickable only via A/B buttons or drag-and-drop

### 5. Track Data Source & Fields

**Location:** `src/lib/data.ts`

**MediaItem Interface:**
```typescript
{
  id: string;
  title: string;
  artist: string;
  type: 'audio' | 'video';
  src: string;
  coverArt: string; // Image path or Tailwind gradient
  vibe: 'chill' | 'hype' | 'storytelling' | 'classic';
}
```

**Available Fields:**
- ✅ title
- ✅ artist
- ✅ coverArt (image path or gradient)
- ✅ vibe/genre
- ✅ src (audio file path)
- ❌ duration (NOT in data structure)
- ❌ externalLink (NOT in data structure, but TrackDrawer constructs Spotify link)

### 6. Load-to-Deck Mechanism

**Methods:**
1. **A/B Buttons:** Direct click handlers (lines 872-886)
2. **Drag-and-Drop:**
   - `handleDragStart` (line 624)
   - `handleDeckADrop` (line 664)
   - `handleDeckBDrop` (line 702)
   - Drop zones with visual feedback (lines 966-978, 1045-1057)

**State Flow:**
```
Track Card Click/Drag → loadTrackToDeckA/B → setDeckAData/setDeckBData → DJDeck receives trackUrl
```

---

## Component Map

### DJInterface Track Library Flow

```
DJInterface (state owner)
  ├─ audioTracks (memoized filtered tracks)
  ├─ Track Grid (inline JSX, lines 847-890)
  │   └─ Track Card (inline div, lines 854-887)
  │       ├─ Title
  │       ├─ Artist
  │       └─ A/B Buttons → loadTrackToDeckA/B
  ├─ Drag Handlers → loadTrackToDeckA/B
  └─ Deck A/B (DJDeck components)
```

### File Paths & Exports

| Component | File Path | Export | Used In |
|-----------|-----------|--------|---------|
| Track Card (DJInterface) | `src/components/DJInterface.tsx` | Inline JSX | DJInterface |
| TrackCard (Music Page) | `src/components/TrackList.tsx` | `TrackCard` | TrackList |
| TrackDrawer | `src/components/TrackDrawer.tsx` | `TrackDrawer` | TrackList (mobile only) |
| Track Data | `src/lib/data.ts` | `tracks`, `MediaItem` | Multiple |

---

## Technical Plan for Phase 1B & 1C

### Phase 1B — Upgrade Track Card Layout

**Tasks:**
1. Extract inline track card JSX into a reusable `TrackCard` component (or create new `DJTrackCard`)
2. Add cover art thumbnail display (using `track.coverArt`)
3. Add hover reveal panel with:
   - Artist name (if not already visible)
   - Track length (conditional, show "—" if unavailable)
   - External link icon button (conditional, only if URL exists)
4. Add micro-interactions:
   - Subtle lift/scale on hover
   - Glow effect
   - Smooth transitions (Framer Motion if available)
5. Maintain existing functionality:
   - A/B load buttons
   - Drag-and-drop
6. Accessibility:
   - Keyboard focus support for hover reveal
   - aria-labels for external link

**Files to Modify:**
- `src/components/DJInterface.tsx` (extract/upgrade track card)

**Optional Helper:**
- Utility function for safe external link handling

### Phase 1C — Track Drawer Integration (Future)

**Tasks:**
1. Add drawer/sheet component to DJInterface track cards
2. Track details view with:
   - Large cover art
   - Full metadata
   - Play/load actions
   - External links
3. Entry point: Click on track card (not A/B buttons)
4. Desktop: Sheet/modal
5. Mobile: Bottom drawer (similar to TrackDrawer)

---

## Summary

- **Track List:** ✅ Exists (inline in DJInterface)
- **Track Card:** ✅ Exists (minimal, no cover art)
- **Track Drawer:** ❌ Does NOT exist in DJInterface
- **Cover Art:** ❌ Not displayed in DJInterface cards
- **Hover Reveal:** ❌ Not implemented
- **Duration:** ❌ Not in data structure
- **External Link:** ❌ Not in data structure (but can be constructed)

