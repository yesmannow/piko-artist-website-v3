# Developer Onboarding Guide -- Piko Artist Website V3

Welcome to the project.
This guide will help you set up your environment, understand the architecture, and contribute safely.

---

# 1. Install Requirements

- Node 20+
- npm 10+
- Playwright browsers (`npx playwright install`)
- GitHub CLI (optional)

---

# 2. Install Dependencies

```bash
npm install
```

---

# 3. Project Architecture

## Studio System

- Located in `src/components/studio/`
- Uses Web Audio API + workers
- Waveform rendered via OffscreenCanvas
- Local MP3 assets in `public/audio/tracks/`

## Workers

- `waveform.worker.ts`
- `analysis.worker.ts`
- `essentia.worker.ts`

## Track Metadata

- `src/data/piko-tracks.json`
- `src/data/musician_tracks.json`
- Entries use `trackId` and `energy` fields.

## Build Validators

- `scripts/check-tracks.js`
- `scripts/validate-tracks.js`

## Studio UX Docs

These internal docs live in the app and outline the Studio UI system:

- `/docs/design-system`
- `/docs/components`
- `/docs/motion`

---

# 4. Running the Project

```bash
npm run dev
```

Studio is available at:

```
http://localhost:3000/studio
```

---

# 5. Required Validation Before Pushing

```bash
npm run validate:tracks
npm run build
npm run test:e2e
```

---

# 6. Deployment Safety

Validate Vercel deploy:

```bash
npm run validate:vercel
```

---

# 7. Editing Studio Components

## WaveformMini

- Must keep `transferredRef` guard
- Must delay worker termination

## Deck.tsx

- Must keep throttled UI updates

## Workers

- Must test `/studio` after any change

---

# 8. Adding New Tracks

See `/docs/how-to-add-tracks.md`.

---

# You are Ready

You can now contribute safely and confidently.
