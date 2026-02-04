# Piko Studio — Architecture Documentation

**Last Updated:** February 4, 2026
**Version:** 3.0
**Status:** Production

---

## 🎯 Overview

Piko Studio is a browser-based Digital Audio Workstation (DAW) built with Next.js, React, and Tone.js. It provides professional DJ mixing capabilities with stem separation, effects processing, and real-time audio visualization.

### Tech Stack

- **Framework:** Next.js 15.5.11 (React 18, App Router)
- **Audio Engine:** Tone.js (Web Audio API wrapper)
- **Visualization:** WaveSurfer.js
- **State Management:** Zustand
- **Storage:** Dexie.js (IndexedDB)
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel + Cloudflare R2

---

## 🏗️ Audio Engine Architecture

### Core Principle: Tone.js as Single Audio Source

**Non-Negotiable Rule:** Tone.js is the ONLY audio playback engine.

- All audio playback, transport, sync, and FX routing handled by Tone.js
- WaveSurfer is **visuals-only** (waveform rendering, regions, markers)
- No alternative playback engines allowed

### Signal Flow

```
[Track File (R2/Local)]
       ↓
   [Tone.Player]
       ↓
   [Per-Deck FX Chain]
   (EQ3 → Filter → Reverb → Delay)
       ↓
   [Channel (Gain)]
       ↓
   [CrossFader]
       ↓
   [Master FX]
   (Compressor → Limiter)
       ↓
   [Destination (Speakers)]
```

### Audio Components

**`useAudioEngine` Hook:**
- Initializes Tone.js context
- Creates Tone.Players for both decks
- Builds FX chains (EQ, filters, reverb, delay)
- Manages crossfader (equal power curve)
- Handles master dynamics (compressor + limiter)
- Provides transport controls (play, pause, seek)

**Key Features:**
- <10ms latency
- Equal power crossfading: `G_A² + G_B² = 1`
- BPM sync: `playbackRate = masterBpm / trackBpm`
- Mobile browser support (AudioContext autoplay handling)
- 60fps visual updates via requestAnimationFrame

**Location:** `src/hooks/useAudioEngine.ts`

---

## 🎨 Component Hierarchy

### Layout Structure (SSR-Safe)

```
<StudioLayout>                    # Root audio shell, NEVER unmounts
  <StudioShell>                   # Visual wrapper
    <StudioPanels>                # Responsive layout router
      ├── <StudioGrid>            # Desktop (≥768px)
      ├── <MobilePortraitPocketStudio>   # Mobile portrait
      └── <MobileLandscapeWorkstation>   # Mobile landscape
```

**Key Principles:**
- `StudioLayout` initializes audio engine once on mount
- Layout never unmounts during session (prevents audio reinitialization)
- Child layouts swap based on viewport without destroying audio context

### Desktop Layout (StudioGrid)

**3-Row Professional Workstation:**

```
┌─────────────────────────────────────────┐
│ Row 1: Dual Waveforms                   │
│  [DeckWaveformWS A] [DeckWaveformWS B]  │
├─────────────────────────────────────────┤
│ Row 2: Deck/Mixer/Deck                  │
│  [Deck A] [MixerCenter] [Deck B]        │
├─────────────────────────────────────────┤
│ Row 3: Library                          │
│  [TrackLibrary (collapsible)]           │
└─────────────────────────────────────────┘
```

**Components:**
- `DeckWaveformWS`: WaveSurfer-based waveform visualization
- `Deck`: Transport controls, EQ, filters, FX sends
- `MixerCenter`: Crossfader, master volume, recording
- `TrackLibrary`: Track browser with drag-to-deck

### Mobile Portrait Layout (Pocket Studio)

**Tab-Based Navigation:**

```
┌─────────────────┐
│  Waveform View  │  ← Current deck waveform
│  [A/B Toggle]   │  ← Switch between decks
├─────────────────┤
│   Tab Content   │
│  [DECKS/MIXER/  │  ← Tab panels
│   LIBRARY]      │
├─────────────────┤
│ ⚙ DECKS         │  ← Bottom nav bar
│ 🎚 MIXER         │
│ 📚 LIBRARY       │
└─────────────────┘
```

**Features:**
- Single waveform (focused deck)
- Deck A/B toggle buttons
- Bottom tab navigation (3 tabs)
- Touch-optimized controls

### Mobile Landscape Layout (Workstation)

**Compact 3-Row Layout:**

```
┌──────────────────────────────────────┐
│ Row 1: Dual Compact Waveforms (96px)│
│  [DeckWaveformWS A] [DeckWaveformWS B] │
├──────────────────────────────────────┤
│ Row 2: Deck A | Mixer | Deck B       │
│  [Deck A] [Mixer] [Deck B]           │
├──────────────────────────────────────┤
│ Row 3: Library (collapsible 48/220px)│
│  [TrackLibrary]                      │
└──────────────────────────────────────┘
```

**Features:**
- Dual waveforms always visible
- 3-column layout with mixer center
- Collapsible library row
- Landscape-optimized spacing

---

## 🧠 State Management

### Zustand Stores

**`useStudioStore`** — Studio UI State
```typescript
{
  // Deck state
  focusedDeck: 'A' | 'B',
  decks: {
    A: { trackId, trackKey, volume, eq, filters, fx },
    B: { trackId, trackKey, volume, eq, filters, fx }
  },

  // Mixer state
  crossfaderPosition: number,  // -1 (A) to 1 (B)
  masterVolume: number,

  // UI state
  isLibraryCollapsed: boolean,
  complexityMode: 'basic' | 'pro',

  // Recording
  isRecording: boolean
}
```

**Location:** `src/store/useStudioStore.ts`

**`useTracksStore`** — Track Library
```typescript
{
  tracks: Track[],
  isLoading: boolean,
  error: string | null,

  actions: {
    loadTracks(),
    getTrackByKey(trackKey)
  }
}
```

**Location:** `src/store/useTracksStore.ts`

### IndexedDB (Dexie.js)

**Schema:**
```typescript
{
  insights: { trackKey, bpm, key, energy, ... },
  waveformPeaks: { trackKey, peaks: Float32Array },
  trackCues: { trackKey, cues: CuePoint[] },
  stemReadiness: { trackKey, status, urls }
}
```

**Key Rule:** Use `trackKey` (normalized slug) as primary key, NOT full URLs

**Location:** `src/lib/dexie-db.ts`

---

## 🎨 WaveSurfer Integration

### DeckWaveformWS Component

**Purpose:** Visual-only waveform display using WaveSurfer.js

**Features:**
- Click-to-seek functionality
- Syncs with Tone.js transport
- Renders pre-computed peaks from IndexedDB
- Responsive height (desktop vs mobile)

**Data Flow:**
```
User clicks waveform
  → DeckWaveformWS calculates time position
  → Calls useAudioEngine().seekTo(deckId, time)
  → Tone.js updates playback position
  → WaveSurfer cursor follows Tone.js position
```

**Important:** WaveSurfer does NOT handle audio playback!

**Location:** `src/components/studio/ui/DeckWaveformWS.tsx`

---

## 🎛️ Track Identity System

### Canonical trackKey Rule

**Non-Negotiable:** Use stable `trackKey` as identifier everywhere.

**Normalization:**
```typescript
function normalizeTrackId(input: string): string {
  return input
    .toLowerCase()
    .replace(/\.(mp3|wav|m4a|ogg)$/i, '')  // Remove extensions
    .replace(/^.*\/audio\/tracks\//, '')    // Remove path prefixes
    .replace(/^https?:\/\/[^/]+/, '')       // Remove origin
    .replace(/[_\s]+/g, '-')                // Normalize separators
    .replace(/[?#].*$/, '');                // Remove query/hash
}
```

**Usage:**
```typescript
const trackKey = normalizeTrackId(trackData.trackId ?? trackData.url ?? fileName);

// Use trackKey for:
- Dexie keys (insights, peaks, cues)
- Stem readiness cache maps
- Track selection state
- URL parameters
```

**Location:** `src/lib/normalizeTrackId.ts`

---

## 📱 Responsive Design

### Media Query Breakpoints

- **Desktop:** ≥768px
- **Mobile:** <768px

### SSR-Safe Hooks

**`useMediaQuery(query: string)`**
- Uses React 18's `useSyncExternalStore`
- Server snapshot returns `false`
- Client snapshot uses `matchMedia`
- Prevents hydration mismatches

**`useOrientation()`**
- Detects portrait vs landscape
- Listens to orientation media query
- Prevents keyboard-triggered layout flips

**Locations:**
- `src/hooks/useMediaQuery.ts`
- `src/hooks/useOrientation.ts`

---

## 🔒 Security & Secrets

### Environment Variable Rules

**Client-Safe (NEXT_PUBLIC_*):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_R2_PUBLIC_URL
```

**Server-Only (NO NEXT_PUBLIC_):**
```
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
CLOUDFLARE_ACCOUNT_ID
RESEND_API_KEY
GITHUB_TOKEN
```

**Non-Negotiable:** Never expose secrets client-side!

---

## 📦 Build & Deployment

### Next.js Configuration

**File:** `next.config.mjs`

```javascript
{
  output: 'standalone',  // Optimized for Vercel
  reactStrictMode: true,

  // Cloudflare R2 image optimization
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'pub-*.r2.dev'
    }]
  },

  // Service Worker DISABLED in dev
  // (prevents cache loops with changing hashed assets)
}
```

### Vercel Deployment

**Environment:**
- Node.js 20.x
- Build command: `npm run build`
- Output directory: `.next`

**R2 Integration:**
- Audio files served from Cloudflare R2
- CORS enabled for cross-origin requests
- Public bucket for track assets

**See:** `docs/DEPLOYMENT.md` for full guide

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

- Component tests with React Testing Library
- Hook tests with `@testing-library/react-hooks`
- Store tests with Zustand test utilities

**Run:** `npm run test:unit`

### E2E Tests (Playwright)

- Studio page load
- Track loading flow
- Playback controls
- Deck switching
- Mobile responsive behavior

**Run:** `npm run test:e2e`

**See:** `docs/TESTING.md` for full guide

---

## 🚀 Performance Optimizations

### Audio Performance

- <10ms latency via Tone.js
- 60fps visual updates via requestAnimationFrame
- Transient update pattern (no React re-renders during playback)

### Bundle Optimization

- Studio route: 339 kB First Load JS
- Code splitting via Next.js dynamic imports
- Pre-computed waveform peaks (IndexedDB)
- Lazy-loaded stem processing

### Mobile Performance

- Touch-optimized controls
- Reduced waveform resolution on mobile
- Orientation-aware layouts
- Hardware acceleration for transforms

---

## 📚 Key Files Reference

### Core Audio
- `src/hooks/useAudioEngine.ts` — Tone.js integration
- `src/store/useStudioStore.ts` — Studio state
- `src/lib/dexie-db.ts` — IndexedDB schema

### Components
- `src/components/studio/layout/StudioLayout.tsx` — Root audio shell
- `src/components/studio/layout/StudioPanels.tsx` — Layout router
- `src/components/studio/ui/DeckWaveformWS.tsx` — Waveform visualization
- `src/components/studio/core/Deck.tsx` — Deck controls
- `src/components/studio/core/MixerCenter.tsx` — Mixer controls

### Utilities
- `src/lib/normalizeTrackId.ts` — Track identity normalization
- `src/hooks/useMediaQuery.ts` — SSR-safe media queries
- `src/hooks/useOrientation.ts` — Orientation detection

---

## 🔄 Migration History

### Recent Major Changes

**Phase S6 (Feb 2026):** Mobile WaveSurfer migration
- Unified all layouts on DeckWaveformWS
- Deleted legacy canvas-based DeckWaveform
- Consistent behavior across desktop + mobile

**Phase 5 (Feb 2026):** Mobile product
- Implemented portrait Pocket Studio (tab-based)
- Implemented landscape Workstation (3-row)
- SSR-safe responsive hooks

**Phase S11.2 (Jan 2026):** TrackKey normalization
- Standardized track identity across codebase
- Migrated all storage keys to trackKey
- Fixed URL-based key issues

**See:** `docs/archive/phases/` for complete history

---

## 📖 Further Reading

- **Quick Reference:** `docs/QUICK_REFERENCE.md`
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Testing Guide:** `docs/TESTING.md`
- **Developer Onboarding:** `docs/DEVELOPER_ONBOARDING.md`
- **How to Add Tracks:** `docs/how-to-add-tracks.md`

---

**Maintained by:** Piko Studio Team
**License:** MIT
