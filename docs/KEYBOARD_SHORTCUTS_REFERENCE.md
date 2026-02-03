# Keyboard Shortcuts Reference 🎹

Quick reference guide for hardware-style keyboard controls in the Piko DJ Studio.

---

## 🎮 Playback Controls

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Space` | **Play/Pause** | Toggle master playback |
| `→` (Right Arrow) | **Jog Forward** | Skip ahead 1 beat |
| `←` (Left Arrow) | **Jog Backward** | Skip back 1 beat |
| `Shift + →` | **Precision Jog Forward** | Skip ahead 0.1 second |
| `Shift + ←` | **Precision Jog Back** | Skip back 0.1 second |

---

## 🎚️ Stem Controls

| Shortcut | Action | Stem |
|----------|--------|------|
| `1` | **Toggle Vocals** | Vocals stem on/off |
| `2` | **Toggle Drums** | Drums stem on/off |
| `3` | **Toggle Bass** | Bass stem on/off |
| `4` | **Toggle Other** | Other (melody/synth) stem on/off |

**Tip:** Hold multiple number keys to isolate specific stems!

---

## 🎛️ Deck Focus

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Q` | **Focus Deck A** | Switch control to left deck |
| `W` | **Focus Deck B** | Switch control to right deck |

---

## 🎙️ Recording

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd + R` (Mac) | **Start/Stop Recording** | Record master output |
| `Ctrl + R` (Windows/Linux) | **Start/Stop Recording** | Record master output |

**Output Format:** WebM (192kbps)
**Auto-Download:** Yes, on stop recording
**Filename:** `piko-mix-YYYY-MM-DDTHH-MM-SS.webm`

---

## 🛡️ Smart Input Detection

The keyboard controls **automatically disable** when you're typing in:
- 🔤 Text inputs (track search, BPM entry)
- 📝 Textareas (notes, comments)
- ✏️ Contenteditable elements

This prevents accidental playback control while entering data!

---

## 🎨 Visual Feedback

When keyboard shortcuts are active, a subtle indicator appears showing the last key pressed:

```
┌─────────────────┐
│ Key: Space      │
│ Action: Play    │
└─────────────────┘
```

**Duration:** 300ms fade-out
**Position:** Top-right corner
**Disable:** Set `showFeedback: false` in `useKeyboardControls`

---

## 💡 Pro Tips

### 1. **One-Hand Mixing**
```
Left hand: Q/W (deck selection) + 1-4 (stems)
Right hand: Mouse (effects, EQ)
```

### 2. **Quick Transitions**
```
1. Press Space to pause
2. Press ← or → to find cue point
3. Press Space to resume
```

### 3. **Live Recording**
```
1. Set up your mix
2. Press Cmd+R to start recording
3. Mix as usual (zero-latency recording)
4. Press Cmd+R to stop → Auto-download
```

### 4. **Stem Isolation**
```
Solo vocals: Hold 2, 3, 4 (mutes drums, bass, other)
Acapella effect: Release all keys, press 1 (vocals only)
```

---

## 🔧 Customization

Want to change the keyboard mappings? Edit `src/hooks/useKeyboardControls.ts`:

```typescript
export function useKeyboardControls({
  // Custom key mappings
  playPauseKey = ' ',     // Change to 'p' for P key
  stemKeys = ['1', '2', '3', '4'],
  deckFocusKeys = ['q', 'w'],
  jogKeys = ['ArrowLeft', 'ArrowRight'],
  recordKey = 'r',
  recordModifier = 'Meta', // 'Meta' = Cmd/Win, 'Control' = Ctrl
  // ... rest of config
}) {
  // Hook logic
}
```

---

## 🚨 Troubleshooting

### Shortcuts Not Working?
1. **Check focus:** Make sure no text input is focused
2. **Check browser:** Some browsers block certain key combos (try incognito mode)
3. **Check console:** Look for `[KeyboardControls]` debug messages

### Shortcuts Triggering While Typing?
This is a bug! The hook should auto-detect text inputs. Report it with:
```
Input type: <input>, <textarea>, contenteditable
Active element: document.activeElement
```

### Recording Not Starting?
1. **Check permissions:** Browser needs microphone permission (even for audio output)
2. **Check AudioContext:** Must be initialized before recording
3. **Check console:** Look for `[MixRecorder]` error messages

---

**Last Updated:** February 3, 2026
**Version:** Phase VIII
**Author:** Piko Studio Team
