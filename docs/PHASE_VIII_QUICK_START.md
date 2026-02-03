# Phase VIII Quick Start Guide 🚀

Get up and running with the new professional workstation features in **under 5 minutes**.

---

## ⚡ TL;DR

**3 New Features Added:**
1. 🎙️ **Mix Recording** - Capture your mixes in high quality
2. ⌨️ **Keyboard Controls** - Hardware-style shortcuts
3. 🔌 **ProLink Status** - Real-time CDJ connection indicator

**No New Dependencies Required!** Works with existing setup.

---

## 🎙️ 1. Mix Recording

### Basic Usage

```tsx
import { useMixRecorder } from '@/hooks/useMixRecorder';

function RecordButton() {
  const { audioContext, masterGain } = useAudioEngine();
  const { isRecording, duration, startRecording, stopRecording } = useMixRecorder({
    audioContext,
    masterNode: masterGain,
  });

  return (
    <button onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? `⏹ ${duration}s` : '⏺ Record'}
    </button>
  );
}
```

### Output
- **Format:** WebM (192kbps)
- **Filename:** `piko-mix-2026-02-03T14-30-00.webm`
- **Download:** Automatic on stop

---

## ⌨️ 2. Keyboard Controls

### Setup

```tsx
import { useKeyboardControls } from '@/hooks/useKeyboardControls';

function Studio() {
  const { togglePlay, toggleStem } = useAudioEngine();

  useKeyboardControls({
    onPlayPause: togglePlay,
    onStemToggle: (index) => toggleStem(index),
    onJog: (direction, precision) => console.log(`Jog ${direction}`),
    showFeedback: true, // Shows key press indicator
  });

  return <div>{/* Your studio UI */}</div>;
}
```

### Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `1-4` | Toggle stems |
| `→/←` | Jog forward/back |
| `Cmd+R` | Start/stop recording |

**Full Reference:** See `docs/KEYBOARD_SHORTCUTS_REFERENCE.md`

---

## 🔌 3. ProLink Status

### Already Integrated!

The ProLink CDJ status indicator is **already added** to `StudioHeader.tsx`. No code changes needed!

### What You'll See

```
┌─────────────────┐
│ 🌐 CDJ (Green)  │ ← Connected
└─────────────────┘

┌─────────────────┐
│ 📴 CDJ (Red)    │ ← Offline
└─────────────────┘
```

### Optional: Connect Real CDJs

To enable hardware integration:

```bash
# Install ProLink bridge (optional)
npm install -g prolink-connect

# Create bridge server
node prolink-bridge.js  # Listens on ws://localhost:8080
```

**Without bridge:** Status will show "offline" (totally fine for development).

---

## 🎨 Dark Mode UI

### Already Applied!

The professional dark mode palette is **already in** `globals.css`. Just refresh to see:

- ✅ Deep gray backgrounds (#121212)
- ✅ High contrast text (#E0E0E0)
- ✅ Teal accents (#009688)
- ✅ Reduced eye strain

**No action required!**

---

## 🧪 Testing

### 1. Test Mix Recording

```bash
# Start dev server
npm run dev

# In browser:
1. Open http://localhost:3000/studio
2. Click "Record" button
3. Play some music for 10 seconds
4. Click "Stop"
5. Check Downloads folder for .webm file
```

### 2. Test Keyboard Controls

```bash
# In browser:
1. Press Space → Should pause/play
2. Press 1 → Should toggle vocals
3. Press Arrow keys → Should jog playback
4. Type in search box → Shortcuts should NOT fire
```

### 3. Test ProLink Status

```bash
# Should show red "CDJ" indicator (offline) by default
# If you start ProLink bridge, it will turn green
```

---

## 📊 Build & Deploy

### Local Build

```bash
npm run build
# ✅ Should complete with exit code 0
```

### Deploy to Vercel

```bash
vercel --prod
# No environment variable changes needed!
```

---

## 🐛 Troubleshooting

### Recording Not Working?

**Check browser compatibility:**
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ⚠️ Limited (audio/mp4 only)

**Check console for errors:**
```javascript
// Should see:
[MixRecorder] Initialized
[MixRecorder] Recording started
```

### Keyboard Shortcuts Not Responding?

**Make sure no text input is focused:**
```javascript
// In console:
document.activeElement
// Should NOT be <input> or <textarea>
```

**Check if hook is enabled:**
```javascript
// Should see in console:
[KeyboardControls] Initialized
[KeyboardControls] Key pressed: Space
```

### ProLink Always Shows Offline?

**Expected behavior!** ProLink requires:
1. Physical CDJ hardware on local network
2. ProLink bridge server running on `ws://localhost:8080`
3. `prolink-connect` npm package installed

**For development:** Offline status is normal and doesn't affect other features.

---

## 📚 Full Documentation

For detailed information:

- 📖 **Complete Guide:** `docs/PHASE_VIII_PROFESSIONAL_WORKSTATION.md`
- ⌨️ **Keyboard Reference:** `docs/KEYBOARD_SHORTCUTS_REFERENCE.md`
- 🎉 **Completion Summary:** `docs/PHASE_VIII_COMPLETION_SUMMARY.md`

---

## ✅ Checklist

- [ ] Imported `useMixRecorder` in your component
- [ ] Passed `audioContext` and `masterNode` to hook
- [ ] Imported `useKeyboardControls` in Studio component
- [ ] Tested recording a 10-second mix
- [ ] Tested keyboard shortcuts (Space, 1-4, arrows)
- [ ] Verified ProLink status indicator appears in header
- [ ] Confirmed dark mode palette looks good
- [ ] Read full documentation

---

**Ready to mix like a pro! 🎛️**

**Questions?** Check the full docs or open an issue on GitHub.

---

**Last Updated:** February 3, 2026
**Version:** Phase VIII
**Author:** Piko Studio Team
