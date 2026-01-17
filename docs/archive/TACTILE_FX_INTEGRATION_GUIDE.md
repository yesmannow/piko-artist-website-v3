# Tactile FX & Audio Physics - Integration Guide

## ✅ Expert Implementations Complete

### 1. XY Kaoss Pad (`src/components/dj-ui/XYPad.tsx`)

**Expert Features**:

- Physics-based spring animations (`useSpring` from framer-motion)
- High-performance gesture handling (`@use-gesture/react`)
- Real-time ghost trail with opacity decay (requestAnimationFrame)
- Automatic snap-back to (0.5, 0) on release
- Brutalist design: 0px border-radius, Safety Yellow (#FFD700)

**Props**:

```tsx
interface XYPadProps {
  label?: string; // Default: "FX_KAOSS"
  xLabel?: string; // Default: "FREQ"
  yLabel?: string; // Default: "DRY/WET"
  onChange: (x: number, y: number) => void; // Required
  onRelease?: () => void; // Optional callback on release
  className?: string;
}
```

### 2. Slip Mode Engine (`src/hooks/useDualDeck.ts`)

**Expert Features**:

- Virtual playhead tracking (continuous background advancement)
- Automatic seek on release when Slip Mode is active
- Per-deck control (independent for Deck A and B)
- Professional CDJ-3000 style behavior

**New Function**:

```tsx
handleScratch(velocity: number, isTouching: boolean, deck: "A" | "B")
```

**Usage**:

- `velocity`: Normalized speed (-5 to 5) maps to playbackRate adjustment
- `isTouching`: `true` during drag, `false` on release
- `deck`: Which deck to apply scratch to

### 3. Velocity-Based Scratch Physics (`src/components/dj-ui/JogWheel.tsx`)

**Expert Features**:

- Angular velocity calculation (degrees per millisecond)
- Real-time playbackRate mapping (-1.5x to +2.0x)
- Inertia physics with friction coefficient (0.95 per frame)
- Smooth spin-down to neutral

## 🔌 Integration Steps

### Step 1: Add XY Pad to FX Unit

```tsx
// In FXUnit.tsx or DJInterface.tsx
import { XYPad } from "@/components/dj-ui/XYPad";

// Audio mapping functions
const mapXToFilterFreq = (x: number): number => {
  const minFreq = 20;
  const maxFreq = 20000;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const logValue = logMin + (logMax - logMin) * x;
  return Math.pow(10, logValue);
};

const mapYToEffectMix = (y: number): number => {
  return y * 0.5; // 0 to 0.5 (0% to 50% wet/dry)
};

// In your component:
const handleXYPadChange = (x: number, y: number) => {
  const filterFreq = mapXToFilterFreq(x);
  const effectMix = mapYToEffectMix(y);

  if (activeDeck === "A") {
    setFilterFreqA(filterFreq);
    setReverbDryWetA(effectMix);
    setDelayTimeA(effectMix * 0.5); // Optional: also map to delay
  } else {
    setFilterFreqB(filterFreq);
    setReverbDryWetB(effectMix);
    setDelayTimeB(effectMix * 0.5);
  }
};

// In JSX:
<XYPad
  label="FX_KAOSS"
  xLabel="CUTOFF"
  yLabel="DRY/WET"
  onChange={handleXYPadChange}
/>;
```

### Step 2: Wire XY Pad to Audio Graph

```tsx
// In DJInterface.tsx useEffect for filter updates
useEffect(() => {
  if (fxFilterARef.current && activeDeck === "A") {
    fxFilterARef.current.frequency.value = filterFreqA;
  }
  if (fxFilterBRef.current && activeDeck === "B") {
    fxFilterBRef.current.frequency.value = filterFreqB;
  }
}, [filterFreqA, filterFreqB, activeDeck]);

// In DJInterface.tsx useEffect for effect mix
useEffect(() => {
  if (fxReverbGainARef.current && activeDeck === "A") {
    fxReverbGainARef.current.gain.value = reverbDryWetA;
  }
  if (fxDelayGainARef.current && activeDeck === "A") {
    fxDelayGainARef.current.gain.value = delayTimeA;
  }
  // Same for Deck B...
}, [reverbDryWetA, delayTimeA, activeDeck]);
```

### Step 3: Integrate Slip Mode with JogWheel

```tsx
// In DJDeck.tsx or DJInterface.tsx
import { useDualDeck } from "@/hooks/useDualDeck";

const { handleScratch, isSlipModeA, setIsSlipModeA } = useDualDeck();

// In JogWheel component:
<JogWheel
  rotation={rotation}
  isPlaying={isPlaying}
  onScrub={(delta) => {
    // Position-based seeking (existing logic)
    handleScrub(delta);
  }}
  onVelocityChange={(velocity) => {
    // Velocity-based playbackRate (NEW)
    // Map velocity from JogWheel to handleScratch format
    // JogWheel provides playbackRate directly, convert to velocity
    const normalizedVelocity = (velocity - 1.0) * 10; // Convert to -5 to 5 range
    handleScratch(normalizedVelocity, true, "A");
  }}
  onDragStart={() => {
    // Track that user started scratching
  }}
  onDragEnd={() => {
    // Release: handleScratch will check Slip Mode and seek if needed
    handleScratch(0, false, "A");
  }}
/>

// Add Slip Mode Toggle Button
<button
  onClick={() => setIsSlipModeA(!isSlipModeA)}
  className={`px-4 py-2 border-2 transition-all ${
    isSlipModeA
      ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
      : "border-gray-700 text-gray-400"
  }`}
>
  {isSlipModeA ? "SLIP: ON" : "SLIP: OFF"}
</button>
```

### Step 4: Update JogWheel Velocity Mapping

The JogWheel's `onVelocityChange` provides a playbackRate value. You need to convert it to the velocity format expected by `handleScratch`:

```tsx
// In JogWheel usage:
onVelocityChange={(playbackRate) => {
  // playbackRate is already calculated (e.g., 1.5 for 1.5x speed)
  // Convert to normalized velocity: (playbackRate - 1.0) * 10
  // This maps 1.0 → 0, 1.5 → 5, 0.5 → -5
  const normalizedVelocity = (playbackRate - 1.0) * 10;
  handleScratch(normalizedVelocity, true, "A");
}}
```

## 🎚️ Audio Graph Architecture

```
XY Pad (X) → Filter Frequency (20Hz-20kHz)
XY Pad (Y) → Reverb/Delay Wet/Dry (0-50%)

JogWheel Velocity → playbackRate (-1.5x to +2.0x)
  ↓
Slip Mode: Virtual playhead continues
  ↓
On Release: Seek to virtual position
```

## 📝 Files Modified

- ✅ `src/components/dj-ui/XYPad.tsx` - Expert implementation with physics
- ✅ `src/hooks/useDualDeck.ts` - Added `handleScratch` function
- ✅ `src/components/dj-ui/JogWheel.tsx` - Velocity physics (already complete)

## 🚀 Next Steps

1. **Add XY Pad to FXUnit**: Import and place in FX rack UI
2. **Wire Audio Mapping**: Connect onChange to filter/effect nodes
3. **Add Slip Mode Toggle**: UI button in deck components
4. **Connect JogWheel**: Wire `onVelocityChange` to `handleScratch`
5. **Test on Real Devices**: Verify all interactions feel natural

---

**Status**: Expert implementations complete. Ready for audio graph integration.
