# Studio V2 - Timeline Rebuild Plan

**Status**: 🚧 In Progress
**Start Date**: February 5, 2026
**Strategy**: Parallel build (`/studio-v2` route)
**Preserve**: Current `/studio` (2-deck system remains working)

---

## Vision

Build a **timeline-based multi-track mixing application** inspired by Mixpoint and DJ.Studio, solving the gap between:
- **Live DJ apps** (2-deck, real-time) - great for performances, not for perfecting sets
- **DAW apps** (production-focused) - powerful but lack DJ context (BPM, beatmatching, crossfading)

### Core Goals
✅ Timeline layout for arranging multiple tracks
✅ Visual transition editing (not live crossfading)
✅ BPM detection + automatic beatmatching
✅ Harmonic mixing (key-aware track ordering)
✅ Export finished sets (MP3/WAV + video with waveforms)
✅ AI-powered automixing (future)
✅ Voiceover/jingle insertion
✅ Cue point timeline markers

---

## Architecture Decisions

### Audio Engine
**KEEP Tone.js** (per repository rules - no alternate audio engines)
- Reuse existing `AudioEngineProvider.tsx`
- Adapt transport for timeline playback (not 2-deck sync)
- Single global transport with multi-track routing

### UI Framework
**Add HeroUI** (alongside existing shadcn/ui)
- Install `@heroui/react` + `@heroui/theme`
- Create separate theme config for Studio V2
- Keep shadcn for main site (no migration needed)

### State Management
**Reuse existing patterns**
- Zustand for UI state (track arrangement, selection, zoom)
- IndexedDB (Dexie) for persistent storage (sets, cues, analysis)
- Tone.js Transport for playback state

### Waveform Rendering
**Keep WaveSurfer** (per repository rules - visuals only)
- Use WaveSurfer Regions for track boundaries
- Timeline zoom/scroll synchronization
- Multi-track waveform stacking

---

## Phase Breakdown

### Phase 1: Foundation Setup (Days 1-2)
**Goals**: Install dependencies, create route structure, basic layout

**Tasks**:
- [x] Create implementation plan document
- [x] Install HeroUI packages (226 packages added)
- [x] Create `/src/app/(site)/studio-v2/page.tsx` route
- [x] Set up HeroUI theme configuration
- [x] Create basic timeline layout component
- [x] Add route navigation link (Studio V2 in navbar)

**Deliverables**:
- ✅ Empty timeline page with HeroUI styling
- ✅ Header with project title, tempo, duration
- ✅ Horizontal scrollable timeline container
- ✅ Build verification passing (455 kB bundle)
- ✅ Documentation: `STUDIO_V2_PHASE_1_COMPLETE.md`

---

### Phase 2: Timeline Core (Days 3-5)
**Goals**: Build timeline grid, track rows, drag-drop placement

**Tasks**:
- [ ] Create `TimelineGrid.tsx` (horizontal ruler with time markers)
- [ ] Create `TrackRow.tsx` (single horizontal track lane)
- [ ] Implement `useTimelineStore.ts` (Zustand: tracks, zoom, playhead)
- [ ] Add drag-drop track placement from library
- [ ] Implement horizontal scrolling + zoom controls
- [ ] Add playhead cursor with scrubbing

**Deliverables**:
- 4-8 vertical track rows
- Horizontal time ruler (minutes:seconds)
- Drag tracks from library onto timeline
- Click to seek playhead position

**Data Model**:
```typescript
interface TimelineTrack {
  id: string;
  trackKey: string; // normalized ID (per repo rules)
  startTime: number; // seconds from timeline start
  duration: number;
  row: number; // vertical lane (0-7)
  volume: number;
  fadeIn: number; // transition duration
  fadeOut: number;
}

interface TimelineState {
  tracks: TimelineTrack[];
  playhead: number; // current time in seconds
  zoom: number; // pixels per second
  duration: number; // total timeline duration
}
```

---

### Phase 3: Audio Playback (Days 6-8)
**Goals**: Wire Tone.js to timeline playback, multi-track mixing

**Tasks**:
- [ ] Create `useTimelineAudio.ts` hook
- [ ] Adapt Tone.js Transport for timeline mode
- [ ] Load multiple tracks into Tone.Players
- [ ] Implement scheduled start/stop based on track positions
- [ ] Add master volume + track volume controls
- [ ] Sync playhead with Tone.Transport.seconds

**Architecture**:
```typescript
// Reuse existing audio engine, adapt for timeline
const audioEngine = useAudioEngine(); // Existing provider
const players = new Map<string, Tone.Player>();

// Schedule all tracks on Transport
tracks.forEach(track => {
  const player = players.get(track.trackKey);
  player.sync().start(track.startTime);
});

// Play from current playhead position
Tone.Transport.seconds = playhead;
Tone.Transport.start();
```

**Deliverables**:
- Play/pause timeline from any position
- Multiple tracks play simultaneously with correct timing
- Volume faders for each track row
- Master output level control

---

### Phase 4: Waveform Integration (Days 9-11)
**Goals**: Render WaveSurfer waveforms for each track on timeline

**Tasks**:
- [ ] Create `TimelineWaveform.tsx` (mini waveform per track)
- [ ] Reuse existing waveform peak generation (IndexedDB cache)
- [ ] Render waveforms scaled to timeline zoom level
- [ ] Add waveform scrubbing (click to seek)
- [ ] Sync playhead cursor across all waveforms
- [ ] Color-code waveforms by energy/key

**Deliverables**:
- Each track shows full waveform on timeline
- Waveforms stretch/compress with zoom
- Click waveform to move playhead
- Visual beat grid overlay (optional)

---

### Phase 5: Transition Editor (Days 12-15)
**Goals**: Visual editing of crossfades, EQ transitions, beat alignment

**Tasks**:
- [ ] Create `TransitionEditor.tsx` (modal/panel)
- [ ] Add transition handles (drag edges of tracks)
- [ ] Implement crossfade curves (linear, exponential, S-curve)
- [ ] Add EQ fade option (high-pass/low-pass transition)
- [ ] Visual overlap preview (waveforms overlay during fade)
- [ ] Snap-to-beat alignment guides
- [ ] Auto-detect optimal transition points (AI-assisted)

**Transition Types**:
- **Crossfade**: Volume overlap (adjustable curve)
- **EQ Fade**: High-pass out, low-pass in (frequency transition)
- **Beat Jump**: Hard cut on beat boundary (no overlap)
- **Echo Out**: Apply delay/reverb tail (creative transition)

**Deliverables**:
- Drag track edges to create overlaps
- Adjust fade curve shape
- Preview transition in real-time
- Save transition settings per track pair

---

### Phase 6: BPM & Harmonic Mixing (Days 16-18)
**Goals**: Auto-detect BPM, key, suggest optimal track order

**Tasks**:
- [ ] Integrate existing `analyzeTrack` API (reuse Phase IX work)
- [ ] Display BPM + key badges on timeline tracks
- [ ] Implement harmonic mixing rules (Camelot wheel)
- [ ] Add "Auto-Order" button (AI track sequencing)
- [ ] Visual key compatibility indicators (green/yellow/red)
- [ ] BPM sync suggestions (speed up/slow down %)

**Harmonic Mixing Rules**:
- Perfect match: Same key
- Energy up: +1 on Camelot wheel
- Energy down: -1 on Camelot wheel
- Dramatic shift: +7 (relative minor/major)

**Deliverables**:
- BPM/key displayed on each track
- "Suggest Next Track" based on current selection
- Color-coded compatibility (green = perfect, red = clash)
- One-click auto-arrangement

---

### Phase 7: Library Integration (Days 19-20)
**Goals**: Browse tracks, search, filter, add to timeline

**Tasks**:
- [ ] Create `TimelineLibrary.tsx` sidebar
- [ ] Reuse existing `useLibraryStore.ts` (IndexedDB tracks)
- [ ] Add search/filter (BPM range, key, genre)
- [ ] Drag-drop tracks from library to timeline
- [ ] "Add to Timeline" button (appends to end)
- [ ] Recently used tracks quick access

**Deliverables**:
- Collapsible library sidebar
- Search by title, artist, BPM, key
- Filter by genre, energy level
- Drag tracks onto timeline at any position

---

### Phase 8: Export & Save (Days 21-23)
**Goals**: Render finished mix, save project state

**Tasks**:
- [ ] Create `ExportDialog.tsx` (settings modal)
- [ ] Implement offline audio rendering (Tone.Offline)
- [ ] Export formats: MP3 (320kbps), WAV (44.1kHz)
- [ ] Generate video with waveforms (canvas → MP4)
- [ ] Save project to IndexedDB (timeline state)
- [ ] Load saved projects (project browser)
- [ ] Export tracklist (Markdown/plain text)

**Export Settings**:
- Format: MP3 / WAV / Video (MP4)
- Quality: 128kbps / 320kbps / Lossless
- Normalize audio: Yes / No
- Include voiceover: Yes / No
- Waveform style: Bars / Line / Frequency

**Deliverables**:
- "Export Mix" button renders full timeline
- Save/load projects by name
- Download finished audio file
- Optional video export with visualizations

---

### Phase 9: Advanced Features (Days 24-30)
**Goals**: Voiceovers, effects, automation, AI mixing

**Tasks**:
- [ ] Add voiceover recording (insert at timeline position)
- [ ] Master effects chain (EQ, compressor, limiter)
- [ ] Automation lanes (volume, EQ over time)
- [ ] AI auto-mix (one-click full set generation)
- [ ] Cue point markers (intro, drop, outro detection)
- [ ] Keyboard shortcuts (space = play/pause, arrows = seek)
- [ ] Undo/redo timeline edits

**Deliverables**:
- Record voiceover, insert as timeline item
- Apply mastering effects to final output
- Draw automation curves for volume
- "Auto-Mix" generates complete set in seconds

---

## Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **UI Framework** | HeroUI (NextUI v3) | Modern, themeable, dark mode |
| **Audio Engine** | Tone.js v15.1.22 | ONLY engine (repo rule) |
| **Waveforms** | WaveSurfer.js | Visuals only (repo rule) |
| **State** | Zustand + Dexie | UI state + persistence |
| **Analysis** | Essentia.js WASM | BPM, key, energy (existing) |
| **Routing** | Next.js App Router | `/studio-v2` route |
| **Styling** | Tailwind CSS v4 | HeroUI plugin |

---

## File Structure

```
src/
├── app/(site)/studio-v2/
│   ├── page.tsx              # Main timeline route
│   └── layout.tsx            # Studio V2 layout (fullscreen)
├── components/studio-v2/
│   ├── Timeline.tsx          # Main timeline container
│   ├── TimelineGrid.tsx      # Time ruler + grid
│   ├── TrackRow.tsx          # Single track lane
│   ├── TimelineWaveform.tsx  # Waveform per track
│   ├── TransitionEditor.tsx  # Fade/EQ transition UI
│   ├── TimelineLibrary.tsx   # Track browser sidebar
│   ├── TimelineTransport.tsx # Play/pause/seek controls
│   ├── ExportDialog.tsx      # Export settings modal
│   └── ProjectBrowser.tsx    # Load saved projects
├── hooks/studio-v2/
│   ├── useTimelineStore.ts   # Zustand: timeline state
│   ├── useTimelineAudio.ts   # Tone.js timeline playback
│   ├── useTrackAnalysis.ts   # BPM/key detection
│   └── useTimelineExport.ts  # Offline rendering
└── lib/studio-v2/
    ├── timeline-utils.ts     # Time conversion, snapping
    ├── harmonic-mixing.ts    # Camelot wheel logic
    └── audio-renderer.ts     # Offline export engine
```

---

## Migration Strategy

### Reusable from Studio V1
✅ **Audio Engine** (`AudioEngineProvider.tsx`)
✅ **Library Store** (`useLibraryStore.ts`)
✅ **Track Analysis** (`/api/studio/analyze-track`)
✅ **Waveform Peaks** (IndexedDB cache)
✅ **Track Metadata** (Dexie schema)

### New for Studio V2
🆕 **Timeline State** (track positions, overlaps)
🆕 **Multi-track Playback** (scheduled Players)
🆕 **Transition Editing** (crossfade UI)
🆕 **Project Save/Load** (timeline snapshots)
🆕 **Export Engine** (offline rendering)

### Eventual Decision
- **Keep both**: `/studio` = live mode, `/studio-v2` = production mode
- **Deprecate V1**: Redirect `/studio` → `/studio-v2` after V2 stable
- **Hybrid**: Add timeline view inside existing Studio as tab

---

## Success Metrics

### Phase 1-3 Success (Weeks 1-2)
- [ ] Can add 3+ tracks to timeline
- [ ] Playback works from any position
- [ ] Tracks play at correct times
- [ ] No audio glitches or sync issues

### Phase 4-6 Success (Weeks 3-4)
- [ ] Waveforms render smoothly at all zoom levels
- [ ] Transitions visually editable
- [ ] BPM/key displayed correctly
- [ ] Auto-order suggests logical sequence

### Phase 7-9 Success (Weeks 5-6)
- [ ] Can export full mix to MP3/WAV
- [ ] Save/load projects work reliably
- [ ] Voiceover insertion functional
- [ ] AI auto-mix generates decent set

---

## Non-Negotiables (Repo Rules)

Per `.github/copilot-instructions.md`:

✅ **Tone.js ONLY** - No alternate audio engines
✅ **WaveSurfer visuals-only** - No WaveSurfer audio playback
✅ **trackKey normalization** - Never use URLs as IDs
✅ **No SW in dev** - Service Worker disabled during development
✅ **Build verification** - `npm run build` must pass after every phase
✅ **Small modules** - Avoid monster files (max ~200 lines)

---

## Next Steps

1. **Install HeroUI** (`npm install @heroui/react @heroui/theme`)
2. **Create `/studio-v2/page.tsx`** route
3. **Build Phase 1** (foundation + layout)
4. **Iterate through phases** with verification gates
5. **Document learnings** in this file

---

**Updated**: February 5, 2026
**Author**: GitHub Copilot + User
**Status**: Ready to begin Phase 1
