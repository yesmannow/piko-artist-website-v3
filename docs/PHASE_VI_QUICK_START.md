# Phase VI: 3D Jog Wheels - Quick Start Guide

## 🚀 Getting Started

This guide will help you integrate the new 3D Jog Wheel system into your deck UI.

---

## Option 1: Simple Integration (Recommended)

### Step 1: Update Your Deck Component

Replace the 2D `JogWheel` with the 3D wrapper:

```tsx
// Before (2D Mode)
import { JogWheel } from './JogWheel';

<JogWheel
  artworkUrl={trackData?.artUrl}
  title={trackData?.title}
  progress={progress}
  isPlaying={deck.isPlaying}
  bpm={currentBpm}
  accent={jogAccent}
/>
```

```tsx
// After (3D Mode)
import { JogWheel3DWrapper } from './JogWheel3DWrapper';

<JogWheel3DWrapper
  deckId={deckId}
  artworkUrl={trackData?.artUrl}
  progress={progress}
  isPlaying={deck.isPlaying}
  bpm={currentBpm}
  accent={jogAccent}
/>
```

### Step 2: Test Interaction

**Top Surface (Scratch):**
- Click and drag on the center of the platter
- The track should scrub forward/backward

**Side Edge (Pitch Bend):**
- Click and drag on the outer rim
- The playback rate should nudge temporarily

---

## Option 2: Conditional 3D Mode (Advanced)

### Add a Toggle Button

```tsx
import { Deck3DToggle, use3DMode } from './Deck3DToggle';

function DeckControls({ deckId }: { deckId: 'A' | 'B' }) {
  const is3DMode = use3DMode();

  return (
    <div>
      <Deck3DToggle />

      {is3DMode ? (
        <JogWheel3DWrapper
          deckId={deckId}
          artworkUrl={trackData?.artUrl}
          progress={progress}
          isPlaying={deck.isPlaying}
          bpm={currentBpm}
          accent={jogAccent}
        />
      ) : (
        <JogWheel
          artworkUrl={trackData?.artUrl}
          progress={progress}
          isPlaying={deck.isPlaying}
          bpm={currentBpm}
          accent={jogAccent}
        />
      )}
    </div>
  );
}
```

---

## Option 3: Standalone 3D Scene

### Embed in Main Scene3D

If you want the jog wheels in the main 3D scene instead of isolated canvases:

```tsx
// In Scene3D.tsx
import { JogPlatter3D } from './JogPlatter3D';

<Canvas>
  <ReactiveLighting />

  {/* Deck A Jog Wheel */}
  <group position={[-2, 0, 0]}>
    <JogPlatter3D
      deckId="A"
      artworkUrl={deckA.trackData?.artUrl}
      isPlaying={deckA.isPlaying}
      bpm={deckA.trackData?.bpm}
      progress={progressA}
      accent="#22d3ee"
      onScratch={(delta) => handleScratchA(delta)}
      onBend={(amount) => handleBendA(amount)}
    />
  </group>

  {/* Deck B Jog Wheel */}
  <group position={[2, 0, 0]}>
    <JogPlatter3D
      deckId="B"
      artworkUrl={deckB.trackData?.artUrl}
      isPlaying={deckB.isPlaying}
      bpm={deckB.trackData?.bpm}
      progress={progressB}
      accent="#a855f7"
      onScratch={(delta) => handleScratchB(delta)}
      onBend={(amount) => handleBendB(amount)}
    />
  </group>
</Canvas>
```

---

## 🎨 Customization

### Change Platter Size

```tsx
// In JogPlatter3D.tsx, modify the cylinder args
<cylinderGeometry args={[
  1.5,     // Top radius (default: 1)
  1.5,     // Bottom radius
  0.05,    // Height
  64       // Segments
]} />
```

### Change Material

```tsx
<meshStandardMaterial
  color="#0a0a0a"      // Base color
  metalness={0.9}      // 0 = matte, 1 = mirror
  roughness={0.2}      // 0 = smooth, 1 = rough
  envMapIntensity={1.5} // Environment reflection
/>
```

### Custom Accent Colors

```tsx
<JogWheel3DWrapper
  deckId="A"
  accent="#00ff00"  // Neon green
  // ... other props
/>
```

### Add Custom Textures

```tsx
// Create public/images/vinyl-texture.png
<JogPlatter3D
  artworkUrl="/images/vinyl-texture.png"
  // ... other props
/>
```

---

## 🎮 Touch Zone Configuration

### Adjust Touch Sensitivity

In `JogPlatter3D.tsx`:

```typescript
const handlePointerDown = (event: any) => {
  const point = event.point;
  const distance = Math.hypot(point.x, point.z);

  // Adjust threshold (default: 0.8)
  const zone = distance > 0.7 ? 'side' : 'top';  // More sensitive edge
  setDragZone(zone);
};
```

### Change Scratch Speed

In `JogWheel3DWrapper.tsx`:

```typescript
const handleScratch = (delta: number) => {
  const beatsPerRotation = 4;  // Change to 2 for faster scrubbing
  // ... rest of code
};
```

### Change Pitch Bend Range

In `JogWheel3DWrapper.tsx`:

```typescript
const handleBend = (amount: number) => {
  // Change max range (default: ±8%)
  const bendAmount = Math.max(-0.16, Math.min(0.16, amount * 0.01)); // ±16%
  // ... rest of code
};
```

---

## 🔧 Troubleshooting

### Issue: Platter Not Rotating

**Check:**
1. `isPlaying` prop is correctly set
2. `bpm` prop is a valid number (not 0 or undefined)
3. Audio Engine is initialized

**Debug:**
```tsx
console.log('Platter State:', { isPlaying, bpm, progress });
```

### Issue: Scratch Not Working

**Check:**
1. `onScratch` callback is wired to Audio Engine
2. `seekTo()` method exists in `useAudioEngine`
3. Deck duration is set correctly

**Debug:**
```tsx
const handleScratch = (delta: number) => {
  console.log('Scratch Delta:', delta);
  // ... rest of code
};
```

### Issue: Texture Not Loading

**Check:**
1. Image path is correct (`/images/...` for public folder)
2. Image is power-of-2 dimensions (512×512, 1024×1024)
3. CORS headers if loading from external URL

**Fallback:**
```tsx
const artworkTexture = useLoader(
  TextureLoader,
  artworkUrl || '/images/placeholder-vinyl.png',
  undefined,
  (error) => console.error('Texture load failed:', error)
);
```

### Issue: Poor Performance

**Solutions:**
1. Lower texture resolution
2. Reduce geometry segments
3. Disable shadows
4. Cap DPR lower

```tsx
<Canvas
  dpr={[1, 1]}  // Force low DPR
  gl={{ antialias: false }}  // Disable AA
>
```

---

## 📊 Performance Tips

### Mobile Optimization

```tsx
import { isMobile } from 'react-device-detect';

<Canvas
  dpr={isMobile ? [1, 1] : [1, 1.5]}
  gl={{
    antialias: !isMobile,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  }}
>
```

### Reduce Vinyl Grooves

```tsx
{/* Show fewer grooves on mobile */}
{[...new Array(isMobile ? 4 : 8)].map((_, i) => {
  // ... groove render
})}
```

### Conditional Shadows

```tsx
<spotLight
  // ... other props
  castShadow={!isMobile}
/>
```

---

## 🎓 Best Practices

1. **Always provide fallback textures**
   - Use a placeholder image for missing artwork

2. **Clamp user input**
   - Prevent extreme pitch bends or scrub positions

3. **Dispose resources on unmount**
   - React Three Fiber handles this automatically

4. **Test on real hardware**
   - 3D performance varies greatly by device

5. **Provide 2D fallback**
   - For low-end devices or user preference

---

## 🚀 Next Steps

Once the basic 3D Jog Wheels are working:

1. **Add Hot Cues:** Visual markers on the platter rim
2. **Implement Slip Mode:** Platter spins while track is cued
3. **Vinyl Stop Effect:** Gradual deceleration on stop
4. **Haptic Feedback:** Vibration on touch (mobile)
5. **Custom Vinyl Skins:** User-uploaded textures

---

## 📖 API Reference

### JogPlatter3D Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `deckId` | `'A' \| 'B'` | Required | Deck identifier |
| `artworkUrl` | `string \| undefined` | `undefined` | Album art URL |
| `isPlaying` | `boolean` | Required | Playback state |
| `bpm` | `number \| undefined` | `120` | Track BPM |
| `progress` | `number` | Required | 0-1 playback progress |
| `accent` | `string \| undefined` | `'#22d3ee'` | Accent color (hex) |
| `onScratch` | `(delta: number) => void \| undefined` | `undefined` | Scratch callback |
| `onBend` | `(amount: number) => void \| undefined` | `undefined` | Pitch bend callback |

### JogWheel3DWrapper Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `deckId` | `'A' \| 'B'` | Required | Deck identifier |
| `artworkUrl` | `string \| undefined` | `undefined` | Album art URL |
| `progress` | `number` | Required | 0-1 playback progress |
| `isPlaying` | `boolean` | Required | Playback state |
| `bpm` | `number \| undefined` | `undefined` | Track BPM |
| `accent` | `string \| undefined` | `'#22d3ee'` | Accent color |
| `className` | `string \| undefined` | `''` | Additional CSS classes |

---

## 📝 Example: Full Integration

```tsx
import { useState, useEffect } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useStore } from '@/store/useStore';
import { useStudioStore } from '@/store/useStudioStore';
import { JogWheel3DWrapper } from '@/components/studio/ui/JogWheel3DWrapper';

export function DeckA() {
  const { getDeckDuration, getPlaybackPosition } = useAudioEngine();
  const deck = useStore((state) => state.deckA);
  const deckTime = useStudioStore((state) => state.A.currentTime);
  const deckDuration = useStudioStore((state) => state.A.duration);

  const progress = deckDuration > 0 ? deckTime / deckDuration : 0;
  const currentBpm = deck.trackData?.bpm || 120;

  return (
    <div className="deck-container">
      <JogWheel3DWrapper
        deckId="A"
        artworkUrl={deck.trackData?.artUrl}
        progress={progress}
        isPlaying={deck.isPlaying}
        bpm={currentBpm}
        accent="#22d3ee"
        className="mx-auto"
      />
    </div>
  );
}
```

---

**Ready to spin! 🎧**
For more details, see [`docs/PHASE_VI_3D_IMMERSION.md`](./PHASE_VI_3D_IMMERSION.md)
