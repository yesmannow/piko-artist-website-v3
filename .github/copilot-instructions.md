# Copilot Instructions — Piko Studio (Next.js DJ Studio)

These instructions define non-negotiable architecture rules for this repository. Follow them for all changes.

## Non‑Negotiables (Must Follow)
- **Tone.js is the ONLY audio engine.**
  - Do not introduce any alternate playback engine.
  - All audio playback, transport, sync, FX routing must remain in Tone.js.
- **WaveSurfer is visuals-only.**
  - Use WaveSurfer only for waveform rendering, regions, markers, and seek UI.
  - Never use WaveSurfer for audio playback or as a second audio clock.
- **Service Worker / PWA must remain DISABLED in development.**
  - Dev builds change hashed assets frequently and can cause cache loops.
  - Only test SW/PWA behavior in production builds.
- **Canonical Track Identity**
  - Use a single stable identifier everywhere: `trackKey` (slug-like).
  - `trackKey` must be derived via normalization from `trackId`/filename/URL.
  - Do NOT use full URLs as IDs for Dexie keys, insights, peaks, cues, stems, or cache maps.
- **Client Secret Safety**
  - Only `NEXT_PUBLIC_*` variables are allowed in browser code.
  - Never use tokens/keys/secrets (R2 keys, Cloudflare tokens, GitHub tokens, email creds) client-side.
- **Reliability & Maintainability**
  - Prefer small modules/hooks over large files.
  - Avoid "monster" functions/components; split into hooks + helpers.
  - Avoid repeated setState loops; prefer derived state and refs.

## Do / Don't
### ✅ Do
- Do keep audio routing and scheduling in Tone.js.
- Do treat WaveSurfer as a UI visualization layer only.
- Do gate dev-only utilities and logs behind `NODE_ENV === "development"`.
- Do add graceful degradation for optional features (analysis, WASM, workers).
- Do run build gates after changes:
  - `npm run build`
  - `npm run lint`
  - tests (if present)

### ❌ Don't
- Don't re-enable SW in dev.
- Don't add a second AudioContext playback path.
- Don't use full URLs as "trackId".
- Don't expose secrets through `NEXT_PUBLIC_*`.
- Don't delete files without proof of non-use.

## Before Deleting or Removing Anything
Deletion is allowed ONLY when all are true:
1) `rg` shows **zero imports/references** to the file/component.
2) No dynamic imports: search for `import(` / `dynamic(` / `require(` usage.
3) Not referenced by Next.js routing conventions (app/ layouts, pages, routes, middleware, workers).
4) Run:
   - `npm run build`
   - `npm run lint`
   - tests if available
5) Prefer moving uncertain files to `/archive` before hard deletion.

## TrackKey Rule (Implementation Reminder)
- Always compute `trackKey = normalizeTrackId(trackData.trackId ?? trackData.url ?? fileName)` where:
  - lowercased
  - extensions removed (.mp3/.wav/.m4a/.ogg)
  - path prefixes stripped (/audio/tracks/, origin, query forms)
  - spaces/underscores normalized to hyphens

Use `trackKey` as the primary key for:
- insights (Dexie)
- waveformPeaks (Dexie)
- trackCues (Dexie)
- stems readiness cache maps
