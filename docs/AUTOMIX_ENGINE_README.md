# AI-Driven Automix Engine

## Overview

The AI-Driven Automix Engine is an intelligent mixing assistant that leverages existing Camelot key detection and BPM analysis to create seamless, harmonic transitions between tracks. It rivals professional DJ software like DJ Studio 5's mood-based mixing capabilities.

## Features

### 🎯 Compatibility Scoring
- **BPM Analysis**: Ranks tracks by BPM compatibility (±5% tolerance)
- **Camelot Harmony**: Identifies harmonic keys using the Camelot wheel system
- **Weighted Scoring**: Combines BPM (40%), Harmony (50%), and Vibe matching (10%)

### 🔄 Automated Crossfading
- **Constant-Power Transitions**: Smooth, natural-sounding crossfades
- **Phrase Boundary Detection**: Transitions at optimal musical moments
- **Configurable Duration**: 2-16 second transitions

### ⚡ Sync Automation
- **PLL Phase Sync**: Drift-free handoff between tracks
- **Beat Alignment**: Maintains rhythmic continuity
- **Seamless Transitions**: No audible artifacts

### 🎵 Vibe Filtering
- **Mood-Based Selection**: Filter by Chill, Hype, Classic, Storytelling
- **Energy Matching**: Maintains consistent atmosphere
- **Intelligent Sequencing**: Creates coherent sets

## Technical Architecture

### Core Components

1. **AutomixEngine** (`/src/engine/AutomixEngine.ts`)
   - Singleton service managing automix state
   - Coordinates analysis and transitions
   - Real-time compatibility calculations

2. **Compatibility Utilities** (`/src/utils/automix.ts`)
   - BPM compatibility scoring
   - Camelot key harmony matching
   - Phase alignment calculations
   - Constant-power crossfade curves

3. **Analysis Services**
   - **KeyService**: Camelot key detection
   - **BeatGridService**: BPM and beat grid analysis
   - **AudioEngine**: Low-level audio processing

4. **UI Components**
   - **AutomixPanel**: Control interface
   - **TrackList**: Enhanced with mood filtering

### Data Flow

```
Track Selection → Analysis → Compatibility Scoring → Transition Planning → Sync & Crossfade → Next Track Prep
```

## Usage

### Starting Automix

```typescript
import { getAutomixEngine } from '@/engine/AutomixEngine';
import { tracks } from '@/lib/data';

const automix = getAutomixEngine();

// Initialize with track library
await automix.initialize(tracks);

// Start automix on deck A with current track
const success = await automix.startAutomix('deckA', currentTrack, {
  transitionDuration: 8,
  vibeMatching: true,
  crossfadeCurve: 'constant-power'
});
```

### Manual Transitions

```typescript
// Trigger next track transition
await automix.triggerTransition();

// Stop automix
automix.stopAutomix();
```

### Compatibility Analysis

```typescript
import { calculateCompatibilityScore, rankCompatibleTracks } from '@/utils/automix';

// Score individual track compatibility
const score = calculateCompatibilityScore(masterTrack, candidateTrack, true);

// Rank all compatible tracks
const ranked = rankCompatibleTracks(masterTrack, libraryTracks, 10, true);
```

## Configuration Options

### AutomixSettings

```typescript
interface AutomixSettings {
  transitionDuration: number;    // 2-16 seconds
  vibeMatching: boolean;         // Match energy levels
  autoStartNext: boolean;        // Auto-advance tracks
  crossfadeCurve: 'linear' | 'constant-power';
}
```

### Crossfade Curves

- **Constant Power**: Equal loudness, natural sound (recommended)
- **Linear**: Simple linear fade, may cause volume dips

## Sample Track Data

The system works with tracks that include:

```typescript
interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  src: string;
  type: 'audio' | 'video';
  bpm?: number | null;
  camelot?: string | null;    // e.g., "8A", "5B"
  vibe?: 'chill' | 'hype' | 'classic' | 'storytelling' | null;
  duration?: number | null;
}
```

## Integration Points

### Existing Systems

- **AudioEngine**: Volume control, sync, playback
- **KeyService**: Real-time key detection
- **BeatGridService**: BPM analysis
- **TrackList**: Library management with mood filtering

### UI Integration

The AutomixPanel can be integrated into any DJ interface:

```tsx
<AutomixPanel
  currentTrack={currentTrack}
  availableTracks={tracks}
  onTrackSelect={handleTrackSelect}
/>
```

## Performance Considerations

- **Analysis Caching**: Results cached by track URL/hash
- **Background Processing**: Web Workers for CPU-intensive analysis
- **Real-time Updates**: 10 FPS UI updates during transitions
- **Memory Management**: Automatic cleanup and disposal

## Future Enhancements

- **AI-Powered Sequencing**: Machine learning for set curation
- **Advanced Transitions**: Beat-matching with complex FX
- **Multi-Deck Support**: Simultaneous automix on multiple decks
- **Cloud Analysis**: Server-side batch processing
- **User Preferences**: Learning from DJ mixing patterns

## Dependencies

- **AudioEngine**: Core audio processing
- **KeyService**: Musical key detection
- **BeatGridService**: Tempo analysis
- **Camelot Utils**: Key compatibility logic
- **Framer Motion**: Smooth animations
- **Tailwind CSS**: Styling

## Browser Support

- Modern browsers with Web Audio API
- Web Workers for analysis
- ES2020+ features
- AudioContext with low-latency support
