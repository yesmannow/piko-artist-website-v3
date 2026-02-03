# Phase II Quick Reference

## Import Path
```typescript
import { Fader, Knob } from '@/components/studio/controls';
```

## Fader Component

### Basic Usage
```typescript
<Fader
  value={0.75}
  onValueChange={(v) => console.log('New value:', v)}
  label="VOLUME"
  height={120}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `0.75` | Current value (0.0 - 1.0) |
| `onValueChange` | `(value: number) => void` | - | Callback fired instantly during drag |
| `height` | `number` | `120` | Fader track height in pixels |
| `label` | `string` | - | Label displayed below fader |
| `disabled` | `boolean` | `false` | Disable interaction |
| `className` | `string` | `''` | Additional CSS classes |

### Typical Heights
- Compact: 100px
- Standard: 120-150px
- Tall: 180-200px

## Knob Component

### Basic Usage
```typescript
<Knob
  value={0.5}
  onValueChange={(v) => console.log('New value:', v)}
  label="LOW"
  size={60}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `0.5` | Current value (0.0 - 1.0) |
| `onValueChange` | `(value: number) => void` | - | Callback fired instantly during rotation |
| `size` | `number` | `48` | Knob diameter in pixels |
| `rotationRange` | `number` | `270` | Total rotation arc in degrees |
| `label` | `string` | - | Label displayed below knob |
| `disabled` | `boolean` | `false` | Disable interaction |
| `className` | `string` | `''` | Additional CSS classes |
| `sensitivity` | `number` | `1` | Drag-to-rotation multiplier |

### Typical Sizes
- Small: 48px (gain/filter knobs)
- Medium: 56-60px (EQ knobs)
- Large: 68-70px (master/featured controls)

### Typical Rotation Ranges
- Standard: 270° (default, -135° to +135°)
- Wide: 300° (more precision for filters)
- Narrow: 240° (for limited-range controls)

## Audio Engine Integration

### Volume Control
```typescript
const { setDeckVolume } = useAudioEngine();

<Fader
  value={volume}
  onValueChange={(v) => {
    setDeckVolume('A', v);      // Audio engine (instant)
    setVolumeState(v);          // UI state (async)
  }}
/>
```

### EQ Control
```typescript
const { setDeckEQ } = useAudioEngine();

<Knob
  value={eqLow}
  onValueChange={(v) => {
    const dbValue = v * 24 - 12;  // Map to -12dB to +12dB
    setDeckEQ('A', { low: dbValue, mid: 0, high: 0 });
    setEQLowState(v);
  }}
/>
```

### Filter Control
```typescript
const { setDeckFilter } = useAudioEngine();

<Knob
  value={filter}
  onValueChange={(v) => {
    setDeckFilter('A', v);      // Engine handles LP/HP logic
    setFilterState(v);
  }}
  rotationRange={300}           // Wider arc for precision
/>
```

## Common Patterns

### Pattern 1: Audio-First Updates
```typescript
const handleChange = useCallback((value: number) => {
  // 1. Update audio engine FIRST
  setAudioParam(value);

  // 2. Update UI state SECOND
  setLocalState(value);
}, [setAudioParam]);
```

### Pattern 2: Value Mapping
```typescript
// Linear to dB
const linearToDb = (v) => v > 0 ? 20 * Math.log10(v) : -Infinity;

// 0-1 to -12dB to +12dB
const mapToEQ = (v) => v * 24 - 12;

// 0-1 to BPM range
const mapToBPM = (v) => 60 + (v * 120); // 60-180 BPM
```

### Pattern 3: Prevent Feedback Loops
```typescript
const isUserInteracting = useRef(false);

const handleChange = useCallback((value: number) => {
  if (isUserInteracting.current) return;

  isUserInteracting.current = true;
  updateAudioEngine(value);

  requestAnimationFrame(() => {
    isUserInteracting.current = false;
  });
}, [updateAudioEngine]);
```

## Styling

### CSS Variables (from globals.css)
```css
--bg-primary: #121212        /* Background */
--bg-secondary: #1E1E1E      /* Control base */
--bg-tertiary: #2C2C2C       /* Elevated controls */
--text-primary: #E0E0E0      /* Labels */
--text-muted: #757575        /* Secondary text */
--accent-color: #009688      /* Indicators */
--accent-color-hover: #4DB6AC
--border-subtle: rgba(255,255,255,0.05)
```

### Custom Styling
```typescript
<Fader
  className="opacity-50 hover:opacity-100 transition-opacity"
  // ... other props
/>
```

## Performance Tips

1. ✅ **Always use `useCallback`** for `onValueChange` handlers
2. ✅ **Update audio engine first**, then UI state
3. ✅ **Clamp values** to 0-1 range before audio updates
4. ✅ **Use `requestAnimationFrame`** to batch state updates
5. ✅ **Avoid re-renders** during drag (motion values handle updates)
6. ❌ **Don't update state on every pixel** (motion subscription does this)
7. ❌ **Don't use inline functions** for `onValueChange`

## Debugging

### Enable Motion Debug
```typescript
import { MotionConfig } from 'framer-motion';

<MotionConfig isValidProp={() => true}>
  <YourComponent />
</MotionConfig>
```

### Check Audio Updates
```typescript
<Fader
  onValueChange={(v) => {
    console.log('Fader value:', v);
    setAudioVolume('A', v);
  }}
/>
```

### Monitor Performance
```typescript
useEffect(() => {
  const start = performance.now();
  setAudioParam(value);
  const end = performance.now();
  console.log(`Audio update took ${end - start}ms`);
}, [value]);
```

## Migration from Old Controls

| Old Prop | New Prop | Notes |
|----------|----------|-------|
| `onChange` | `onValueChange` | Callback signature unchanged |
| `color` | _(removed)_ | Uses CSS variables now |
| `bipolar` | _(removed)_ | Use `rotationRange={300}` |

## Common Mistakes

### ❌ Wrong
```typescript
// Don't update state inside render
<Fader value={volume} onValueChange={setVolume} />
```

### ✅ Correct
```typescript
// Use callback to update audio + state
<Fader
  value={volume}
  onValueChange={useCallback((v) => {
    setAudioVolume('A', v);
    setVolume(v);
  }, [setAudioVolume])}
/>
```

---

**Need Help?** See:
- `PHASE_II_AUDIO_WIRING.md` - Full documentation
- `ControlsUsageExamples.tsx` - Code examples
- `PHASE_II_COMPLETION_SUMMARY.md` - Implementation summary
