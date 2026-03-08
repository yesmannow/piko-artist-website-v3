---
description: State Management Constraints
---

# State Consistency Rule

- **Zustand for Cross-Component Communication**: You must use Zustand for all shared state. 
- **Domain Separation**:
  - `DeckStore` (or equivalent store, e.g., `useStudioStore` / `useStore` deck slices) MUST handle all playback state (playing, BPM, volume, crossfader).
  - `LibraryStore` (or equivalent data store) MUST handle all IndexedDB/Dexie persistence logic for tracks and metadata.
