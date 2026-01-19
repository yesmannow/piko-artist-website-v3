## Studio feature (DAW)

This folder owns the new **Studio / DAW** buildout:

- `components/`: UI (header, timeline, mixer rack, etc.)
- `hooks/`: Studio-specific hooks (safe loaders, transport helpers)
- `stores/`: Zustand state for Studio
- `lib/`: Audio engine orchestration (wraps existing `src/features/audio-engine/*`)
- `types/`: Shared types for the Studio feature

Note: We are *not* moving existing `src/features/*` modules right now; this feature composes them.

