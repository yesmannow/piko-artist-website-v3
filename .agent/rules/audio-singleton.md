---
description: AudioEngine and Context guidelines
---

# Audio Singleton Rule

- **Strict Single AudioContext Policy**: There MUST be exactly ONE `AudioContext` running across the entire application.
- All audio nodes must be connected to the `MasterVolume` node located in `lib/audioEngine.ts` (or the equivalent core audio engine hook).
- Never instantiate a new `AudioContext` inside a component.

## Primary Sources of Truth

The following knowledge files are the **authoritative references** for all audio and key-matching code in this project:

- **Web Audio API**: `.agent/knowledge/audio-references/web-audio-api-mdn.md`
  - Use `AudioWorklet` for custom DSP — **never** use deprecated `createScriptProcessor()` or `createJavaScriptNode()`.
  - Follow the lifecycle states (`suspended → running → closed`) and autoplay policy patterns documented therein.

- **Camelot Key Mapping**: `.agent/knowledge/audio-references/camelot-map.md`
  - Use the `KEY_TO_CAMELOT` lookup map and `camelotCompatibility()` algorithm for Smart Match scoring.
  - All key compatibility calculations in the TrackLibrary must reference this map.
