# Phase X.5: Layout Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DESKTOP LAYOUT (md+)                              │
│                     Fixed Viewport: h-screen                             │
│                  ZERO VERTICAL SCROLLING ENFORCED                        │
└─────────────────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Row 1: WAVEFORMS (Fixed 140px / h-35)                                  ┃
┠─────────────────────────────────────────────────────────────────────────┨
┃  ┌─────────────────────────────┐  ┌─────────────────────────────┐     ┃
┃  │   Deck A Waveform           │  │   Deck B Waveform           │     ┃
┃  │   - Track title             │  │   - Track title             │     ┃
┃  │   - Beat grid markers       │  │   - Beat grid markers       │     ┃
┃  │   - Progress indicator      │  │   - Progress indicator      │     ┃
┃  └─────────────────────────────┘  └─────────────────────────────┘     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Row 2: PERFORMANCE (flex-1 - Expands to fill space)                    ┃
┠─────────────────────────────────────────────────────────────────────────┨
┃  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 ┃
┃  │  Deck A      │  │   MIXER      │  │  Deck B      │                 ┃
┃  │  Controls    │  │   CENTER     │  │  Controls    │                 ┃
┃  │──────────────│  │──────────────│  │──────────────│                 ┃
┃  │ JogWheel     │  │ EQ A | EQ B  │  │ JogWheel     │                 ┃
┃  │ Transport    │  │ Fader A      │  │ Transport    │                 ┃
┃  │ Sync/Cue     │  │ Level Meter  │  │ Sync/Cue     │                 ┃
┃  │ StemRack     │  │ Fader B      │  │ StemRack     │                 ┃
┃  │              │  │ Level Meter  │  │              │                 ┃
┃  │──────────────│  │ Crossfader   │  │──────────────│                 ┃
┃  │ FX Rack A    │  │ Master Meter │  │ FX Rack B    │                 ┃
┃  │ - Filter     │  │ FX Rack      │  │ - Filter     │                 ┃
┃  │ - Reverb     │  │              │  │ - Reverb     │                 ┃
┃  │ - Delay      │  │              │  │ - Delay      │                 ┃
┃  └──────────────┘  └──────────────┘  └──────────────┘                 ┃
┃  (overflow-y-auto) (overflow-y-auto) (overflow-y-auto)                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Row 3: LIBRARY (300px / h-75 when open, 48px / h-12 when closed)       ┃
┠─────────────────────────────────────────────────────────────────────────┨
┃  ┌─────────────────────────────────────────────────────────────────┐   ┃
┃  │ Track Library Header         [Close]                            │   ┃
┃  ├─────────────────────────────────────────────────────────────────┤   ┃
┃  │ [Search] [Filter] [Sort]                                        │   ┃
┃  ├─────────────────────────────────────────────────────────────────┤   ┃
┃  │ Track 1 - Artist A    128 BPM    Teal    [Load A] [Load B]     │   ┃
┃  │ Track 2 - Artist B    140 BPM    Purple  [Load A] [Load B]     │   ┃
┃  │ Track 3 - Artist C    125 BPM    Cyan    [Load A] [Load B]     │   ┃
┃  │ (overflow-y-auto)                                               │   ┃
┃  └─────────────────────────────────────────────────────────────────┘   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────────────┐
│                        MOBILE LAYOUT (<md)                               │
│                     Tab-Based View Switcher                              │
│                  Single Active View at a Time                            │
└─────────────────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Active View (flex-1 - Full height minus nav)                           ┃
┠─────────────────────────────────────────────────────────────────────────┨
┃                                                                          ┃
┃  Tab: DECKS (overflow-y-auto)                                           ┃
┃  ┌──────────────────────────────────────────────────────────────────┐   ┃
┃  │ Deck A                                                           │   ┃
┃  │ ┌────────────────────────────────────────────────────────────┐   │   ┃
┃  │ │ Waveform                                                   │   │   ┃
┃  │ └────────────────────────────────────────────────────────────┘   │   ┃
┃  │ ┌────────────────────────────────────────────────────────────┐   │   ┃
┃  │ │ JogWheel + Transport Controls                              │   │   ┃
┃  │ └────────────────────────────────────────────────────────────┘   │   ┃
┃  └──────────────────────────────────────────────────────────────────┘   ┃
┃                                                                          ┃
┃  ┌──────────────────────────────────────────────────────────────────┐   ┃
┃  │ Deck B                                                           │   ┃
┃  │ ┌────────────────────────────────────────────────────────────┐   │   ┃
┃  │ │ Waveform                                                   │   │   ┃
┃  │ └────────────────────────────────────────────────────────────┘   │   ┃
┃  │ ┌────────────────────────────────────────────────────────────┐   │   ┃
┃  │ │ JogWheel + Transport Controls                              │   │   ┃
┃  │ └────────────────────────────────────────────────────────────┘   │   ┃
┃  └──────────────────────────────────────────────────────────────────┘   ┃
┃                                                                          ┃
┠─────────────────────────────────────────────────────────────────────────┨
┃                                                                          ┃
┃  Tab: MIXER (overflow-y-auto)                                           ┃
┃  ┌──────────────────────────────────────────────────────────────────┐   ┃
┃  │ EQ Section                                                       │   ┃
┃  │ ┌──────────────┐  ┌──────────────┐                              │   ┃
┃  │ │ EQ A         │  │ EQ B         │                              │   ┃
┃  │ └──────────────┘  └──────────────┘                              │   ┃
┃  │                                                                  │   ┃
┃  │ Channel Faders + Level Meters                                   │   ┃
┃  │ ┌──────────────┐  ┌──────────────┐                              │   ┃
┃  │ │ Fader A      │  │ Fader B      │                              │   ┃
┃  │ │ Meter A      │  │ Meter B      │                              │   ┃
┃  │ └──────────────┘  └──────────────┘                              │   ┃
┃  │                                                                  │   ┃
┃  │ Crossfader                                                       │   ┃
┃  │ Master Meter                                                     │   ┃
┃  │ FX Rack                                                          │   ┃
┃  └──────────────────────────────────────────────────────────────────┘   ┃
┃                                                                          ┃
┠─────────────────────────────────────────────────────────────────────────┨
┃                                                                          ┃
┃  Tab: LIBRARY (overflow-hidden)                                         ┃
┃  ┌──────────────────────────────────────────────────────────────────┐   ┃
┃  │ Track Library                                                    │   ┃
┃  │ ┌────────────────────────────────────────────────────────────┐   │   ┃
┃  │ │ Search / Filter / Sort                                     │   │   ┃
┃  │ ├────────────────────────────────────────────────────────────┤   │   ┃
┃  │ │ Track Listing (overflow-y-auto)                            │   │   ┃
┃  │ │ - Track 1  [Load A] [Load B]                               │   │   ┃
┃  │ │ - Track 2  [Load A] [Load B]                               │   │   ┃
┃  │ │ - Track 3  [Load A] [Load B]                               │   │   ┃
┃  │ └────────────────────────────────────────────────────────────┘   │   ┃
┃  └──────────────────────────────────────────────────────────────────┘   ┃
┃                                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Bottom Navigation (Fixed 64px / h-16)                                   ┃
┠─────────────────────────────────────────────────────────────────────────┨
┃  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  ┃
┃  │   DECKS      │  │   MIXER      │  │   LIBRARY    │                  ┃
┃  │   (Active)   │  │              │  │              │                  ┃
┃  └──────────────┘  └──────────────┘  └──────────────┘                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────────────┐
│                          COLOR SYSTEM                                    │
└─────────────────────────────────────────────────────────────────────────┘

Background Layers:
  ███ --bg-primary: #121212     (Main canvas)
  ███ --bg-secondary: #1E1E1E   (Panels)
  ███ --bg-tertiary: #252525    (Hover states)

Text Hierarchy:
  ███ --text-primary: #E0E0E0   (Main text - Off-white)
  ███ --text-secondary: #A0A0A0 (Labels - Muted)

Accent Colors:
  ███ --accent-color: #009688   (Teal - Active indicators)
  ███ --accent-hover: #00B8A9   (Teal - Hover states)

┌─────────────────────────────────────────────────────────────────────────┐
│                     RESPONSIVE BREAKPOINTS                               │
└─────────────────────────────────────────────────────────────────────────┘

Mobile (<768px):
  - Tab-based navigation
  - Single view at a time
  - Vertical scrolling per view
  - 64px bottom nav

Desktop (≥768px):
  - Fixed 3-row layout
  - Zero vertical scrolling
  - All rows visible simultaneously
  - Row 2 expands with flex-1

┌─────────────────────────────────────────────────────────────────────────┐
│                     HARDWARE PHYSICS                                     │
└─────────────────────────────────────────────────────────────────────────┘

Level Meter Ballistics:
  Attack:  10ms  (Fast response - exponential)
  Release: 300ms (Smooth decay - exponential)

  Formula: alpha = 1 - Math.pow(0.01, dt / TIME_CONSTANT)

  Supports: 60Hz, 120Hz, 144Hz refresh rates

JogWheel Beat Flash:
  Duration: (60 / bpm) seconds per beat
  Effect: Teal glow pulse (10px → 20px → 10px)
  Sync: Quarter note pulse (1 beat = 1 pulse)

┌─────────────────────────────────────────────────────────────────────────┐
│                     FILE STRUCTURE                                       │
└─────────────────────────────────────────────────────────────────────────┘

src/components/studio/
├── layout/
│   ├── StudioGrid.tsx          ← Desktop 3-row + Mobile tabs
│   ├── PerformanceRow.tsx      ← 3-column mixer layout
│   ├── MixerCenter.tsx         ← EQ, faders, meters, FX
│   ├── LibraryRow.tsx          ← Track browser
│   ├── StudioLayout.tsx        ← Root audio shell
│   └── StudioShell.tsx         ← Viewport container
├── ui/
│   ├── LevelMeter.tsx          ← Hardware-accurate ballistics
│   ├── JogWheel.tsx            ← Beat flash animation
│   ├── DeckWaveform.tsx        ← Waveform display
│   ├── DeckControls.tsx        ← Transport + jog
│   └── TrackLibrary.tsx        ← Track browser UI
└── core/
    ├── DeckFXRack.tsx          ← Per-deck FX chain
    └── FXRack.tsx              ← Master FX bus

┌─────────────────────────────────────────────────────────────────────────┐
│                     TESTING MATRIX                                       │
└─────────────────────────────────────────────────────────────────────────┘

Desktop Layout:
  ✅ 1920x1080 - Zero scroll
  ✅ 1440x900  - Zero scroll
  ✅ 1280x720  - Zero scroll
  ✅ Library toggle (48px ↔ 300px)

Mobile Layout:
  ✅ 375px - Tab navigation
  ✅ 414px - Tab navigation
  ✅ 768px - Switches to desktop

Hardware Physics:
  ✅ 60Hz  - Smooth metering
  ✅ 120Hz - Smooth metering
  ✅ 144Hz - Smooth metering
  ✅ Beat flash synced to BPM

Color System:
  ✅ No pure white (#FFFFFF)
  ✅ No pure black (#000000)
  ✅ Teal accent (#009688)
  ✅ Off-white text (#E0E0E0)

┌─────────────────────────────────────────────────────────────────────────┐
│                     BUILD STATUS                                         │
└─────────────────────────────────────────────────────────────────────────┘

✓ Compiled successfully in 52s
✓ Linting and checking validity of types
✓ Generating static pages (18/18)
✓ Finalizing page optimization

Route: /studio → 401 kB (First Load: 561 kB)

Warnings: 22 (non-breaking, pre-existing)
Errors: 0 ✅

Status: PRODUCTION READY ✅
```
