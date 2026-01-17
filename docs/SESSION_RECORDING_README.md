# Session Recording & "Piko Social" Export

## Overview

The Session Recording Suite enables users to capture high-definition DJ mixes and export them with professional metadata for social media sharing. Building on DJ Studio 5's social features, this system provides seamless recording, automatic tracklist generation, and YouTube/Mixcloud-ready video exports with 3D GPU visualizer overlays.

## Features

### 🎙️ **HD Session Recording**

- **320kbps OGG/WebM Audio**: High-quality audio capture at 320kbps bitrate
- **Real-time Recording**: Live capture of master output with low-latency processing
- **Auto-stop Protection**: 30-second safety limit for social sharing optimization
- **Format Optimization**: Automatic selection of best supported codec

### 🗂️ **Pocket Vault Storage**

- **IndexedDB Storage**: Local browser storage for recordings and metadata
- **Metadata Preservation**: Complete track information and session details
- **Search & Organization**: Tag-based organization and full-text search
- **Export Management**: Direct download to user's device

### 📝 **Automatic Metadata Generation**

- **Track History Tracking**: Real-time monitoring of track changes during sessions
- **Auto-generated Tracklists**: Timestamped track transitions with BPM/key info
- **Session Metadata**: DJ name, mix title, description, and tags
- **Social Ready**: Optimized metadata for YouTube, Mixcloud, and SoundCloud

### 🎬 **Video Rendering with Visualizer Overlay**

- **3D GPU Visualizer**: StudioCanvas integration for dynamic visual overlays
- **Multiple Resolutions**: SD (854x480), HD (1920x1080), 4K (3840x2160)
- **GPU-accelerated Rendering**: Hardware-accelerated video encoding
- **Real-time Progress**: Live rendering progress with cancellation support

### 🎨 **Professional Export UI**

- **Export Mix Modal**: Comprehensive configuration interface
- **DJ Profile Integration**: Custom DJ names and branding
- **Tag Management**: Flexible tagging system for categorization
- **Format Selection**: Audio-only or video with visualizer options

## Technical Architecture

### Core Components

1. **EnhancedMixRecorder** (`/engine/EnhancedMixRecorder.ts`)
   - HD audio/video recording with MediaRecorder API
   - Pocket Vault integration for storage
   - Track history session management
   - Bitrate and format optimization

2. **PocketVault** (`/engine/PocketVault.ts`)
   - IndexedDB-based local storage system
   - Metadata and blob management
   - Search and retrieval functionality
   - Export capabilities

3. **TrackHistory** (`/engine/TrackHistory.ts`)
   - Real-time track change detection
   - Session-based history management
   - Automatic tracklist generation
   - Timestamp tracking

4. **VideoRenderer** (`/engine/VideoRenderer.ts`)
   - GPU-accelerated video rendering
   - 3D visualizer integration
   - Multiple resolution support
   - Progress tracking and cancellation

5. **ExportMixModal** (`/components/dj-ui/ExportMixModal.tsx`)
   - Professional export configuration UI
   - Metadata editing and tag management
   - Video rendering controls
   - Direct download functionality

### Data Flow

```
Recording Start → Track History Session → MediaRecorder Capture → Pocket Vault Storage → Export Modal → Video Render (optional) → Download
```

## Usage

### Basic Recording

```tsx
import { getEnhancedMixRecorder } from "@/engine/EnhancedMixRecorder";

const recorder = getEnhancedMixRecorder();
await recorder.initialize();

// Start HD recording
const sessionId = await recorder.startRecording(audioContext, masterNode, {
  format: "audio/webm",
  bitRate: 320,
  djName: "Piko DJ",
  title: "Live Mix Session",
});

// Stop recording
await recorder.stopRecording();
```

### Pocket Vault Management

```tsx
import { getPocketVault } from "@/engine/PocketVault";

const vault = getPocketVault();
await vault.initialize();

// Store recording
const recordingId = await vault.storeRecording(metadata, audioBlob);

// Retrieve recording
const { metadata, blob } = await vault.getRecording(recordingId);

// Export to file
await vault.exportRecording(recordingId, "My_Mix_Session.webm");
```

### Video Rendering

```tsx
import { getVideoRenderer } from "@/engine/VideoRenderer";

const renderer = getVideoRenderer();

// Render video with visualizer overlay
const videoBlob = await renderer.renderVideo({
  audioBlob,
  canvas,
  width: 1920,
  height: 1080,
  frameRate: 30,
  bitRate: 5, // 5 Mbps
  format: "webm",
  onProgress: (progress) => console.log(`Rendering: ${progress * 100}%`),
});
```

### Track History Integration

```tsx
import { getTrackHistory } from "@/engine/TrackHistory";

const history = getTrackHistory();

// Start session
const sessionId = history.startSession();

// Track when songs change
history.trackStarted(trackMetadata);

// End session and get tracklist
const session = history.endSession();
const tracklist = history.generateTracklist(sessionId);
```

## Export Modal Usage

```tsx
import { ExportMixModal } from "@/components/dj-ui/ExportMixModal";

// In your component
<ExportMixModal
  isOpen={showExportModal}
  onClose={() => setShowExportModal(false)}
  recordingId={currentRecordingId} // Optional: for editing existing
/>;
```

## Recording Specifications

### Audio Formats

- **Primary**: WebM with Opus codec (320kbps)
- **Fallback**: OGG with Opus codec (320kbps)
- **Legacy**: WebM with Vorbis (if Opus unavailable)

### Video Formats

- **WebM VP9**: Best quality, wide compatibility
- **WebM VP8**: Fallback for older browsers
- **MP4**: Limited browser support (future enhancement)

### Quality Presets

- **SD**: 854x480 @ 2.5 Mbps
- **HD**: 1920x1080 @ 5 Mbps
- **4K**: 3840x2160 @ 10 Mbps

## Metadata Standards

### Recording Metadata

```typescript
interface RecordingMetadata {
  id: string;
  title: string;
  djName: string;
  description?: string;
  duration: number;
  createdAt: Date;
  format: string;
  bitRate: number;
  fileSize: number;
  tracklist: TrackEntry[];
  tags?: string[];
}
```

### Track Entry Format

```typescript
interface TrackEntry {
  id: string;
  title: string;
  artist: string;
  startTime: number;
  endTime?: number;
  bpm?: number;
  camelot?: string;
}
```

## Browser Compatibility

### Required APIs

- **MediaRecorder**: Core recording functionality
- **IndexedDB**: Local storage for recordings
- **Web Audio API**: Audio processing and routing
- **Canvas.captureStream()**: Video capture from 3D scenes

### Supported Codecs

- **Audio**: Opus, Vorbis, AAC (limited)
- **Video**: VP9, VP8, H.264 (limited)

### Storage Limits

- **IndexedDB**: Typically 50MB-1GB depending on browser
- **Blob URLs**: Temporary URLs for downloads
- **Memory**: GPU memory for video rendering

## Performance Considerations

### Recording

- **Real-time Processing**: Optimized for minimal latency
- **Memory Management**: Chunked recording to prevent memory issues
- **Format Selection**: Automatic fallback to supported formats

### Storage

- **Compression**: Efficient blob storage with metadata separation
- **Indexing**: Fast search and retrieval with IndexedDB indices
- **Cleanup**: Automatic cleanup of temporary resources

### Rendering

- **GPU Acceleration**: Hardware-accelerated video encoding
- **Frame Batching**: Progressive rendering to prevent UI blocking
- **Cancellation Support**: Abort rendering operations cleanly

## Social Media Optimization

### YouTube Ready

- **HD Video**: 1080p with visualizer overlays
- **Metadata**: Complete tracklist in description
- **Thumbnails**: Auto-generated from visualizer frames
- **Tags**: Optimized tagging for discoverability

### Mixcloud/SoundCloud

- **Audio Export**: High-quality 320kbps audio files
- **Tracklist**: Formatted tracklist with timestamps
- **Metadata**: Complete session information
- **Artwork**: Visualizer-based cover art generation

## Future Enhancements

### Advanced Features

- **Cloud Sync**: Optional cloud backup of recordings
- **Social Sharing**: Direct upload to platforms
- **Collaborative Mixing**: Multi-user session recording
- **Live Streaming**: Real-time broadcasting with overlays

### Performance Upgrades

- **WebCodecs API**: Hardware-accelerated encoding/decoding
- **WebAssembly**: Enhanced audio processing
- **Service Workers**: Background rendering and storage

### Integration Features

- **Stem Separation**: AI-powered stem extraction for remixing
- **AI Enhancement**: Automatic mix analysis and suggestions
- **Plugin System**: Third-party export destinations

## Troubleshooting

### Common Issues

**Recording not starting**: Check browser permissions for microphone/camera access.

**Storage full**: Clear old recordings from Pocket Vault or increase browser storage quota.

**Video rendering slow**: Reduce resolution or frame rate for faster rendering.

**Audio sync issues**: Ensure audio context is properly initialized and running.

**Export failing**: Check available disk space and browser compatibility.

## Dependencies

- **React**: UI framework and state management
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Icon components
- **Web Audio API**: Audio processing and recording
- **MediaRecorder API**: Core recording functionality
- **IndexedDB**: Local storage system

## File Structure

```
src/
├── engine/
│   ├── EnhancedMixRecorder.ts    # HD recording system
│   ├── PocketVault.ts            # Local storage service
│   ├── TrackHistory.ts           # Session tracking
│   └── VideoRenderer.ts          # GPU video rendering
├── components/
│   └── dj-ui/
│       └── ExportMixModal.tsx    # Export configuration UI
└── hooks/
    └── useMixRecorder.ts         # Legacy recording hook
```

This implementation provides DJ Studio 5-level social sharing capabilities with professional-grade recording, storage, and export features optimized for the modern web platform.
