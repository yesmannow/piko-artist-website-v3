# Studio Audit Report

Date: 2026-01-26

## Summary

The Studio stack is aligned with local audio assets, OffscreenCanvas lifecycle is guarded, and the service worker uses range-aware MP3 caching. No remaining remote track URLs were found in Studio data or components. ESLint hook warnings were resolved.

## Track URL Sources

- `src/data/piko-tracks.json` and `src/data/musician_tracks.json` reference only `/audio/tracks/*.mp3`.
- `src/components/studio/ui/TrackListing.tsx` normalizes local filenames and builds `/audio/tracks/...` URLs.
- `src/app/api/studio/track/route.ts` resolves local track IDs to `/audio/tracks/...`.
- No remote audio URLs found in Studio components or track data.

## Worker Lifecycle

- `src/components/studio/ui/WaveformMini.tsx` uses a `transferredRef` guard to call `transferControlToOffscreen()` only once per canvas.
- Worker teardown is delayed to avoid Strict Mode double-mount edge cases.
- `src/workers/waveform.worker.ts` only holds canvas state after explicit init and is terminated on unmount.

## Deck Render Loop

- `src/components/studio/ui/Deck.tsx` throttles UI updates (~20fps) and store updates (~30fps).
- rAF loop is single-instance per Deck and canceled on cleanup.

## Service Worker

- `src/app/sw.ts` caches `/audio/tracks/*.mp3` with `RangeRequestsPlugin`.
- Cache limits are enforced to reduce quota pressure.
- MP3 scrubbing and seeking are supported via byte-range responses.

## Dead Code Removal

- Removed unused Cloudflare R2 helpers from `src/lib/r2/`.
- No remaining references to R2 clients or legacy Studio removals.
- No unused Tour or Merch references found in `src/`.

## Follow-Up Recommendations

- Run `npm run test:e2e` after UI changes to validate worker stability.
- Consider adding a lightweight `/studio` health check endpoint if CI needs a server-side probe.
