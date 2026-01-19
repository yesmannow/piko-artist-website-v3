# Asset Inventory Manifest - Piko V3 Greenfield Rebuild

## Date: Generated for Phase 0 Demolition
## Purpose: Comprehensive catalog of files to be removed vs preserved

---

## Category 1: Route Definitions (Entry Points)

### To Remove:
- `src/app/studio/page.tsx` - Studio route (will be rebuilt)

### To Preserve:
- `src/app/page.tsx` - Home page
- `src/app/music/page.tsx` - Music portfolio page
- `src/app/videos/page.tsx` - Video gallery
- `src/app/events/page.tsx` - Events page
- `src/app/contact/page.tsx` - Contact page
- `src/app/layout.tsx` - Root layout
- `src/app/error.tsx` - Error boundary
- `src/app/global-error.tsx` - Global error boundary
- `src/app/loading.tsx` - Loading component

---

## Category 2: UI Component Tree (Visual Elements)

### To Remove - Studio/DJ Mixer Components:
- `src/components/DJInterface.tsx` - Main orchestrator (2178 lines)
- `src/components/DJDeck.tsx` - Individual deck UI
- `src/components/DJMixer.tsx` - Mixer UI controls
- `src/components/FXUnit.tsx` - Effects unit
- `src/components/BeatMakerTeaser.tsx` - Uses HTMLAudioElement (legacy)
- `src/components/3d/StudioCanvas.tsx` - 3D studio visualization
- `src/components/studio/*` - All 16 files:
  - CrossFader.tsx
  - mobile/DeckSwiper.tsx
  - mobile/MobileDeckSwiper.tsx
  - mobile/MobileLayout.tsx
  - OrientationGuard.tsx
  - SamplerGrid.tsx
  - SessionRecorder.tsx
  - SessionSummary.tsx
  - SignalHatch.tsx
  - StemControl.tsx
  - StemDeck.tsx
  - StudioEngineSection.tsx
  - StudioMixerPreview.tsx
  - SyndicateEQ.tsx
  - ThermalMeter.tsx
  - XYPad.tsx
- `src/components/dj-ui/*` - All 17 files:
  - AudioReactiveVisualizer.tsx
  - ConsoleTour.tsx
  - CrashGuard.tsx
  - Crossfader.tsx
  - DeskProps.tsx
  - DrawerAudioMeters.tsx
  - Fader.tsx
  - JogWheel.tsx
  - JogWheel3D.tsx
  - Knob.tsx
  - PerformancePads.tsx
  - preload3D.ts
  - Tooltip.tsx
  - TrackTransition.tsx
  - VUMeter.tsx
  - Waveform.tsx
  - XYPad.tsx

### To Preserve - Portfolio Components:
- `src/components/Navbar.tsx` - Navigation
- `src/components/MobileNav.tsx` - Mobile navigation
- `src/components/Footer.tsx` - Footer
- `src/components/Player.tsx` - Basic player (review)
- `src/components/PersistentPlayer.tsx` - Persistent player (review)
- `src/components/TrackList.tsx` - Track listing
- `src/components/VideoGallery.tsx` - Video gallery
- `src/components/ImageGallery.tsx` - Image gallery
- `src/components/EventGlobe.tsx` - Event visualization
- `src/components/EventList.tsx` - Event listing
- `src/components/BookingForm.tsx` - Booking form
- `src/components/branding/*` - Branding components
- `src/components/ui/*` - Shared UI primitives (keep, may refactor)

### To Review:
- `src/components/3d/HolographicDeck.tsx` - Check if used outside studio
- `src/components/3d/GlitchController.tsx` - Check if used outside studio
- `src/components/EnhancedAudioVisualizer.tsx` - Check if portfolio-specific

---

## Category 3: Business Logic & State (Hooks/Context/Stores)

### To Remove - Studio-Specific Hooks:
- `src/hooks/useDualDeck.ts` - Dual deck management
- `src/hooks/useMixRecorder.ts` - Mix recording
- `src/hooks/useVoiceTag.ts` - Voice tagging
- `src/hooks/useStemSeparator.ts` - Legacy stem separation
- `src/hooks/useStemRouting.ts` - Stem routing
- `src/hooks/useStemKeyboardShortcuts.ts` - Stem keyboard shortcuts
- `src/hooks/useVelocityScratching.ts` - Velocity scratching

### To Preserve - Generic Hooks:
- `src/hooks/useAudioGraph.ts` - Core audio graph (review for refactor)
- `src/hooks/useAudioAnalyser.ts` - Audio analysis (review)
- `src/hooks/useHaptic.ts` - Haptic feedback (keep)
- `src/hooks/useOrientation.ts` - Device orientation (keep)
- `src/hooks/useSceneCleanup.ts` - Scene cleanup (keep)
- `src/hooks/useScrollDirection.ts` - Scroll direction (keep)
- `src/hooks/useScrollVisibility.ts` - Scroll visibility (keep)
- `src/hooks/useBodyScrollLock.ts` - Body scroll lock (keep)
- `src/hooks/useFocusTrap.ts` - Focus trap (keep)
- `src/hooks/useMouseParallax.ts` - Mouse parallax (keep)
- `src/hooks/useBPMDetection.ts` - BPM detection (review)
- `src/hooks/useDeviceOrientation.ts` - Device orientation (keep)
- `src/hooks/useEventTimezoneAmbientLight.ts` - Event timezone (keep)
- `src/hooks/useGlitchOverlay.tsx` - Glitch overlay (keep)
- `src/hooks/useGlobeCameraFlyTo.ts` - Globe camera (keep)
- `src/hooks/useVaultEntrySound.ts` - Vault sound (keep)
- `src/hooks/useSignalCracker.ts` - Signal cracker (review)

### To Review - Context:
- `src/context/HelpContext.tsx` - Help context (used by studio, review)
- `src/context/AudioContext.tsx` - Audio context (uses HTMLAudioElement, needs refactor)
- `src/context/VideoContext.tsx` - Video context (keep)

### To Review - Stores:
- `src/stores/useAudioStore.ts` - Audio store (keep, may refactor)
- `src/stores/useEventStore.ts` - Event store (keep)

---

## Category 4: Static Content (Assets)

### To Preserve:
- `public/audio/*` - All audio files (44 files)
- `public/images/*` - All images (41 files)
- `public/3d/*` - 3D models (4 .glb files)
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker
- `public/workers/*` - Worker scripts
- `public/worklets/*` - AudioWorklet scripts

---

## Category 5: Build Configuration

### To Preserve:
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `next.config.mjs` - Next.js config (needs update for COOP/COEP)
- `tailwind.config.ts` - Tailwind config (needs migration to v4)
- `postcss.config.mjs` - PostCSS config (needs update)
- `.gitignore` - Git ignore
- `.env*` - Environment variables

---

## Category 6: Utilities & Types

### To Remove:
- `src/utils/constantPowerSplitter.ts` - If only used by mixer (verify)

### To Preserve:
- `src/utils/audioRenderer.ts` - Audio rendering (review if studio-specific)
- `src/lib/data.ts` - Track metadata (keep)
- `src/lib/events.ts` - Event data (keep)
- `src/lib/utils.ts` - Generic utilities (keep)
- `src/types/*` - Type definitions (review)

---

## Legacy Identification

### Files Containing Legacy Audio Patterns:
- `src/components/BeatMakerTeaser.tsx` - Uses `HTMLAudioElement`
- `src/context/AudioContext.tsx` - Uses `<audio>` element
- `src/components/Player.tsx` - Review for HTMLAudioElement usage

### Legacy UI Libraries (Not Found):
- ✅ No Bootstrap detected
- ✅ No MaterialUI detected
- ✅ No styled-components detected

---

## Summary Statistics

- **Total Files to Remove**: ~50+ files
- **Total Files to Preserve**: ~30+ files
- **Files to Review**: ~10 files

---

## Execution Order

1. Remove route entry point (`src/app/studio/page.tsx`)
2. Remove component tree (DJInterface, DJDeck, DJMixer, etc.)
3. Remove studio-specific hooks
4. Remove 3D studio components
5. Clean up orphaned imports
6. Verify build succeeds
