# Worker Build Process

## Overview

This project uses **TypeScript workers** that must be compiled to JavaScript before deployment. Workers are located in:

- **Source**: `src/workers/*.worker.ts`
- **Compiled**: `public/workers/*.worker.js`

## Build Workflow

### Automatic (Recommended)

Workers are automatically compiled during the main build:

```bash
npm run build
```

This runs `build:workers` before the Next.js build.

### Manual

To compile workers separately:

```bash
npm run build:workers
```

### Verification

Check that all workers are compiled:

```bash
npm run check:workers
```

## Current Workers

1. **beatgrid.worker.ts** → `beatgrid.worker.js`
   - Phase 9A: BPM and beat grid analysis

2. **stemSeparator.worker.ts** → `stemSeparator.worker.js`
   - Phase 8B: AI stem separation using ONNX Runtime

3. **key.worker.ts** → `key.worker.js`
   - Phase 9C: Musical key detection (Essentia.js fallback)

## Build Tool

Workers are compiled using **esbuild** for:

- Fast compilation
- TypeScript support
- Standalone output (no bundling)
- IIFE format (compatible with classic workers)

## Important Notes

### ⚠️ DO NOT EDIT COMPILED FILES

**Never edit files in `public/workers/` directly.** They are generated from TypeScript sources and will be overwritten.

Always edit the TypeScript source in `src/workers/` and run `npm run build:workers`.

### Pre-Deployment Checklist

Before deploying:

1. ✅ Ensure all workers are compiled: `npm run check:workers`
2. ✅ Verify workers load correctly in browser
3. ✅ Test worker functionality (BPM detection, stem separation, key detection)

### CI/CD Integration

If using CI/CD, ensure workers are compiled:

```yaml
# Example GitHub Actions
- run: npm install
- run: npm run build:workers
- run: npm run build
```

### Troubleshooting

**Error: "Worker not found"**

- Run `npm run build:workers` to compile workers
- Check that `public/workers/` directory exists

**Error: "Worker compilation failed"**

- Check TypeScript errors in `src/workers/*.worker.ts`
- Ensure `esbuild` is installed: `npm install --save-dev esbuild`

**Workers not updating**

- Clear browser cache
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Verify compiled files in `public/workers/` match source

## Future Improvements

Consider migrating to Next.js native worker imports (using `?worker` suffix) for automatic bundling, but this requires:

- Webpack configuration changes
- Worker import syntax changes
- Testing across all workers

Current approach (manual compilation) is explicit and reliable.
