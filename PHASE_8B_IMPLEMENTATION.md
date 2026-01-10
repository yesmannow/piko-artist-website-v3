# Phase 8B: Real AI Inference Implementation

## Overview

Phase 8B implements real AI-powered stem separation using `onnxruntime-web` with:
- **Backend Selection**: WebGPU → WASM fallback
- **Chunked Processing**: Non-blocking chunks with overlap and crossfade stitching
- **Seamless Results**: Crossfade stitching prevents audio seams between chunks

## Architecture

### Backend Selection

The system automatically selects the best available backend:

1. **WebGPU** (Preferred)
   - GPU-accelerated inference
   - Faster processing for large models
   - Requires WebGPU support in browser

2. **WASM** (Fallback)
   - CPU-based inference
   - Works on all modern browsers
   - Uses SIMD and multi-threading when available

### Chunking Strategy

**Configuration:**
- `CHUNK_SIZE_SAMPLES`: 441,000 (10 seconds at 44.1kHz)
- `OVERLAP_SAMPLES`: 44,100 (1 second overlap)
- `CROSSFADE_SAMPLES`: 22,050 (0.5 second crossfade)

**Process:**
1. Audio is divided into overlapping chunks
2. Each chunk is processed independently through the ONNX model
3. Chunks are stitched together with crossfade blending
4. Yields to event loop between chunks to prevent UI blocking

### Crossfade Stitching

To avoid seams between chunks:
- Previous chunk fades out (1 - t)
- Current chunk fades in (t)
- Linear interpolation in the overlap region
- Creates seamless transitions

## Implementation Details

### Worker (`src/workers/stemSeparator.worker.ts`)

**Key Functions:**
- `loadONNXRuntime()`: Loads onnxruntime-web with backend selection
- `loadModel()`: Loads the ONNX model (Demucs v4)
- `processChunk()`: Processes a single chunk through the model
- `crossfadeChunks()`: Applies crossfade between chunks
- `stitchChunks()`: Combines all chunks with crossfading
- `separateAudio()`: Main separation function with chunking

**Non-Blocking:**
- Yields to event loop between chunks: `await new Promise(resolve => setTimeout(resolve, 0))`
- Progress updates sent after each chunk
- Cancellation support at chunk boundaries

### Model Requirements

**Model File:** `/models/demucs_v4_quantized.onnx`

**Input Shape:** `[batch, channels, samples]`
- Batch: 1
- Channels: 1 (mono)
- Samples: CHUNK_SIZE_SAMPLES (441,000)

**Output Shape:** `[batch, stems, channels, samples]`
- Stems: 4 (vocals, drums, bass, other)
- Outputs are extracted and converted to mono

### Fallback Behavior

If ONNX Runtime fails to load:
- Falls back to stub mode (Phase 8A behavior)
- Returns original mix as all 4 stems
- Allows testing routing/UX/caching without model

## Usage

The implementation is transparent to the UI:

```typescript
import { useStemService } from '@/hooks/useStemService';

const { separate, progress, isProcessing } = useStemService();

// Separate audio - chunking is handled automatically
const stems = await separate(audioBuffer, 'cache-key');
```

## Performance Characteristics

**Chunking Benefits:**
- Prevents UI freezing during long processing
- Allows progress updates between chunks
- Enables cancellation at chunk boundaries
- Reduces memory pressure (processes 10s at a time)

**Crossfade Benefits:**
- Eliminates audio seams/artifacts
- Smooth transitions between chunks
- Professional-quality results

**Backend Performance:**
- WebGPU: ~2-5x faster than WASM
- WASM: Reliable fallback, multi-threaded
- Automatic selection based on availability

## Next Steps

1. **Model Optimization:**
   - Quantize model for smaller size
   - Optimize for target backend (WebGPU/WASM)

2. **Chunking Tuning:**
   - Adjust chunk size based on device capabilities
   - Dynamic overlap based on model characteristics

3. **Caching:**
   - Cache separated stems by audio hash
   - Persist to IndexedDB for offline access

4. **Error Handling:**
   - Retry failed chunks
   - Partial results on cancellation

## Notes

- Model file must be placed in `public/models/`
- ONNX Runtime is loaded dynamically in the worker
- Worker uses module type for ES6 imports
- Stub mode allows development without model file
