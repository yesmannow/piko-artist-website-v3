---
description: State Management Constraints for Piko Studio
---

# State Management Rules

- **Zustand is the Source of Truth**: All shared audio metadata (BPM, keys, playing status, crossfader positions, stem mute configurations) MUST reside in global Zustand stores (`useStore.ts` or `useStudioStore.ts`).
- **No Local Audio State**: React components should NEVER hold local `useState` for properties that dictate audio playback logic. 
- **Event Flow**:
  1. UI dispatches an action to Zustand.
  2. Zustand state updates.
  3. `useAudioEngine` subscribes to Zustand changes and commands the Tone.js/AudioContext layer.
  4. Audio Engine emits telemetry back to Zustand (e.g., `currentTime`).
  5. UI reacts.
