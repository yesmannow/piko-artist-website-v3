# Phase 8B, 9B, 9C: Setup and Deployment Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup ONNX Runtime WASM Files (Phase 8B)

Copy ONNX Runtime WASM files to `public/ort/`:

```bash
# Option 1: Copy from node_modules
mkdir -p public/ort
cp -r node_modules/onnxruntime-web/dist/* public/ort/

# Option 2: Download from CDN and place in public/ort/
# Files needed:
# - ort-wasm-simd-threaded.wasm
# - ort-wasm-simd-threaded.worker.js
# - ort-wasm-simd.wasm
# - ort-wasm.wasm
# (and any other WASM files from onnxruntime-web/dist/)
```

### 3. Place ONNX Model (Phase 8B)

Place your ONNX model in `public/models/`:

```bash
# Model should be named: demucs_v4_quantized.onnx
# Or update MODEL_URL in src/workers/stemSeparator.worker.ts
cp /path/to/model.onnx public/models/demucs_v4_quantized.onnx
```

### 4. Build Workers

```bash
npm run build:workers
```

### 5. Build Application

```bash
npm run build
```

## Verification

### Check Workers are Compiled

```bash
npm run check:workers
```

Expected output:
```
[check-workers] ✅ All 5 worker(s) are compiled
```

### Verify ONNX Runtime Setup

1. Open browser console
2. Load a track and attempt stem separation
3. Check for:
   - ✅ "ONNX Runtime loaded with [backend] backend"
   - ✅ "Model loaded"
   - ❌ "ONNX Runtime failed to load" → Check WASM files
   - ❌ "Model file missing" → Check model file location

### Test Sync (Phase 9B)

1. Load two tracks with different BPMs
2. Analyze beat grids for both
3. Start playback on both decks
4. Enable sync (tempo+phase mode)
5. Observe:
   - Slave rate adjusts to match tempo
   - Phase error decreases over time
   - Beats align and stay aligned

### Test Key Detection (Phase 9C)

1. Load a track
2. Wait for key analysis (runs automatically)
3. Check Camelot notation displays (e.g., "8A")
4. Load second track and check compatibility highlighting

## Troubleshooting

### Workers Not Compiling

**Error: "Cannot use external without bundle"**
- Fixed in latest build script
- Run `npm run build:workers` again

**Error: "esbuild not found"**
- Install: `npm install --save-dev esbuild`

### ONNX Runtime Issues

**Error: "ONNX Runtime failed to load"**
- Check `onnxruntime-web` is installed: `npm list onnxruntime-web`
- Verify WASM files exist in `public/ort/`
- Check browser console for detailed error

**Error: "Model file missing"**
- Ensure model exists at `public/models/demucs_v4_quantized.onnx`
- Or update `MODEL_URL` in `stemSeparator.worker.ts`

### Sync Not Working

**Error: "Both decks must have tracks loaded"**
- Load tracks into both decks first
- Analyze beat grids for both tracks

**Beats not aligning:**
- Check beat grid confidence (should be > 0.5)
- Verify both tracks have similar BPMs
- Increase `beatNudgeThreshold` if nudges too frequent

### Key Detection Issues

**Key always "Unavailable":**
- Check Essentia.js is installed (optional, has fallback)
- Verify worker compiled correctly
- Check browser console for errors

## Production Deployment

### Pre-Deployment Checklist

- [ ] ONNX Runtime WASM files in `public/ort/`
- [ ] ONNX model in `public/models/`
- [ ] Workers compiled (`npm run build:workers`)
- [ ] Full build passes (`npm run build`)
- [ ] Service worker doesn't cache `/worklets/*` or `/studio*`
- [ ] Error handling tested (remove model, verify error display)

### Vercel Deployment

1. Push to GitHub
2. Import to Vercel
3. Build command: `npm run build` (automatically runs `build:workers`)
4. Verify deployment:
   - Check `/studio` loads with COOP/COEP headers
   - Test stem separation (should show error if model missing)
   - Test sync functionality
   - Test key detection

## File Structure

```
public/
  ├── models/
  │   └── demucs_v4_quantized.onnx  # ONNX model (Phase 8B)
  ├── ort/
  │   ├── ort-wasm-simd-threaded.wasm
  │   ├── ort-wasm-simd-threaded.worker.js
  │   └── ... (other ONNX Runtime WASM files)
  └── workers/
      ├── stemSeparator.worker.js    # Compiled (bundled with onnxruntime-web)
      ├── key.worker.js              # Compiled (bundled with essentia.js)
      └── beatgrid.worker.js         # Compiled (standalone)
```

## Notes

- **Worker Bundling**: `stemSeparator.worker.ts` and `key.worker.ts` are bundled with their dependencies
- **Model Size**: ONNX models can be large (50-200MB). Consider CDN hosting for production
- **WASM Files**: ONNX Runtime WASM files are ~5-10MB total. Local serving is recommended for reliability
- **Essentia.js**: Optional dependency. Key detection works with fallback if not available
