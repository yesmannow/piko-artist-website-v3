# Contributing to Piko Artist Website V3

Thank you for contributing.
This project includes a full audio Studio, OffscreenCanvas waveform rendering, workers, and local MP3 assets.
Please follow these guidelines to ensure safe, stable contributions.

---

# Project Structure Overview

Key areas of the repo:

- `src/components/studio/` -- Studio UI, Decks, Waveform, FX, Library
- `src/workers/` -- waveform, analysis, essentia workers
- `public/audio/tracks/` -- local MP3 assets
- `src/data/*.json` -- track metadata
- `scripts/*.js` -- build validators
- `tests/studio.spec.ts` -- regression test

---

# Required Before Every Commit

Run:

```bash
npm run validate:tracks
npm run build
npm run test:e2e
```

Your PR must not break:

- Worker initialization
- Waveform rendering
- Deck playback
- Track loading
- Studio page load

---

# Studio-Specific Rules

## 1. WaveformMini

- Do not remove the `transferredRef` guard.
- Do not modify worker termination timing without testing Strict Mode.

## 2. Deck.tsx

- UI updates must remain throttled (20fps UI, 30fps store).
- Never reintroduce 60fps re-renders.

## 3. Workers

- Any change to `waveform.worker.ts` must be tested with `/studio`.

## 4. Local Tracks

- All MP3s must exist in `public/audio/tracks/`.
- All MP3s must be referenced in both JSON files.
- Track entries use `trackId` and `energy` fields (see `/docs/how-to-add-tracks.md`).

---

# Adding New Tracks

See the "How to Add New Tracks" guide in `/docs`.

---

# Code Style

- Use TypeScript strict mode.
- Prefer small, composable components.
- Avoid unnecessary re-renders.
- Use Zustand store for Studio state.

---

# Testing Requirements

Your PR must pass:

- `npm run validate:tracks`
- `npm run build`
- `npm run test:e2e`

---

# Deployment

Before merging:

- Validate Vercel deploy with `npm run validate:vercel`
- Ensure no missing environment variables
- Ensure Studio loads without worker errors

---

# Thank You

Your contributions help keep the Studio stable, fast, and fun.
