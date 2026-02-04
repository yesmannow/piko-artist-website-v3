# Piko Studio — Quick Reference

**Keyboard Shortcuts, Controls, and Features**
**Last Updated:** February 4, 2026

---

## ⌨️ Keyboard Shortcuts

### Playback Controls

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Space` | Play/Pause | Toggle master playback |
| `→` | Jog Forward | Skip ahead 1 beat |
| `←` | Jog Backward | Skip back 1 beat |
| `Shift + →` | Precision Jog Forward | Skip ahead 0.1 second |
| `Shift + ←` | Precision Jog Back | Skip back 0.1 second |

### Stem Controls

| Shortcut | Action | Stem |
|----------|--------|------|
| `1` | Toggle Vocals | Vocals stem on/off |
| `2` | Toggle Drums | Drums stem on/off |
| `3` | Toggle Bass | Bass stem on/off |
| `4` | Toggle Other | Other (melody/synth) stem on/off |

**Tip:** Hold multiple number keys to isolate specific stems!

### Deck Focus

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Q` | Focus Deck A | Switch control to left deck |
| `W` | Focus Deck B | Switch control to right deck |

### Recording

| Shortcut | Action | Platform |
|----------|--------|----------|
| `Cmd + R` | Start/Stop Recording | macOS |
| `Ctrl + R` | Start/Stop Recording | Windows/Linux |

**Output:** WebM (192kbps)
**Filename:** `piko-mix-YYYY-MM-DDTHH-MM-SS.webm`

---

## 🎚️ Deck Controls

### Transport Controls

- **Play/Pause:** Start/stop deck playback
- **Sync:** Match BPM to master tempo
- **Cue:** Set/jump to cue point
- **Nudge +/-:** Fine tempo adjustment

### EQ (3-Band Equalizer)

- **High:** 12kHz+ (hi-hats, cymbals)
- **Mid:** 400Hz-12kHz (vocals, snares)
- **Low:** <400Hz (kick, bass)

**Range:** -∞ to +6dB
**Kill:** Full cut at minimum position

### Filters

- **High Pass:** Cut frequencies below threshold (bass removal)
- **Low Pass:** Cut frequencies above threshold (muffle effect)

**Range:** 20Hz - 20kHz

### FX Sends

- **Reverb:** Space/ambience effect
- **Delay:** Echo/repeat effect

**Range:** 0-100% wet mix

---

## 🎛️ Mixer Controls

### Crossfader

- **Position:** -1 (full A) to +1 (full B)
- **Curve:** Equal power (constant loudness)
- **Formula:** `G_A² + G_B² = 1`

### Master Volume

- **Range:** 0-100%
- **Protection:** Limiter at -0.1dB

### Master Dynamics

- **Compressor:** Automatic level control
  - Threshold: -24dB
  - Ratio: 12:1
  - Attack: 3ms
  - Release: 250ms

- **Limiter:** Brick-wall protection at -0.1dB

---

## 📚 Library Controls

### Track Loading

- **Drag & Drop:** Drag track to deck to load
- **Double Click:** Load to focused deck
- **Right Click:** Show track options

### Filtering & Search

- **Search Bar:** Filter by title/artist
- **BPM Range:** Filter by tempo
- **Key Filter:** Filter by musical key
- **Genre Tags:** Filter by genre

### Track Information

- **Title:** Track name
- **Artist:** Artist name
- **BPM:** Beats per minute
- **Key:** Musical key (Camelot notation)
- **Duration:** Track length
- **Energy:** 0-100 intensity score

---

## 🎨 Waveform Controls

### Click-to-Seek

- **Click waveform:** Jump playhead to position
- **Visual Feedback:** Cursor shows seek point

### Zoom Controls

- **Desktop:** Scroll wheel to zoom
- **Mobile:** Pinch to zoom

### Markers & Regions

- **Cue Points:** Set/jump to markers
- **Loops:** Create loop regions
- **Hot Cues:** Quick jump points (1-8)

---

## 📱 Mobile Controls

### Portrait Mode (Pocket Studio)

**Bottom Navigation:**
- **DECKS Tab:** Deck controls + waveform
- **MIXER Tab:** Crossfader + master controls
- **LIBRARY Tab:** Track browser

**Deck Toggle:**
- **A/B Buttons:** Switch between decks

### Landscape Mode (Workstation)

**Layout:**
- **Row 1:** Dual waveforms
- **Row 2:** Deck A | Mixer | Deck B
- **Row 3:** Collapsible library

**Gestures:**
- **Swipe Down:** Collapse library
- **Swipe Up:** Expand library

---

## 🎯 Pro Tips

### BPM Matching

1. Load tracks with similar BPMs
2. Enable "Sync" on both decks
3. Adjust master BPM slider
4. Use nudge for fine-tuning

### Smooth Transitions

1. EQ out lows on incoming deck
2. Start crossfade
3. Gradually bring in lows
4. EQ out lows on outgoing deck

### Stem Mixing

1. Isolate drums on Deck A (key `2`)
2. Isolate vocals on Deck B (key `1`)
3. Create unique blend
4. Re-enable other stems as needed

### Energy Matching

1. Check energy scores in library
2. Transition from low → high energy
3. Or use contrast for impact
4. Match energy for smooth mixes

---

## 🔧 Settings & Preferences

### Audio Settings

- **Buffer Size:** 128-2048 samples (lower = less latency)
- **Sample Rate:** 44.1kHz / 48kHz
- **Bit Depth:** 16-bit / 24-bit

### Display Settings

- **Complexity Mode:** Basic / Pro
- **Waveform Color:** Customizable per deck
- **Grid Layout:** Toggle for desktop

### Library Settings

- **Auto-Collapse:** Collapse library after track load
- **Default Sort:** BPM / Key / Artist / Title
- **Show Analyzed Only:** Hide tracks without BPM

---

## 🚀 Workflow Examples

### Quick Mix Session

1. Load track to Deck A
2. Play Deck A
3. Browse library for next track
4. Load track to Deck B
5. Sync Deck B to master BPM
6. Preview Deck B in headphones (coming soon)
7. Start crossfade when ready
8. Use EQ to blend smoothly

### Stem Performance

1. Load same track to both decks
2. Offset playback slightly (echo effect)
3. Isolate different stems per deck
4. Use crossfader as stem blend control
5. Add FX for texture

### Recording a Mix

1. Load first track
2. Press `Cmd/Ctrl + R` to start recording
3. Perform mix as normal
4. Press `Cmd/Ctrl + R` to stop recording
5. File downloads automatically

---

## 🐛 Troubleshooting

### No Audio

1. Check browser autoplay policy (click play)
2. Verify system audio not muted
3. Check master volume slider
4. Ensure AudioContext running (play/pause to init)

### Playback Stuttering

1. Increase buffer size in settings
2. Close other browser tabs
3. Disable hardware acceleration
4. Clear browser cache

### Track Won't Load

1. Check R2 connection (CORS errors in console)
2. Verify track file exists
3. Check network connectivity
4. Try reloading page

### Stems Not Available

1. Wait for stem processing to complete
2. Check track has been analyzed
3. Verify Demucs service running
4. Check IndexedDB storage quota

---

## 📖 Related Documentation

- **Architecture:** `docs/ARCHITECTURE.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **Testing:** `docs/TESTING.md`
- **Developer Guide:** `docs/DEVELOPER_ONBOARDING.md`
- **Add Tracks:** `docs/how-to-add-tracks.md`

---

**Updated:** February 4, 2026
**Version:** 3.0
