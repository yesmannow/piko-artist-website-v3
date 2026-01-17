# Phase 8B: Deterministic Runtime-Asset Pipeline Implementation

## Summary

Implemented a deterministic asset pipeline for Phase 8B stem separation with automated copying and strict verification.

## New Scripts

### 1. `scripts/copy-ort-assets.mjs`

**Purpose:** Copy ONNX Runtime Web WASM files from `node_modules/onnxruntime-web/dist/` to `public/ort/`

**Features:**

- Idempotent (safe to run multiple times)
- Prints copied file names
- Fails with clear error if source files missing
- Copies required files: `ort-wasm-simd-threaded.wasm`
- Copies optional files if available (jsep, asyncify variants)

**Usage:**

```bash
node scripts/copy-ort-assets.mjs
# or
npm run build:assets
```

### 2. `scripts/check-stem-assets.mjs`

**Purpose:** Verify all required Phase 8B assets exist

**Checks:**

- `public/ort/` exists and contains `ort-wasm-simd-threaded.wasm`
- `public/models/demucs_v4_quantized.onnx` exists OR `MODEL_URL` env var is set
- Prints PASS/FAIL and exits non-zero on failure

**Usage:**

```bash
node scripts/check-stem-assets.mjs
# or
npm run check:stem-assets
```

## Package.json Integration

**New Scripts:**

- `build:assets`: Runs `copy-ort-assets.mjs` + `check-stem-assets.mjs`
- `check:stem-assets`: Runs `check-stem-assets.mjs` only

**Updated Scripts:**

- `build`: Now runs `build:workers` → `build:assets` → `build.js`
- `verify:vercel`: Now checks workers AND stem assets before build

## Build Flow

```
npm run build
  ├─ npm run build:workers    # Compile TypeScript workers
  ├─ npm run build:assets      # Copy ORT assets + verify
  │   ├─ copy-ort-assets.mjs   # Copy WASM files
  │   └─ check-stem-assets.mjs # Verify all assets
  └─ node scripts/build.js     # Next.js build
```

## Verification Flow

```
npm run verify:vercel
  ├─ Check Node.js version (20.x)
  ├─ npm run check:workers     # Verify workers compiled
  ├─ npm run check:stem-assets # Verify ORT + model assets
  ├─ npm run lint              # ESLint check
  └─ npm run build             # Full production build
```

## Model Options

**Option 1: Local File (Development)**

```bash
cp /path/to/model.onnx public/models/demucs_v4_quantized.onnx
```

**Option 2: Environment Variable (Production)**

```bash
export MODEL_URL=https://your-cdn.com/models/demucs_v4_quantized.onnx
# or in .env.local:
MODEL_URL=https://your-cdn.com/models/demucs_v4_quantized.onnx
```

**Option 3: Custom Path**
Update `MODEL_URL` in `src/workers/stemSeparator.worker.ts`

## Files Created

- `scripts/copy-ort-assets.mjs` - ORT asset copying script
- `scripts/check-stem-assets.mjs` - Asset verification script

## Files Modified

- `package.json` - Added `build:assets` and `check:stem-assets` scripts
- `scripts/node20-check.mjs` - Added asset checks to verification
- `docs/PHASE_8B_PRODUCTION_HARDENING.md` - Updated with new pipeline

## Testing

**Test Asset Copying:**

```bash
npm run build:assets
# Should copy ORT files and check for model
```

**Test Verification:**

```bash
npm run check:stem-assets
# Should PASS if model exists or MODEL_URL is set
```

**Test Full Build:**

```bash
npm run build
# Should fail if assets missing (strict verification)
```

**Test Vercel Verification:**

```bash
npm run verify:vercel
# Should fail if assets missing (strict verification)
```

## Expected Output

**With Model File:**

```
[copy-ort-assets] ✅ All required assets copied successfully
[check-stem-assets] ✅ PASS: All required assets found
```

**Without Model (but MODEL_URL set):**

```
[copy-ort-assets] ✅ All required assets copied successfully
[check-stem-assets] ⚠️  Model file not found locally, but MODEL_URL is set
[check-stem-assets] ✅ PASS: All required assets found
```

**Without Model (and no MODEL_URL):**

```
[copy-ort-assets] ✅ All required assets copied successfully
[check-stem-assets] ❌ Model file not found
[check-stem-assets] ❌ MODEL_URL environment variable not set
[check-stem-assets] ❌ FAIL: Missing required assets
```

## Next Steps

1. **For Development:**
   - Place model file in `public/models/demucs_v4_quantized.onnx`
   - Run `npm run build:assets` to copy ORT files
   - Verify with `npm run check:stem-assets`

2. **For Production:**
   - Set `MODEL_URL` environment variable in Vercel
   - OR use Git LFS for model file (see docs)
   - OR host model on CDN and set `MODEL_URL`

3. **For CI/CD:**
   - `npm run verify:vercel` will catch missing assets
   - Fails early before deployment
   - Clear error messages guide fixes
