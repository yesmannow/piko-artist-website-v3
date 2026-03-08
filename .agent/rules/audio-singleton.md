---
description: AudioEngine and Context guidelines
---

# Audio Singleton Rule

- **Strict Single AudioContext Policy**: There MUST be exactly ONE `AudioContext` running across the entire application.
- All audio nodes must be connected to the `MasterVolume` node located in `lib/audioEngine.ts` (or the equivalent core audio engine hook).
- Never instantiate a new `AudioContext` inside a component.
