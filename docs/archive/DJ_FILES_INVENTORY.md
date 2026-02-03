# DJ-Related Files & Assets Inventory

Complete inventory of all DJ mixer, audio engine, and related files in the `src` directory.

---

## 📁 Core Mixer Components

### `src/features/studio-mixer/components/`
- **DeckPanel.tsx** - Deck panel wrapper component for Deck A/B
- **FxRack.tsx** - Effects rack component with filter, grit, reverb, delay, flanger, phaser, chorus controls
- **KaossPad.tsx** - Interactive Kaoss pad component for X/Y effects control
- **MixerCenter.tsx** - Central mixer controls (BPM, crossfader, EQ, volume)
- **MixerDeck.tsx** - Individual deck component with play/pause, pitch control, waveform
- **MixerStudio.tsx** - Main mixer studio layout component (3-column desktop, stacked mobile)
- **StudioDrawer.tsx** - Mobile drawer component for studio controls
- **TrackLibrary.tsx** - Track library component with search, filtering, and deck loading

### `src/features/studio-mixer/lib/`
- **MixerGraph.tsx** - Audio graph builder for mixer (creates channel strips, FX chains, master bus)
- **MixerGraphContext.tsx** - React context for mixer graph state
- **createImpulseResponse.ts** - Creates impulse response buffers for reverb effects

### `src/features/studio-mixer/stores/`
- **useMixerStore.ts** - Zustand store for mixer state (decks, FX, EQ, crossfader, BPM, library)

---

## 🎵 Audio Engine Core

### `src/features/audio-engine/components/`
- **JogWheel.tsx** - Virtual turntable jog wheel with inertia and haptic feedback
- **Waveform.tsx** - Waveform visualization component using Wavesurfer.js with vinyl nudge support

### `src/features/audio-engine/hooks/`
- **useDeck.ts** - Hook for managing a single DJ deck (play, pause, seek, pitch control)
- **useChannelStrip.ts** - Hook for creating and managing channel strip audio nodes (EQ, trim, panner)
- **useAudioLoop.ts** - Concurrent loop for playhead updates using requestAnimationFrame
- **useAudioWorklet.ts** - Hook for loading and managing AudioWorklet processors
- **useTimeKeeper.ts** - Hook for metronome and beat synchronization

### `src/features/audio-engine/lib/`
- **AudioContextManager.ts** - Singleton AudioContext manager
- **MasterBus.ts** - Master audio bus with dynamics compressor and gain control
- **AnalyserManager.ts** - Manages AnalyserNodes for visualization (PFL, post-fader)

---

## 🔌 Hardware Bridge (Prolink Integration)

### `src/features/hardware-bridge/`
- **context/ProlinkContext.tsx** - React context for Prolink CDJ status
- **hooks/useProlink.ts** - Hook for connecting to Prolink bridge via WebSocket
- **lib/websocketClient.ts** - WebSocket client for Prolink bridge communication
- **types.ts** - Type definitions for CDJ status and bridge connection state

---

## 🎨 UI Components & Layouts

### `src/features/ui-glass/`
- **MixerDrawer.tsx** - Slide-up drawer component for mobile mixer controls
- **controls/Fader.tsx** - Vertical/horizontal fader control with haptic feedback

### `src/features/ui/`
- **StudioLayout.tsx** - Adaptive layout component (3-column desktop, stacked mobile)

### `src/components/studio/`
- **StudioNavMenu.tsx** - Navigation menu for studio modes

---

## 🛠️ Utilities & Hooks

### `src/utils/`
- **fxUtils.ts** - Audio effects utilities (createFlanger, createPhaser, createChorus, createEcho)
- **bpmDetection.ts** - BPM detection using autocorrelation
- **audioRenderer.ts** - Audio rendering utilities (renderMixToWAV, audioBufferToWAV)

### `src/hooks/`
- **useBPMDetection.ts** - Hook for BPM detection from audio buffers
- **useAudioGraph.ts** - Hook for setting up audio processing graph (master gain, limiter, analyser, sidechain)

---

## ⚙️ Audio Worklets (Web Audio Processors)

### `public/worklets/`
- **meter-processor.js** - AudioWorklet processor for audio level metering
- **recorder-processor.js** - AudioWorklet processor for audio recording
- **sidechain-processor.js** - AudioWorklet processor for sidechain compression
- **timekeeper-processor.js** - AudioWorklet processor for beat timing and metronome
- **v3-separator-worker.js** - Worker for AI stem separation (Demucs)

---

## 📦 State Management

### `src/stores/`
- **useAudioStore.ts** - Zustand store for global audio context state

---

## 🎛️ Studio Feature (DAW/Timeline Mode)

### `src/features/studio/components/`
- **MixerRack.tsx** - Mixer rack component for timeline/DAW mode
- **StudioHeader.tsx** - Studio header component
- **TimelineView.tsx** - Timeline view component
- **TimelineCanvas.tsx** - Canvas component for timeline visualization
- **CamelotBadge.tsx** - Camelot wheel key badge component
- **ExportModal.tsx** - Export modal for rendering mixes

### `src/features/studio/lib/`
- **AudioEngine.ts** - Audio engine orchestration wrapper
- **StudioEngine.ts** - Studio engine for DAW functionality
- **TimelineEngine.ts** - Timeline engine for track sequencing
- **TrackNode.ts** - Track node implementation
- **StudioBufferCache.ts** - Buffer cache for audio assets
- **export/download.ts** - Download utilities
- **export/recordCanvasWithAudio.ts** - Canvas recording with audio
- **export/renderTimelineToWav.ts** - Timeline to WAV rendering

### `src/features/studio/hooks/`
- **useStudioClock.ts** - Studio clock hook for timeline synchronization
- **useTrackLoader.ts** - Track loading hook
- **useVoiceoverRecorder.ts** - Voiceover recording hook

### `src/features/studio/stores/`
- **useStudioStore.ts** - Zustand store for studio state
- **studioRealtimeStore.ts** - Real-time studio state store

### `src/features/studio/workers/`
- **analysis.worker.ts** - Web Worker for audio analysis

---

## 📄 App Pages & Routes

### `src/app/(studio)/`
- **layout.tsx** - Studio layout wrapper
- **studio/page.tsx** - Main studio page with mode switching (mixer/timeline/library/fx)

---

## 🎚️ AI Stem Separation

### `src/features/ai-separation/`
- **hooks/useDeviceCapabilities.ts** - Hook for detecting device capabilities (WebGPU, WASM)
- **services/StemService.ts** - Service for AI stem separation using Demucs

### `src/workers/`
- **demucs.worker.ts** - Web Worker for Demucs AI stem separation using ONNX Runtime

---

## 📝 Type Definitions

### `src/lib/types/`
- **audio.d.ts** - Audio-related type definitions

### `src/types/`
- **prolink-connect.d.ts** - Prolink connection type definitions

---

## 📊 Summary Statistics

- **Total DJ-Related Files**: ~50+ files
- **Components**: 15+ React components
- **Hooks**: 10+ custom hooks
- **Audio Processors**: 5 worklets
- **Stores**: 3 Zustand stores
- **Utilities**: 3 utility modules
- **Workers**: 2 Web Workers

---

## 🗂️ File Organization

```
src/
├── features/
│   ├── studio-mixer/          # Main DJ mixer feature
│   │   ├── components/        # UI components
│   │   ├── lib/               # Audio graph logic
│   │   └── stores/            # Mixer state
│   ├── audio-engine/          # Core audio processing
│   │   ├── components/        # Audio UI components
│   │   ├── hooks/             # Audio hooks
│   │   └── lib/                # Audio managers
│   ├── hardware-bridge/       # Prolink integration
│   ├── studio/                # DAW/Timeline mode
│   └── ui-glass/              # Glassmorphic UI components
├── utils/                     # Utility functions
├── hooks/                     # Global hooks
├── stores/                    # Global stores
├── workers/                   # Web Workers
└── app/(studio)/              # Studio routes
```

---

## 🔗 Dependencies

Key dependencies used by DJ features:
- **wavesurfer.js** - Waveform visualization
- **zustand** - State management
- **framer-motion** - Animations
- **onnxruntime-web** - AI stem separation
- **Web Audio API** - Core audio processing

---

*Last updated: January 25, 2026*
