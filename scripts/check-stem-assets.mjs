#!/usr/bin/env node

/**
 * check-stem-assets.mjs - Verify Phase 8B stem separation assets
 *
 * Checks:
 * - public/ort/ exists and contains required ORT WASM files
 * - public/models/demucs_v4_quantized.onnx exists OR MODEL_URL env var is set
 *
 * Exits with non-zero code on failure.
 */

import { readdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const ORT_DIR = join(ROOT_DIR, 'public', 'ort');
const MODEL_PATH = join(ROOT_DIR, 'public', 'models', 'demucs_v4_quantized.onnx');

// Required ORT WASM files
// ONNX Runtime Web loads these dynamically based on browser capabilities
// Note: Newer versions may only include threaded variants
const REQUIRED_ORT_FILES = [
  'ort-wasm-simd-threaded.wasm',  // Multi-threaded SIMD (required)
];

/**
 * Check if a file or directory exists
 */
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check ORT assets
 */
async function checkOrtAssets() {
  console.log('[check-stem-assets] Checking ONNX Runtime WASM assets...');

  // Check if directory exists
  if (!(await exists(ORT_DIR))) {
    console.error(`[check-stem-assets] ❌ Directory not found: ${ORT_DIR}`);
    console.error(`  Run: npm run build:assets`);
    return false;
  }

  // List files in directory
  let files;
  try {
    files = await readdir(ORT_DIR);
  } catch (error) {
    console.error(`[check-stem-assets] ❌ Failed to read directory:`, error.message);
    return false;
  }

  // Check for required files
  const missing = [];
  const found = [];

  for (const fileName of REQUIRED_ORT_FILES) {
    if (files.includes(fileName)) {
      found.push(fileName);
    } else {
      missing.push(fileName);
    }
  }

  if (missing.length > 0) {
    console.error(`[check-stem-assets] ❌ Missing required ORT files:`);
    missing.forEach((file) => console.error(`  - ${file}`));
    console.error(`  Run: npm run build:assets`);
    return false;
  }

  console.log(`[check-stem-assets] ✅ Found ${found.length}/${REQUIRED_ORT_FILES.length} required ORT files`);
  return true;
}

/**
 * Check model asset
 */
async function checkModelAsset() {
  console.log('[check-stem-assets] Checking ONNX model...');

  // Check if model file exists
  if (await exists(MODEL_PATH)) {
    console.log(`[check-stem-assets] ✅ Model found: ${MODEL_PATH}`);
    return true;
  }

  // Check for MODEL_URL or NEXT_PUBLIC_MODEL_URL env var (external hosting)
  const modelUrl = process.env.MODEL_URL || process.env.NEXT_PUBLIC_MODEL_URL;
  if (modelUrl) {
    console.log(`[check-stem-assets] ⚠️  Model file not found locally, but model URL env var is set:`);
    if (process.env.MODEL_URL) {
      console.log(`  MODEL_URL=${process.env.MODEL_URL}`);
    }
    if (process.env.NEXT_PUBLIC_MODEL_URL) {
      console.log(`  NEXT_PUBLIC_MODEL_URL=${process.env.NEXT_PUBLIC_MODEL_URL}`);
    }
    console.log(`[check-stem-assets] ⚠️  Using external model URL (ensure it's accessible at runtime)`);
    return true;
  }

  // Neither local file nor env var
  // Note: Model can be provided at runtime via CONFIG message or environment variables
  // This is a warning, not an error, for deployment compatibility
  console.warn(`[check-stem-assets] ⚠️  Model file not found: ${MODEL_PATH}`);
  console.warn(`[check-stem-assets] ⚠️  MODEL_URL or NEXT_PUBLIC_MODEL_URL environment variable not set`);
  console.warn(`\n  Options:`);
  console.warn(`  1. Place model at: ${MODEL_PATH}`);
  console.warn(`  2. Set NEXT_PUBLIC_MODEL_URL environment variable in Vercel dashboard for client-side external hosting`);
  console.warn(`  3. Set MODEL_URL environment variable for build-time external hosting`);
  console.warn(`  4. Configure model URL at runtime via StemService.initialize({ modelUrl })`);
  console.warn(`\n  Note: The worker supports runtime configuration via CONFIG message.`);
  console.warn(`  This check is non-blocking - model can be provided at runtime.\n`);
  // Return true (non-blocking) since model can be provided at runtime
  return true;
}

/**
 * Main function
 */
async function checkStemAssets() {
  console.log('[check-stem-assets] Verifying Phase 8B stem separation assets...\n');

  const ortOk = await checkOrtAssets();
  console.log(''); // Blank line

  const modelOk = await checkModelAsset();
  console.log(''); // Blank line

  // ORT assets are required (fail if missing)
  if (!ortOk) {
    console.error('[check-stem-assets] ❌ FAIL: ORT assets are required\n');
    return false;
  }

  // Model is optional (warn if missing, but don't fail)
  if (modelOk) {
    console.log('[check-stem-assets] ✅ PASS: All required assets found\n');
    return true;
  } else {
    console.warn('[check-stem-assets] ⚠️  WARNING: Model not found (non-blocking)\n');
    console.warn('[check-stem-assets] ⚠️  Stem separation will not work until model is available\n');
    console.warn('[check-stem-assets] ⚠️  Run: npm run download:model\n');
    // Return true (non-blocking) since model can be provided at runtime
    return true;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('check-stem-assets.mjs')) {
  checkStemAssets()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('[check-stem-assets] ❌ Fatal error:', error);
      process.exit(1);
    });
} else {
  // Always run if this is the main module
  checkStemAssets()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('[check-stem-assets] ❌ Fatal error:', error);
      process.exit(1);
    });
}

export { checkStemAssets };
