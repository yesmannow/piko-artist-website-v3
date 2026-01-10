#!/usr/bin/env node

/**
 * verify-stem-assets-strict.mjs - Strict verification for Vercel deployment
 *
 * This script FAILS if the ONNX model is missing UNLESS:
 * - NEXT_PUBLIC_MODEL_URL environment variable is set, OR
 * - STEM_STRICT environment variable is not set (allows override)
 *
 * Use this for:
 * - CI/CD pipelines
 * - Pre-deployment verification
 * - npm run verify:vercel
 *
 * Regular builds use check-stem-assets.mjs (warns, doesn't fail)
 */

import { access, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const ORT_DIR = join(ROOT_DIR, 'public', 'ort');
const MODEL_PATH = join(ROOT_DIR, 'public', 'models', 'demucs_v4_quantized.onnx');

// Required ORT WASM files
const REQUIRED_ORT_FILES = [
  'ort-wasm-simd-threaded.wasm',  // Multi-threaded SIMD (required)
];

/**
 * Check if a file exists
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
 * Check ORT assets (required)
 */
async function checkOrtAssets() {
  console.log('[verify-stem-assets-strict] Checking ONNX Runtime WASM assets...');

  if (!(await exists(ORT_DIR))) {
    console.error(`[verify-stem-assets-strict] ❌ Directory not found: ${ORT_DIR}`);
    console.error(`  Run: npm run build:assets`);
    return false;
  }

  let files;
  try {
    files = await readdir(ORT_DIR);
  } catch (error) {
    console.error(`[verify-stem-assets-strict] ❌ Failed to read directory:`, error.message);
    return false;
  }

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
    console.error(`[verify-stem-assets-strict] ❌ Missing required ORT files:`);
    missing.forEach((file) => console.error(`  - ${file}`));
    console.error(`  Run: npm run build:assets`);
    return false;
  }

  console.log(`[verify-stem-assets-strict] ✅ Found ${found.length}/${REQUIRED_ORT_FILES.length} required ORT files`);
  return true;
}

/**
 * Strict model verification
 */
async function verifyStemAssetsStrict() {
  console.log('[verify-stem-assets-strict] 🔍 Strict verification for deployment...\n');

  // Step 1: Check ORT assets (required, always fail if missing)
  const ortOk = await checkOrtAssets();
  console.log(''); // Blank line

  if (!ortOk) {
    console.error('[verify-stem-assets-strict] ❌ FAIL: ORT assets are required\n');
    return false;
  }

  // Step 2: Check model (fail if missing AND no URL configured)
  const modelExists = await exists(MODEL_PATH);
  const modelUrl = process.env.NEXT_PUBLIC_MODEL_URL || process.env.MODEL_URL;
  const isStrictMode = process.env.STEM_STRICT === '1';

  if (modelExists) {
    console.log(`[verify-stem-assets-strict] ✅ Model found locally: ${MODEL_PATH}`);
    console.log('[verify-stem-assets-strict] ✅ PASS: All required assets available\n');
    return true;
  }

  if (modelUrl) {
    console.log(`[verify-stem-assets-strict] ⚠️  Model file not found locally`);
    console.log(`[verify-stem-assets-strict] ✅ Model URL configured: ${modelUrl}`);
    console.log(`[verify-stem-assets-strict] ⚠️  Ensure this URL is accessible at runtime`);
    console.log('[verify-stem-assets-strict] ✅ PASS: External model URL provided\n');
    return true;
  }

  // Model missing and no URL configured
  console.error(`[verify-stem-assets-strict] ❌ FAIL: Model missing and no URL configured\n`);
  console.error(`  Model file not found: ${MODEL_PATH}`);
  console.error(`  NEXT_PUBLIC_MODEL_URL environment variable not set\n`);
  console.error(`  Options:`);
  console.error(`  1. Run: npm run download:model`);
  console.error(`  2. Set NEXT_PUBLIC_MODEL_URL in Vercel dashboard (Production + Preview)`);
  console.error(`  3. Place model at: ${MODEL_PATH}\n`);

  // Respect STEM_STRICT=1 (fail) or STEM_STRICT=0 (allow)
  if (isStrictMode) {
    console.error(`[verify-stem-assets-strict] ❌ STEM_STRICT=1: Failing build\n`);
    return false;
  }

  // Default: fail (strict by default)
  console.error(`[verify-stem-assets-strict] ❌ Failing verification (set STEM_STRICT=0 to allow)\n`);
  return false;
}

// Run verification
verifyStemAssetsStrict()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('[verify-stem-assets-strict] ❌ Fatal error:', error);
    process.exit(1);
  });
