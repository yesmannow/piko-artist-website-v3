---
description: AudioEngine and Context guidelines
---

# Audio Context Rules

- **Singleton AudioContext**: There MUST be exactly ONE `AudioContext` (managed via Tone.getContext() or a custom singleton) running across the entire application to prevent browser hardware limits and synchronization drift.
- **Node Cleanup**: When tracks are swapped, decks are cleared, or stems are regenerated, you MUST explicitly call `.dispose()` or `.disconnect()` on any active `Tone.Player`, `Tone.Gain`, `Tone.Filter`, or `AudioBufferSourceNode` objects to prevent severe memory leaks.
- **User Intention Guard**: `Tone.start()` or `AudioContext.resume()` must be firmly gated behind a deliberate user interaction (e.g., pressing "Play" or "Initialize Engine"). Do not attempt to auto-start contexts on window load.
