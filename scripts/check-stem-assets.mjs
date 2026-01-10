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

  // Check for MODEL_URL env var (external hosting)
  const modelUrl = process.env.MODEL_URL;
  if (modelUrl) {
    console.log(`[check-stem-assets] ⚠️  Model file not found locally, but MODEL_URL is set:`);
    console.log(`  MODEL_URL=${modelUrl}`);
    console.log(`[check-stem-assets] ⚠️  Using external model URL (ensure it's accessible)`);
    return true;
  }

  // Neither local file nor env var
  console.error(`[check-stem-assets] ❌ Model file not found: ${MODEL_PATH}`);
  console.error(`[check-stem-assets] ❌ MODEL_URL environment variable not set`);
  console.error(`\n  Options:`);
  console.error(`  1. Place model at: ${MODEL_PATH}`);
  console.error(`  2. Set MODEL_URL environment variable for external hosting`);
  console.error(`  3. Update MODEL_URL in src/workers/stemSeparator.worker.ts if using different path`);
  return false;
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

  if (ortOk && modelOk) {
    console.log('[check-stem-assets] ✅ PASS: All required assets found\n');
    return true;
  } else {
    console.error('[check-stem-assets] ❌ FAIL: Missing required assets\n');
    return false;
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
