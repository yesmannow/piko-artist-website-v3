# Phase 8B: Production Hardening

## Overview

Phase 8B stem separation has been hardened for production deployment with local asset serving and proper error handling.

## Changes Made

### 1. Local ONNX Runtime WASM Assets

**Configuration:**

- WASM files path: `/ort/` (configured via `ort.env.wasm.wasmPaths`)
- Model path: `/models/demucs_v4_quantized.onnx`

**Setup Required:**

### Automated Asset Pipeline

The build process now automatically copies required assets:

```bash
# Copy ONNX Runtime WASM files (automated)
npm run build:assets

# Or manually:
node scripts/copy-ort-assets.mjs
```

This copies required WASM files from `node_modules/onnxruntime-web/dist/` to `public/ort/`:

- `ort-wasm-simd-threaded.wasm` (required)
- Optional variants (jsep, asyncify) if available

### ONNX Model

**Option 1: Local Model (Recommended for Development)**

```bash
# Place model in public/models/
cp /path/to/demucs_v4_quantized.onnx public/models/demucs_v4_quantized.onnx
```

**Option 2: External Model URL (Recommended for Production)**

```bash
# Set environment variable
export MODEL_URL=https://your-cdn.com/models/demucs_v4_quantized.onnx

# Or in .env.local:
MODEL_URL=https://your-cdn.com/models/demucs_v4_quantized.onnx
```

**Option 3: Custom Path**
Update `MODEL_URL` in `src/workers/stemSeparator.worker.ts` if using a different path.

**Model Location:**

- Default: `public/models/demucs_v4_quantized.onnx`
- Size: Typically 50-200MB (quantized models are smaller)
- Format: ONNX model file (`.onnx` extension)

### 2. Fast-Fail Error Handling

**Before:** Silent stub fallback if ONNX/model failed to load

**After:**

- Fast-fail with clear error messages
- UI displays error instead of silently using stub
- Model existence check before loading
- Detailed error messages for troubleshooting

**Error Messages:**

- `ONNX Runtime failed to load: [error]` - Runtime load failure
- `Model file missing: /models/...` - Model file not found
- `Model load failed: [error]` - Model load failure

### 3. Worker Bundling

**esbuild Configuration:**

- `stemSeparator.worker.ts` is bundled with dependencies
- `onnxruntime-web` is included in the bundle
- No dynamic imports that classic workers can't handle

**Build Process:**

```bash
npm run build:workers  # Compiles workers with bundling
npm run build:assets  # Copies ORT assets and verifies setup
npm run build         # Full build (includes workers + assets)
```

**Verification:**

```bash
npm run check:workers      # Verify workers are compiled
npm run check:stem-assets   # Verify ORT assets and model
```

## Deployment Checklist

- [ ] Run `npm run build:assets` to copy ORT WASM files
- [ ] Verify `public/ort/` contains `ort-wasm-simd-threaded.wasm`
- [ ] Place ONNX model in `public/models/` OR set `MODEL_URL` env var
- [ ] Run `npm run check:stem-assets` to verify all assets
- [ ] Workers compiled (`npm run build:workers`)
- [ ] Error handling tested (remove model file, verify error display)
- [ ] Service worker doesn't cache `/worklets/*` or `/studio*` routes

## Troubleshooting

**Error: "ONNX Runtime failed to load"**

- Check that `onnxruntime-web` is installed: `npm install onnxruntime-web`
- Verify WASM files exist in `public/ort/`
- Check browser console for detailed error

**Error: "Model file missing"**

- Ensure model file exists at `public/models/demucs_v4_quantized.onnx`
- Check file permissions
- Verify MODEL_URL in `stemSeparator.worker.ts` matches file location

**Error: "Worker not found"**

- Run `npm run build:workers` to compile workers
- Check `public/workers/stemSeparator.worker.js` exists

## Vercel Size Constraints + Git LFS Option

### File Size Limits

**Vercel Limits:**

- Individual file: 50MB (hard limit)
- Total deployment: 100MB (recommended, can be larger)

**ONNX Model Considerations:**

- Quantized models: ~50-100MB (fits in Vercel)
- Full models: 200MB+ (exceeds Vercel limit)

### Solutions

**Option 1: External CDN (Recommended)**

- Host model on CDN (Cloudflare R2, AWS S3, etc.)
- Set `MODEL_URL` environment variable in Vercel
- Model loads from CDN at runtime
- No Git repository bloat

**Option 2: Git LFS (For Local Models)**

```bash
# Install Git LFS
git lfs install

# Track ONNX model files
git lfs track "*.onnx"
git add .gitattributes

# Add model
git add public/models/demucs_v4_quantized.onnx
git commit -m "Add ONNX model via Git LFS"
```

**Option 3: Build-Time Download**

- Download model during build process
- Use Vercel build script to fetch from external source
- Store in `public/models/` during build

**Recommendation:**
For production, use external CDN hosting with `MODEL_URL` environment variable. This:

- Keeps repository small
- Avoids Vercel size limits
- Enables model updates without redeployment
- Reduces build time

## Files Modified

- `src/workers/stemSeparator.worker.ts` - Added WASM path config, model check, fast-fail
- `scripts/build-workers.js` - Added bundling for stemSeparator worker
- `scripts/copy-ort-assets.mjs` - Automated ORT asset copying
- `scripts/check-stem-assets.mjs` - Asset verification script
- `src/components/studio/StemSeparatorButton.tsx` - Fixed cancel handler
- `package.json` - Added `build:assets` and `check:stem-assets` scripts
