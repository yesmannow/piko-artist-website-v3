# useAudioSystem Hook - Phase 1 Implementation

## Overview

The `useAudioSystem` hook provides a unified, singleton-based audio system for the DJ mixer application with ultra-low latency (<20ms target) and multi-threaded audio processing via AudioWorklets.

## Features

- ✅ **Singleton AudioContext** with `latencyHint: 'interactive'`
- ✅ **AudioWorklet Loading** on user gesture (autoplay policy compliant)
- ✅ **Auto-resume** for suspended contexts
- ✅ **SharedArrayBuffer** control state support
- ✅ **Sample-accurate scheduling** via `AudioContext.currentTime`
- ✅ **iOS Audio Unlock** with silent buffer hack
- ✅ **Platform Detection** (iOS, Android, Safari, mobile)
- ✅ **Latency Calculation** (baseLatency + outputLatency)

## Usage Example

```typescript
import { useAudioSystem } from '@/hooks/useAudioSystem';

function DJMixer() {
  const {
    audioContext,
    isReady,
    workletsLoaded,
    isUnlocked,
    totalLatency,
    platform,
    initializeAudio,
    resumeAudio,
    scheduleAt,
    getCurrentTime,
  } = useAudioSystem({
    debug: true,
    latencyHint: 'interactive',
    workletModules: [
      '/worklets/mixer-processor.js',
      '/worklets/sidechain-processor.js',
    ],
  });

  // Initialize on user interaction (e.g., click "Start DJ" button)
  const handleStart = async () => {
    await initializeAudio();
  };

  // Sample-accurate scheduling
  const playSound = () => {
    if (!audioContext || !isReady) return;

    // Create a simple tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Schedule to start 100ms from now (sample-accurate)
    const startTime = scheduleAt(0.1);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.5); // Play for 500ms
  };

  return (
    <div>
      <h1>DJ Mixer</h1>
      
      <div>
        <p>Audio System Status:</p>
        <ul>
          <li>Ready: {isReady ? '✅' : '❌'}</li>
          <li>Worklets Loaded: {workletsLoaded ? '✅' : '❌'}</li>
          <li>iOS Unlocked: {isUnlocked ? '✅' : '❌'}</li>
          <li>Latency: {(totalLatency * 1000).toFixed(2)}ms</li>
          <li>Platform: {platform.isMobile ? 'Mobile' : 'Desktop'}</li>
          {platform.isIOS && <li>iOS Device: ✅</li>}
          {platform.isSafari && <li>Safari Browser: ✅</li>}
        </ul>
      </div>
      
      <button onClick={handleStart} disabled={isReady}>
        {isReady ? 'Audio System Ready' : 'Initialize Audio'}
      </button>
      
      <button onClick={playSound} disabled={!isReady}>
        Play Test Sound
      </button>
    </div>
  );
}
```

## Configuration Options

```typescript
interface AudioSystemConfig {
  /**
   * Sample rate for AudioContext (default: browser optimal)
   * Recommended: Let browser choose for best latency
   */
  sampleRate?: number;
  
  /**
   * Latency hint for AudioContext (default: 'interactive')
   * - 'interactive': Ultra-low latency for real-time apps
   * - 'balanced': Balanced latency and power consumption
   * - 'playback': Higher latency but better stability
   */
  latencyHint?: 'interactive' | 'balanced' | 'playback';
  
  /**
   * Enable debug logging (default: false)
   */
  debug?: boolean;
  
  /**
   * AudioWorklet modules to load (paths relative to public/)
   */
  workletModules?: string[];
}
```

## Return Values

```typescript
interface AudioSystemState {
  // Core audio context (singleton)
  audioContext: AudioContext | null;
  
  // System ready state
  isReady: boolean;
  
  // AudioWorklets loaded successfully
  workletsLoaded: boolean;
  
  // iOS audio unlocked (mobile only)
  isUnlocked: boolean;
  
  // Total audio latency in seconds
  totalLatency: number;
  
  // Platform detection
  platform: {
    isIOS: boolean;
    isAndroid: boolean;
    isSafari: boolean;
    isMobile: boolean;
  };
}

// Control functions
interface AudioSystemControls {
  // Initialize audio system (call from user gesture)
  initializeAudio: () => Promise<void>;
  
  // Resume suspended audio context
  resumeAudio: () => Promise<void>;
  
  // Get current audio time (for scheduling)
  getCurrentTime: () => number;
  
  // Schedule at specific offset (returns absolute time)
  scheduleAt: (offset: number) => number;
}
```

## Sample-Accurate Scheduling

Always use `AudioContext.currentTime` for scheduling, not `Date.now()` or `performance.now()`:

```typescript
// ❌ Wrong - uses JS timer (not sample-accurate)
setTimeout(() => {
  oscillator.start();
}, 100);

// ✅ Correct - uses Web Audio clock (sample-accurate)
const { audioContext, scheduleAt } = useAudioSystem();
const startTime = scheduleAt(0.1); // 100ms from now
oscillator.start(startTime);
```

## iOS Audio Unlock

The hook automatically handles iOS audio unlock:

1. Creates an inaudible silent buffer loop
2. Keeps audio session active (prevents throttling)
3. Detects iOS/Safari and applies platform-specific optimizations
4. Returns `isUnlocked` state for UI feedback

No manual intervention required!

## Platform-Specific Optimizations

### iOS/Safari
- Silent buffer loop keeps audio session active
- Small buffer sizes (<20ms achievable)
- Automatic unlock on first user gesture

### Android
- Uses `latencyHint: 'interactive'`
- Optimal buffer sizes per device

### Desktop
- Maximum performance
- Lowest possible latency

## Integration with Existing Audio Store

The `useAudioSystem` hook is designed to work alongside the existing `useAudioStore`:

```typescript
// Option 1: Use useAudioSystem directly (recommended for new code)
const { audioContext, isReady } = useAudioSystem();

// Option 2: Use existing useAudioStore (legacy compatibility)
const { audioContext, isReady } = useAudioStore();

// Both can coexist - useAudioSystem provides enhanced features
```

## Next Steps (Phase 2+)

- [ ] Modular audio graph (source→EQ→filters→faders→mixer)
- [ ] Client-side stem separation (WASM Demucs/Spleeter)
- [ ] Mathematical beat-syncing with PLL control
- [ ] Gesture-physics UI integration
- [ ] WebMIDI hardware support

## Technical Details

### Singleton Pattern
The AudioContext is created once and reused across all hook instances:

```typescript
// Global singleton
let globalAudioContext: AudioContext | null = null;

function getOrCreateAudioContext(config) {
  if (globalAudioContext) {
    return globalAudioContext; // Reuse existing
  }
  globalAudioContext = new AudioContext({
    latencyHint: 'interactive',
  });
  return globalAudioContext;
}
```

### Silent Buffer (iOS Hack)
Keeps Safari audio session active:

```typescript
function playSilentBuffer(audioContext) {
  const buffer = audioContext.createBuffer(1, sampleRate, sampleRate);
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true; // Loop forever
  
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.00001; // Essentially inaudible
  
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}
```

### Latency Measurement
Total latency = base latency + output latency:

```typescript
const baseLatency = audioContext.baseLatency || 0;
const outputLatency = audioContext.outputLatency || 0;
const totalLatency = baseLatency + outputLatency;

console.log(`Total latency: ${(totalLatency * 1000).toFixed(2)}ms`);
```

## Performance Considerations

1. **Zero Main Thread DSP**: All audio processing in AudioWorklets
2. **Lock-free Updates**: SharedArrayBuffer for parameter changes
3. **Sample-accurate Timing**: Web Audio clock for drift-free scheduling
4. **Platform Optimization**: Tailored settings per device/browser

## Troubleshooting

### Audio not starting
- Ensure `initializeAudio()` is called from user gesture (click, touch)
- Check `isReady` state before playing audio

### High latency on mobile
- Verify `latencyHint: 'interactive'` is set
- Check `totalLatency` value in console
- iOS Safari: typically 10-20ms
- Android: varies by device (20-50ms)

### AudioWorklet not loading
- Verify worklet files exist in `/public/worklets/`
- Check browser console for errors
- Ensure COOP/COEP headers set (see middleware.ts)

### iOS audio cuts out
- Silent buffer should keep session active
- Check `isUnlocked` state
- Verify first user gesture occurred
