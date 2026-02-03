# Phase IX.5: Quick Reference Guide

**For Developers** – Fast lookup for Phase IX.5 implementation

---

## Component Locations

```
src/components/studio/ui/
├── TrackLibrary.tsx       // Enhanced with harmonic matching
├── TrackListing.tsx       // Perfect Match indicator
├── Deck.tsx              // HUD + auto-analysis
└── EnergyIndicator.tsx   // NEW: Vertical energy meter
```

---

## Key Hooks

### useSmartTrackAnalysis (Phase IX)

```typescript
import { useSmartTrackAnalysis } from '@/hooks/useSmartTrackAnalysis';

const { analyzeIfNeeded, isAnalyzing, currentTrack } = useSmartTrackAnalysis();

// Auto-analyze track
await analyzeIfNeeded(dbTrack);
```

### Harmonic Matching Logic

```typescript
const activeDeckKey = useMemo(() => {
  const activeDeck = deckA.isPlaying ? deckA : deckB.isPlaying ? deckB : null;
  const match = activeDeck?.trackData?.key.match(/\(([0-9]{1,2}[AB])\)/);
  return match ? match[1] : null;
}, [deckA, deckB]);
```

---

## UI Components

### Perfect Match Indicator

```typescript
<div className={`border transition-all ${
  track.isCompatible
    ? 'border-lime-400 shadow-[0_0_20px_rgba(190,242,100,0.3)]'
    : 'border-white/10'
}`}>
  {track.isCompatible && (
    <span className="px-2 py-0.5 rounded-full bg-lime-400/20 border border-lime-400 text-lime-400">
      Perfect Match
    </span>
  )}
</div>
```

### EnergyIndicator

```typescript
import { EnergyIndicator } from '@/components/studio/ui/EnergyIndicator';

<EnergyIndicator energy={trackData.energy || 0} />
```

### Deck HUD (Camelot Key)

```typescript
{trackData.key && (
  <div className="px-3 py-1.5 rounded-lg bg-lime-400/10 border border-lime-400/30">
    <span className="text-[10px] uppercase text-lime-400/70">Key</span>
    <span className="text-sm font-bold text-lime-400">{trackData.key}</span>
  </div>
)}
```

---

## Data Flow

### Track Analysis Pipeline

```
User loads track → Deck.tsx
    ↓
Auto-analysis effect triggers → useSmartTrackAnalysis
    ↓
Check db.tracks status → Dexie.js
    ↓
If unanalyzed → analyzeIfNeeded()
    ↓
Essentia.js Web Worker → BPM, Key, Energy
    ↓
Map to Camelot → KEY_TO_CAMELOT
    ↓
Persist to IndexedDB → db.tracks.modify()
    ↓
UI updates (live query) → useLiveQuery()
```

### Harmonic Matching Pipeline

```
Active deck playing → deckA.isPlaying
    ↓
Extract Camelot key → regex match
    ↓
Calculate compatible keys → Camelot Wheel rules
    ↓
Map filteredTracks → add isCompatible flag
    ↓
Render with Perfect Match glow → TrackListing.tsx
```

---

## Camelot Wheel Rules

### Compatible Keys:

1. **Same key** (e.g., 8B → 8B)
2. **Relative major/minor** (e.g., 8A ↔ 8B)
3. **Adjacent keys** (e.g., 8B → 7B or 9B)

### Code:

```typescript
const compatibleKeys = new Set([
  activeDeckKey,                    // Same key
  `${num}${oppositeLetter}`,        // Relative major/minor
  `${prevNum}${letter}`,            // -1 on wheel
  `${nextNum}${letter}`,            // +1 on wheel
]);
```

---

## Color Palette

```css
/* Perfect Match */
border: border-lime-400;
shadow: 0_0_20px_rgba(190,242,100,0.3);

/* Energy Gradient */
from-indigo-500 → via-purple-500 → to-lime-400

/* Analysis Status */
Analyzing: bg-cyan-400/20 border-cyan-400 (pulsing)
Error: bg-red-400/20 border-red-400
Unanalyzed: bg-white/10 border-white/20
```

---

## Performance Tips

### Batch Analysis

```typescript
// Add 100ms delay to prevent UI blocking
for (const track of unanalyzedTracks) {
  await analyzeIfNeeded(track);
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### Live Query Optimization

```typescript
// Dexie.js automatically debounces updates
const dbTracks = useLiveQuery(
  () => db.tracks.orderBy('dateAdded').reverse().toArray(),
  []
);
```

---

## Testing

### Playwright Test Example

```typescript
test('Perfect Match indicator appears', async ({ page }) => {
  await page.goto('/studio');

  // Load track with known Camelot key
  await page.click('[data-track-id="track-8b"]');

  // Open library
  await page.click('[data-testid="library-toggle"]');

  // Verify compatible tracks glow
  await expect(page.locator('.border-lime-400')).toBeVisible();
});
```

---

## Build Commands

```bash
# Development
npm run dev

# Build (verify)
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Common Issues

### Issue: Perfect Match not showing

**Solution:** Ensure Camelot key is in format: `"C major (8B)"`

```typescript
// Correct format in db.tracks
key: "C major (8B)"

// Regex extraction
const match = key.match(/\(([0-9]{1,2}[AB])\)/);
```

### Issue: Auto-analysis not triggering

**Solution:** Verify track URL exists in Dexie.js

```typescript
const dbTrack = await db.tracks.where('url').equals(trackData.url).first();
if (!dbTrack) {
  console.error('Track not found in database');
}
```

### Issue: Energy meter not animating

**Solution:** Check energy value is 0.0-1.0

```typescript
const normalizedEnergy = Math.min(1, Math.max(0, energy));
```

---

## Git Workflow

```bash
# Stage changes
git add .

# Commit
git commit -m "feat: Phase IX.5 - Masterpiece UI integration

- Enhanced TrackLibrary with harmonic matching
- Added EnergyIndicator component
- Redesigned Deck HUD with Camelot key display
- Implemented auto-analysis on track load
- Added batch analysis toolbar"

# Push
git push origin main
```

---

**Quick Links:**
- [Full Documentation](./PHASE_IX5_MASTERPIECE_UI.md)
- [Phase IX AI Insights](./PHASE_IX_AI_INSIGHTS.md)
- [Phase IX Completion Summary](./PHASE_IX_COMPLETION_SUMMARY.md)
