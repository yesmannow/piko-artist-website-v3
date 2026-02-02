# Piko Artist Studio (v3)

High-performance artist platform built with **Next.js App Router**: music library + immersive playback, video archive, a booking/contact hub, and a full-featured Studio mixer. Optimized for **Vercel** and configured as a **PWA**.

## What's in the app today

- **Routes**
  - **`/`**: Home (hero + track list + visuals + booking teaser)
  - **`/music`**: Music library + immersive fullscreen playback
  - **`/videos`**: Video archive with YouTube RSS feeds + embeds (COOP/COEP-safe thumbnails via proxy)
  - **`/contact`**: Contact & Booking Hub (pre-qual form that emails via API)
  - **`/monitor`**: Second-screen DJ HUD (BPM/On Air) that can connect to the Prolink bridge
  - **`/studio`**: Full-featured Studio mixer with timeline, FX rack, and track library
- **API routes**
  - **`/api/send-email`**: Nodemailer endpoint (rate-limited) used by booking/contact flows
  - **`/api/image-proxy`**: Server-side image proxy for COOP/COEP compatibility
- **PWA**
  - Serwist service worker (`src/app/sw.ts` → `public/sw.js`) with strict cache limits to avoid storage quota issues

## Tech stack

- **Framework**: Next.js (App Router), React 19, TypeScript
- **UI**: Tailwind CSS v4, Framer Motion, Lenis (smooth scrolling)
- **Audio**: Web audio playback (Wavesurfer + custom context/providers)
- **3D**: Three.js + React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **PWA**: Serwist (`@serwist/next`)
- **Optional/feature-flagged**
  - **Supabase** real-time "social queue" (client-side, disabled if env vars are missing)
  - **AI stem separation** via ONNX + a Web Worker (requires COOP/COEP headers)
  - **Hardware bridge** (Pioneer Pro DJ Link) via a Node sidecar (`scripts/bridge`)

## Requirements

- **Node.js**: 20.x (repo pins `20.17.0` in `.node-version`, and `>=20 <21` in `package.json`)
- **Package manager**: npm (this repo includes `package-lock.json`)

## Development Environment

### Recommended: WSL2 (Windows)

For the most reliable development experience on Windows, use WSL2 Ubuntu:

```bash
# Open WSL2
wsl -d Ubuntu

# Run the setup script (installs Node.js and validates builds)
bash /mnt/c/dev/piko-artist-website-v3/wsl-setup.sh

# Or manually:
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
cd /mnt/c/dev/piko-artist-website-v3
npm ci
npm run build
```

**Why WSL2?** Avoids Windows-specific TypeScript hangs and matches production Linux environments.

### Alternative: Docker

```bash
docker build -t piko-studio .
docker run --rm piko-studio
```

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Useful scripts

```bash
npm run build
npm run start
npm run lint
npm run check:case
```

## Environment variables

This repo keeps local env files out of git. Configure these in your local environment and/or in Vercel.

### Email (required to enable form submissions)

Used by `src/app/api/send-email/route.ts`.

- **`EMAIL_USER`**: Gmail address
- **`EMAIL_PASS`**: Gmail **App Password** (not your normal password)
- **`RECIPIENT_EMAIL`** (optional): recipient inbox, defaults to `Manospintadas420@gmail.com`

### Client-side (optional features)

- **`NEXT_PUBLIC_BOOKING_CALENDAR_URL`**: Enables "Schedule" links on `/contact` and booking CTA UI
- **`NEXT_PUBLIC_SUPABASE_URL`** + **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Enables the Supabase-backed social queue features
- **`NEXT_PUBLIC_ENABLE_SW=true`**: Forces service worker registration in development (otherwise SW registers only in production)

## PWA + COOP/COEP notes (important)

- **Service worker**: generated from `src/app/sw.ts` and registered by `src/components/ServiceWorkerRegistration.tsx` (mounted in `src/app/layout.tsx`). Caching limits are intentionally strict to avoid `QuotaExceededError`.
- **COOP/COEP headers**: `next.config.mjs` enables `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (needed for `SharedArrayBuffer` / WASM threads). This means:
  - Some third-party assets may fail to load unless they send the right CORP/CORS headers.
  - YouTube thumbnails are accessed through **`/api/image-proxy`** via `src/lib/utils/youtubeImageProxy.ts`.

## Hardware bridge (Pioneer Pro DJ Link)

There's a Node "sidecar" server that connects to Pioneer gear on a Pro DJ Link network and exposes status over WebSocket.

```bash
cd scripts/bridge
npm install
npm run dev
```

The web app connects to `ws://localhost:8080` (used by `/monitor` via the Prolink feature).

## Project structure (high level)

```
src/
  app/                      # Next.js App Router routes + API routes + SW source
  components/               # UI + page-level components (player, nav, PWA prompts, etc.)
  context/                  # Audio/Video providers
  features/                 # Larger feature modules (AI separation, hardware bridge, social queue, etc.)
  hooks/                    # Reusable hooks
  lib/                      # Data, utilities, config helpers
  workers/                  # Web Workers (e.g., demucs/ONNX processing)
scripts/
  bridge/                   # Prolink hardware bridge sidecar
supabase/
  migrations/               # Optional social queue schema
```

## Deployment

- **Target**: Vercel
- **Build command**: `npm run build`
- **Node**: 20.x

For deeper deployment troubleshooting, see `VERCEL_DEPLOYMENT_AUDIT_GUIDE.md`.

## Piko Artist Studio — Architecture Overview

The Piko Artist Studio is a fully client-side modular audio environment built on top of:

- Web Audio API
- OffscreenCanvas waveform rendering
- Dedicated audio workers
- Next.js App Router
- Local MP3 assets
- Service Worker range-request caching

### Audio Engine

Located in:

```
src/audio/
src/lib/audio-engine.ts
src/hooks/useAudioEngine.ts
```

The engine manages:

- Track decoding
- Playback scheduling
- Crossfader routing
- FX chains
- Master bus processing
- Real-time waveform analysis

Workers:

```
src/workers/analysis.worker.ts
src/workers/essentia.worker.ts
src/workers/waveform.worker.ts
```

### Studio UI System

Located in:

```
src/components/studio/
```

Key components:

- Deck.tsx — playback, progress, jog wheel
- WaveformMini.tsx — OffscreenCanvas waveform renderer
- TrackLibrary.tsx — local track browser
- StudioMonitor.tsx — real-time meters
- FXRackSheet.tsx — effects UI
- Crossfader.tsx — deck blending

State is managed via:

```
src/store/useStudioStore.ts
```

### 3D & Visual Layer

```
src/components/studio/visuals/Scene3D.tsx
```

Handles:

- WebGL visualizers
- Reactive lighting
- GPU tier detection

### Local Audio Assets

All tracks live in:

```
public/audio/tracks/*.mp3
```

Track metadata lives in:

```
src/data/piko-tracks.json
src/data/musician_tracks.json
```

A build-time validator ensures:

- No missing files
- No orphaned JSON entries

### Service Worker

```
src/app/sw.ts
```

Provides:

- Byte-range support for MP3 scrubbing
- Cache limits to prevent quota errors
- Offline waveform rendering

### Regression Testing

Playwright test:

```
tests/studio.spec.ts
```

Validates:

- Studio loads
- Track loads
- Seeking works
- No worker crashes

### Deployment Safety

Vercel deploy validator:

```
scripts/validate-vercel-deploy.js
```

Ensures:

- Required env vars exist
- Studio loads without errors
- No worker crashes in production

## Studio UX documentation

The Studio design system and UX guidelines live in the app docs:

- `/docs/design-system` for foundations and patterns
- `/docs/components` for component specs
- `/docs/motion` for motion choreography

## License

MIT (see `LICENSE`)
