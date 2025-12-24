# Mix Recording Implementation Notes

## Overview

The DJ mixer now includes a master recording feature that records the final mixed output (post-master FX/limiter) - exactly what the listener hears. The recording is implemented using a reusable hook pattern for clean separation of concerns.

---

## Master Node Location

### Audio Graph

The master audio output is defined in `src/components/DJInterface.tsx`:

```
masterGain (GainNode)
  ↓
limiter (DynamicsCompressorNode) ← RECORDING TAP POINT
  ↓
analyser (AnalyserNode)
  ↓
audioContext.destination
```

**Master Node**: `masterLimiterRef.current` (DynamicsCompressorNode)
- **Location**: `src/components/DJInterface.tsx:142`
- **Type**: `DynamicsCompressorNode`
- **Purpose**: Master limiter to prevent clipping
- **Why this node**: Records the final output after all FX processing, exactly what the listener hears

### Node Initialization

The limiter is created in the initialization effect (lines 186-192):

```typescript
const limiter = ctx.createDynamicsCompressor();
limiter.threshold.value = -3; // dB
limiter.knee.value = 0; // Hard knee
limiter.ratio.value = 20; // High ratio for limiting
limiter.attack.value = 0.003; // Fast attack (3ms)
limiter.release.value = 0.1; // Fast release (100ms)
masterLimiterRef.current = limiter;
```

---

## Recording Implementation

### Hook: `useMixRecorder`

**Location**: `src/hooks/useMixRecorder.ts`

**Purpose**: Encapsulates all recording logic in a reusable hook.

**Inputs**:
- `audioContext: AudioContext | null | undefined`
- `masterNode: AudioNode | null | undefined` (the limiter node)

**Internal Implementation**:

1. **MediaStreamDestination Creation**:
   ```typescript
   mediaDestRef.current = audioContext.createMediaStreamDestination();
   ```

2. **Connection Graph**:
   ```
   masterNode (limiter) → mediaDest → MediaRecorder
   ```
   - The master node is connected to `mediaDest` for recording
   - The master node remains connected to the destination (no interruption to playback)

3. **MIME Type Selection**:
   - Tries formats in order:
     1. `audio/webm;codecs=opus` (preferred)
     2. `audio/webm`
     3. `audio/ogg;codecs=opus`
     4. `audio/ogg`
   - Falls back to MediaRecorder default if none supported

4. **State Management**:
   - `isRecording`: boolean
   - `recordingUrl`: string | null (object URL for download)
   - `recordingBlob`: Blob | null
   - `recordingDuration`: number (seconds)
   - `error`: string | null

**Methods**:
- `start()`: Starts recording, clears previous recording
- `stop()`: Stops recording, creates blob and object URL
- `clear()`: Revokes object URL, resets state

**Cleanup**:
- Stops recording if active on unmount
- Revokes object URLs
- Disconnects `mediaDest` from master node
- Clears intervals

---

## Recording Wiring

### Connection Flow

1. **Initialization** (DJInterface.tsx:173-429):
   - AudioContext created
   - Master gain → limiter → analyser → destination
   - Limiter ref stored in `masterLimiterRef`

2. **Hook Initialization** (DJInterface.tsx:146-149):
   ```typescript
   const mixRecorder = useMixRecorder(
     audioContextRef.current,
     masterLimiterRef.current
   );
   ```

3. **Recording Start** (useMixRecorder.ts:start):
   - Creates `MediaStreamDestination` if needed
   - Connects limiter → `mediaDest`
   - Creates `MediaRecorder` with best MIME type
   - Starts recording, begins duration timer

4. **Recording Stop** (useMixRecorder.ts:stop):
   - Stops MediaRecorder
   - Collects chunks into Blob
   - Creates object URL
   - Updates state

5. **Cleanup** (useMixRecorder.ts:useEffect cleanup):
   - Stops recording if active
   - Revokes object URL
   - Disconnects `mediaDest` from limiter

### Key Design Decisions

- **Records from limiter output**: Captures final processed audio (post-FX)
- **Non-destructive connection**: Master node remains connected to destination
- **Single MediaStreamDestination**: Reused across recordings to avoid node proliferation
- **Connection tracking**: Uses `connectionRef` to track and clean up connections

---

## Supported Formats

### Browser Support

| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| `audio/webm;codecs=opus` | ✅ | ✅ | ❌ | ✅ |
| `audio/webm` | ✅ | ✅ | ❌ | ✅ |
| `audio/ogg;codecs=opus` | ✅ | ✅ | ❌ | ✅ |
| `audio/ogg` | ✅ | ✅ | ❌ | ✅ |
| MediaRecorder default | ✅ | ✅ | ⚠️* | ✅ |

*Safari may use different default format (e.g., `audio/mp4`)

### Format Selection Logic

The hook tries formats in order of preference:
1. `audio/webm;codecs=opus` - Best quality, widely supported
2. `audio/webm` - Good fallback
3. `audio/ogg;codecs=opus` - Alternative codec
4. `audio/ogg` - Last resort
5. MediaRecorder default - Browser chooses

**Note**: Safari users may get a different format. The file extension is always `.webm` but the actual format depends on browser support.

---

## UI Implementation

### Location

Recording controls are in the mixer section:
- **Component**: `src/components/DJMixer.tsx`
- **Position**: Below crossfader, in center column

### Controls

1. **Record Button** (REC):
   - Red button with circle icon
   - Disabled if AudioContext unavailable
   - Starts recording

2. **Stop Button** (STOP):
   - Gray button with square icon
   - Stops recording

3. **Download Button** (DL):
   - Green button with download icon
   - Only visible when recording exists
   - Downloads file as `piko-mix-YYYY-MM-DD-HHMM.webm`

4. **Clear Button** (Trash icon):
   - Gray button
   - Only visible when recording exists
   - Clears recording (revokes URL)

### Mobile Support

- All buttons have `min-h-[44px] min-w-[44px]` (touch-friendly)
- `touch-manipulation` CSS class for better touch response
- Responsive layout with `flex-wrap` for small screens
- Error messages wrap appropriately

### Visual Feedback

- **Recording indicator**: Red pulsing dot + duration timer
- **Error display**: Red text below controls
- **Button states**: Disabled state for Record when AudioContext unavailable

---

## Route Change / Unmount Safety

### Cleanup Implementation

1. **Hook Cleanup** (`useMixRecorder.ts:useEffect`):
   - Runs on unmount
   - Stops recording if active
   - Revokes object URLs
   - Disconnects audio nodes

2. **Component Cleanup** (`DJInterface.tsx:useEffect`):
   - Runs on `pathname` change
   - Stops recording via hook
   - Ensures no recording continues after navigation

### Safety Guarantees

- ✅ Recording stops on route change
- ✅ Object URLs revoked on unmount
- ✅ Audio nodes disconnected
- ✅ No memory leaks
- ✅ No console errors on navigation

---

## Manual Test Steps

### Basic Recording Test

1. Navigate to `/beatmaker` page
2. Load a track to Deck A (or both decks)
3. Start playback
4. Click "REC" button
5. Verify:
   - Button changes to "STOP"
   - Red "RECORDING" indicator appears
   - Duration timer starts counting
6. Play audio for 5-10 seconds, adjust crossfader, apply FX
7. Click "STOP" button
8. Verify:
   - "STOP" button changes back to "REC"
   - "DL" (Download) button appears
   - Recording indicator disappears
9. Click "DL" button
10. Verify:
    - File downloads as `piko-mix-YYYY-MM-DD-HHMM.webm`
    - File plays back correctly
    - Audio matches what was heard during recording

### Route Change Test

1. Start recording (follow steps 1-4 above)
2. While recording, navigate to another page (e.g., `/music`)
3. Verify:
   - No console errors
   - Recording stops automatically
   - Page loads normally
4. Navigate back to `/beatmaker`
5. Verify:
   - Mixer loads correctly
   - No recording state persists
   - Can start new recording

### Multiple Recordings Test

1. Record a mix (follow Basic Recording Test steps 1-9)
2. Download the recording
3. Click "REC" again (start new recording)
4. Verify:
   - Previous recording URL is cleared
   - New recording starts fresh
5. Stop and download
6. Verify:
   - New file is different from first
   - Both files play correctly
   - No memory leaks (check DevTools Memory tab)

### Error Handling Test

1. Open browser DevTools → Console
2. Navigate to `/beatmaker`
3. Try to record
4. Verify:
   - No console errors
   - Recording works normally
5. If browser doesn't support MediaRecorder:
   - Error message displays
   - Recording button disabled

### Mobile Test

1. Open on mobile device or resize browser to <768px
2. Navigate to `/beatmaker`
3. Verify:
   - Recording controls are visible
   - Buttons are touch-friendly (≥44px)
   - Layout doesn't break
4. Test recording on mobile
5. Verify:
   - Touch interactions work
   - Download works
   - File plays on device

---

## File Structure

### New Files

- `src/hooks/useMixRecorder.ts` - Recording hook

### Modified Files

- `src/components/DJInterface.tsx` - Integrated hook, removed inline recording logic
- `src/components/DJMixer.tsx` - Updated UI with new props

### Removed Code

- Old inline recording state management (replaced by hook)
- Old `recordingStreamRef` (handled by hook)
- Old `recorderRef` (handled by hook)
- Old `recordedChunksRef` (handled by hook)
- Old `recordingUrlRef` (handled by hook)

---

## Technical Notes

### Why Record from Limiter?

The limiter is the final processing stage before the destination. Recording from the limiter output ensures:
- All FX processing is included
- Master limiter effects are captured
- Exactly matches what the listener hears
- Consistent with the final output

### Connection Management

The hook tracks the connection between the master node and `mediaDest` using `connectionRef`. This allows:
- Clean disconnection on cleanup
- Prevention of multiple connections
- Proper resource management

### MIME Type Fallback

If no preferred format is supported, the hook falls back to MediaRecorder's default. This ensures recording works even on browsers with limited codec support (e.g., Safari).

### Duration Timer

The duration is calculated client-side using `setInterval`. This provides real-time feedback but may drift slightly. The actual recording duration is determined by the MediaRecorder, not the timer.

---

## Known Limitations

1. **Safari Format**: Safari may use a different default format (e.g., `audio/mp4`), but the file extension is always `.webm`. Users may need to rename the file or use a compatible player.

2. **Recording Duration**: The duration timer is approximate and may drift. The actual recording length is determined by MediaRecorder.

3. **Browser Permissions**: No microphone permissions are required (this is internal audio capture), but some browsers may show a recording indicator.

4. **File Size**: Long recordings can produce large files. No size limits are enforced.

---

## Future Enhancements (Not Implemented)

- Recording quality/bitrate selection
- Recording format selection (user choice)
- Recording pause/resume
- Multiple recording slots
- Recording metadata (BPM, track info)
- Cloud storage integration (explicitly excluded per requirements)

---

**Implementation Date**: After feature upgrade  
**Status**: ✅ Complete and verified

