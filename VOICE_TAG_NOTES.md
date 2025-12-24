# Voice Tag Implementation Notes

## Overview

The DJ mixer now includes an optional voice tag recorder that allows users to record short voice tags from their microphone and play them back as "drops" over the mix. Everything is handled locally - no server storage, no authentication, no uploads.

---

## Audio Graph Integration

### Master Node Location

The voice tag audio is routed through the master gain node:

```
masterGain (GainNode)
  ↓
limiter (DynamicsCompressorNode)
  ↓
analyser (AnalyserNode)
  ↓
audioContext.destination
```

**Master Node**: `masterGainRef.current` (GainNode)
- **Location**: `src/components/DJInterface.tsx:182`
- **Type**: `GainNode`
- **Purpose**: Master output gain control
- **Why this node**: Voice tags are injected at the master gain level so they go through the same FX chain (limiter, analyser) as the music

### Voice Tag Audio Routing

When microphone is enabled:

```
Microphone (MediaStream)
  ↓
micSource (MediaStreamAudioSourceNode)
  ↓
  ├─→ analyser (AnalyserNode) [for level meter]
  └─→ tagGain (GainNode)
       └─→ tagDest (MediaStreamAudioDestinationNode) [for recording]
```

When playing back a recorded tag:

```
tagBlob (Blob)
  ↓
audioBuffer (AudioBuffer) [decoded]
  ↓
source (AudioBufferSourceNode)
  ↓
tagGain (GainNode)
  ↓
masterGain (GainNode) [injected into master bus]
  ↓
limiter → analyser → destination
```

**Key Points**:
- Mic input is NOT connected to masterGain by default (to avoid feedback)
- Tag playback connects tagGain to masterGain dynamically
- Tag gain has volume control (default 70%)

---

## Implementation Details

### Hook: `useVoiceTag`

**Location**: `src/hooks/useVoiceTag.ts`

**Purpose**: Encapsulates all voice tag recording and playback logic.

**Inputs**:
- `audioContext: AudioContext | null | undefined`
- `masterNode: GainNode | null | undefined` (the master gain node)

**State**:
- `micEnabled: boolean` - Whether microphone is active
- `isRecording: boolean` - Whether currently recording
- `tagUrl: string | null` - Object URL for the recorded tag blob
- `tagBlob: Blob | null` - The recorded audio blob
- `tagDurationMs: number | null` - Duration of recorded tag in milliseconds
- `level: number` - Mic input level (0-1) for meter display
- `error: string | null` - Error message if something goes wrong

**Actions**:
- `enableMic(): Promise<void>` - Requests mic permission and sets up audio nodes
- `disableMic(): void` - Stops mic, disconnects nodes, cleans up
- `startTagRecording(): Promise<void>` - Starts recording from mic
- `stopTagRecording(): Promise<void>` - Stops recording and creates blob
- `clearTag(): void` - Clears recorded tag and revokes object URL
- `playTag(): void` - Plays recorded tag through master bus
- `stopTagPlayback(): void` - Stops current playback
- `setTagVolume(v: number): void` - Sets tag playback volume (0-1)

### Internal Audio Nodes

1. **MediaStreamAudioSourceNode** (`micSourceRef`)
   - Created from `getUserMedia()` stream
   - Routes mic input to analyser (meter) and recording destination

2. **GainNode** (`tagGainRef`)
   - Controls tag playback volume
   - Default gain: 0.7 (70%)
   - Connected to masterGain only during playback

3. **AnalyserNode** (`analyserRef`)
   - Used for level meter visualization
   - FFT size: 256
   - Updates at ~20-30fps via requestAnimationFrame

4. **MediaStreamAudioDestinationNode** (`tagDestRef`)
   - Destination for recording
   - Creates a MediaStream that MediaRecorder can record from

5. **AudioBufferSourceNode** (`playbackSourceRef`)
   - Created dynamically for each playback
   - Decoded from recorded blob
   - Auto-stops when buffer ends

### Recording Flow

1. User clicks "Enable Mic" → `enableMic()`
   - Requests `getUserMedia({ audio: true })`
   - Creates micSource, tagGain, analyser, tagDest
   - Connects: micSource → analyser (meter)
   - Connects: micSource → tagGain → tagDest (recording path)
   - Does NOT connect to masterGain (avoids feedback)

2. User clicks "Record" → `startTagRecording()`
   - If mic not enabled, calls `enableMic()` first
   - Creates MediaRecorder with best supported MIME type
   - Records from tagDest.stream
   - Collects chunks in `recordedChunksRef`

3. User clicks "Stop" → `stopTagRecording()`
   - Stops MediaRecorder
   - Creates Blob from chunks
   - Creates object URL for blob
   - Updates state with tagUrl, tagBlob, duration

### Playback Flow

1. User clicks "Drop" → `playTag()`
   - Decodes blob to AudioBuffer
   - Creates AudioBufferSourceNode
   - Ensures tagGain exists and is connected to masterGain
   - Connects: source → tagGain → masterGain
   - Starts playback
   - Auto-cleans up when playback ends

### Format Support

The hook tries formats in this order:
1. `audio/webm;codecs=opus` (preferred)
2. `audio/webm`
3. `audio/mp4`
4. `audio/ogg;codecs=opus`
5. `audio/ogg`
6. Default (let MediaRecorder choose)

Download filename format: `piko-voice-tag-YYYY-MM-DD-HHMM.{webm|mp4}`

---

## UI Component

### VoiceTagPanel

**Location**: `src/components/VoiceTagPanel.tsx`

**Features**:
- Enable/Disable microphone button
- Record/Stop recording button
- Play/Drop tag button (disabled if no tag)
- Download tag button
- Clear tag button
- Level meter (visual bar, updates in real-time)
- Tag volume slider (0-100%)
- Status indicators (recording, mic enabled, tag ready)
- Error messages

**Mobile-Friendly**:
- All buttons have `min-h-[44px] min-w-[44px]` for touch targets
- `touch-manipulation` CSS for better mobile interaction
- Responsive layout that stacks on small screens

---

## Safety & Cleanup

### Permission Handling

- Mic permission is only requested when user clicks "Enable Mic"
- Clear error messages if permission denied or mic unavailable
- Graceful fallback if MediaRecorder not supported

### Cleanup on Unmount/Route Change

The hook's cleanup effect handles:

1. **Stop recording** if active
   - Stops MediaRecorder
   - Clears duration interval

2. **Stop playback** if active
   - Stops AudioBufferSourceNode

3. **Stop all stream tracks**
   - Calls `stop()` on all MediaStream tracks
   - Releases mic/camera indicator

4. **Revoke object URLs**
   - Calls `URL.revokeObjectURL()` to free memory

5. **Disconnect all audio nodes**
   - Disconnects micSource, tagGain, analyser, tagDest
   - Handles errors gracefully (nodes may already be disconnected)

6. **Cancel animation frames**
   - Cancels requestAnimationFrame for level meter

### Feedback Prevention

- Mic input is NOT connected to masterGain by default
- No monitoring of mic input through speakers (would cause feedback)
- Tag playback is one-shot (doesn't loop)
- Tag gain is conservative (default 70%)

---

## Manual Testing Checklist

### Basic Functionality

- [ ] Click "Enable Mic" → Browser prompts for permission
- [ ] Grant permission → "MIC ENABLED" status appears, level meter shows activity
- [ ] Click "Record" → Recording starts, "RECORDING" indicator appears
- [ ] Speak into mic for 2-5 seconds
- [ ] Click "Stop" → Recording stops, "TAG READY" appears with duration
- [ ] Click "Drop" → Tag plays through speakers (audible over mix)
- [ ] Click "Download" → File downloads with correct name and format
- [ ] Open downloaded file in media player → Plays correctly
- [ ] Click "Clear" → Tag is cleared, buttons disable appropriately

### Error Handling

- [ ] Deny mic permission → Error message appears, "Retry" option
- [ ] Click "Record" without enabling mic → Mic enables automatically
- [ ] Navigate away while recording → Recording stops, no console errors
- [ ] Navigate away while mic enabled → Mic tracks stop, indicator turns off

### Mobile Testing

- [ ] Panel is visible on mobile
- [ ] All buttons are tappable (44px minimum)
- [ ] Layout doesn't break on small screens
- [ ] Level meter is visible and updates

### Integration Testing

- [ ] Voice tag plays while music is playing → Tag is audible over mix
- [ ] Voice tag goes through master limiter → No clipping
- [ ] Multiple tags can be recorded and played
- [ ] Tag volume slider works → Volume changes during playback
- [ ] Mix recorder still works → No interference

---

## Files Changed

1. **`src/hooks/useVoiceTag.ts`** (new)
   - Main hook implementation
   - Handles mic input, recording, playback, cleanup

2. **`src/components/VoiceTagPanel.tsx`** (new)
   - UI component for voice tag controls
   - Mobile-friendly buttons and indicators

3. **`src/components/DJInterface.tsx`** (modified)
   - Imports and initializes `useVoiceTag` hook
   - Adds `VoiceTagPanel` component to UI
   - Adds download handler for voice tags

---

## Notes

- **No persistent storage**: Tags are only stored in memory for the current session
- **No server upload**: Everything is local-only
- **No AI/STT**: Just raw audio recording and playback
- **Conservative defaults**: Mic gain at 70% to prevent clipping
- **Format fallback**: Automatically selects best supported format
- **Clean architecture**: Follows same pattern as `useMixRecorder` hook

---

## Future Enhancements (Not Implemented)

- Multiple tag slots/library
- Tag trimming/editing
- Effects on tags (reverb, delay, etc.)
- Tag preview before dropping
- Keyboard shortcuts
- Tag templates/presets

