# DJ Studio Mixer Audio Playback Fix

## Issue Description
The DJ studio mixer audio playback was not working. When pressing play on a deck track, the spinning animation would appear but no sound would play.

## Root Cause
The FX lowpass filter was initialized to 1000 Hz instead of 20000 Hz in the DJInterface component, causing all audio frequencies above 1 kHz to be heavily filtered out. This made audio playback nearly inaudible or completely silent.

### Why This Happened
There was a mismatch between React state and Web Audio API node initialization:
- **React State**: `filterFreqA` and `filterFreqB` initialized to `20000` Hz (wide open, neutral)
- **Audio Node**: `fxFilterA.frequency.value` and `fxFilterB.frequency.value` initialized to `1000` Hz (heavy low-pass filter)

Since the useEffect that syncs state to nodes only runs when state changes, and the initial state was already "correct" at 20000 Hz, the audio nodes remained stuck at 1000 Hz. Users had no indication that the filter was applied, making this a silent bug.

## Changes Made

### File: `/src/components/DJInterface.tsx`

1. **Line 584**: Changed FX Filter A initialization
   ```typescript
   // Before:
   fxFilterA.frequency.value = 1000;
   
   // After:
   fxFilterA.frequency.value = 20000; // Match initial state (wide open, no filtering)
   ```

2. **Line 630**: Changed FX Filter B initialization
   ```typescript
   // Before:
   fxFilterB.frequency.value = 1000;
   
   // After:
   fxFilterB.frequency.value = 20000; // Match initial state (wide open, no filtering)
   ```

3. **Line 328**: Fixed Clear All FX handler for Deck A
   ```typescript
   // Before:
   setFilterFreqA(1000);
   
   // After:
   setFilterFreqA(20000); // Reset to wide open (neutral/bypass)
   ```

4. **Line 337**: Fixed Clear All FX handler for Deck B
   ```typescript
   // Before:
   setFilterFreqB(1000);
   
   // After:
   setFilterFreqB(20000); // Reset to wide open (neutral/bypass)
   ```

5. **Lines 2759, 2763**: Fixed bypass handlers
   ```typescript
   // Before:
   if (bypass) setFilterFreqA(1000);
   if (bypass) setFilterFreqB(1000);
   
   // After:
   if (bypass) setFilterFreqA(20000); // Reset to wide open (neutral/bypass)
   if (bypass) setFilterFreqB(20000); // Reset to wide open (neutral/bypass)
   ```

## Audio Architecture

The DJ mixer uses the following audio routing (verified to be correct):

```
MediaElement (HTML5 Audio)
  ↓
MediaElementSource (Web Audio API)
  ↓
Deck EQ Chain (Low → Mid → High Filters)
  ↓
Deck Gain (Volume Control)
  ↓
Pre-FX Gain
  ↓
Distortion (WaveShaper)
  ↓
FX Filter [BUG WAS HERE - initialized to 1000 Hz instead of 20000 Hz]
  ↓
Multiple Parallel Wet/Dry Paths:
  - Dry Signal → Master Gain
  - Delay → Delay Gain → Master Gain
  - Reverb → Reverb Gain → Master Gain
  - Flanger → Master Gain
  - Phaser → Master Gain
  - Chorus → Master Gain
  - Echo (multiple taps) → Master Gain
  ↓
Master Gain
  ↓
Master Limiter (DynamicsCompressor)
  ↓
Analyser (for VU meters)
  ↓
Destination (Speakers/Headphones)
```

## Verification

### Build Verification
```bash
npm run lint              # ✅ Passed (no errors, only pre-existing warnings)
npm run build:workers     # ✅ All 5 workers compiled successfully
```

### Manual Testing Required
To verify the fix works:

1. Open `/studio` page (desktop DJ mixer)
2. Load a track to Deck A using the library sidebar
3. Press Play on Deck A
4. **Expected**: Audio should play at full frequency range (crisp, clear sound)
5. Repeat for Deck B
6. Test FX controls:
   - Adjust filter frequency slider - should affect audio
   - Enable/disable bypass - should reset to neutral (no filter)
   - Click "Clear All FX" - should reset to neutral

### Deck Independence
- Deck A and Deck B have completely independent FX chains
- Changes to Deck A FX should not affect Deck B and vice versa
- Each deck has its own: filter, reverb, delay, distortion, flanger, phaser, chorus, echo

## Impact
- **Scope**: Minimal - only initialization values changed
- **Breaking Changes**: None
- **API Changes**: None
- **Files Modified**: 1 file, 6 lines total
- **Risk**: Very low - only fixes a clear bug

## Related Components

### Main DJ Studio Mixer (Active)
- `/src/components/DJInterface.tsx` - Main mixer interface (FIXED)
- `/src/components/DJDeck.tsx` - Individual deck component
- `/src/components/DJMixer.tsx` - Mixer controls and crossfader
- `/src/components/FXUnit.tsx` - Effects unit for each deck

### Alternative Audio Systems (Separate, Not Affected)
- `/src/components/SimpleDeck.tsx` - Uses AudioEngine.ts
- `/src/components/SimpleMixer.tsx` - Uses AudioEngine.ts
- `/src/engine/AudioEngine.ts` - Separate audio engine (not used by main studio)
- `/src/store/useAudioStore.ts` - Store for AudioEngine.ts
- `/src/stores/useAudioStore.ts` - Different audio store (AudioWorklet-based)

These alternative systems are independent and were not affected by the bug or the fix.

## Prevention
To prevent similar issues in the future:

1. **Always match initial state with initial node values**
2. **Use constants for default/neutral values** (e.g., `const NEUTRAL_FILTER_FREQ = 20000`)
3. **Add unit tests** for audio node initialization
4. **Document expected initial values** in comments

## Testing Checklist
- [ ] Deck A plays audio at full frequency range
- [ ] Deck B plays audio at full frequency range
- [ ] FX filter slider affects audio on Deck A
- [ ] FX filter slider affects audio on Deck B
- [ ] Bypass resets filter to neutral (no effect)
- [ ] Clear All FX resets filter to neutral
- [ ] Deck A FX don't affect Deck B
- [ ] Deck B FX don't affect Deck A
- [ ] Multiple FX can be active simultaneously
- [ ] Crossfader mixes between decks correctly
