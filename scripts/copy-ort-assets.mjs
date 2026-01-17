#!/usr/bin/env node

/**
 * copy-ort-assets.mjs - Copy ONNX Runtime Web WASM assets to public/ort/
 *
 * Phase 8B: Deterministic asset pipeline
 *
 * Copies required ONNX Runtime Web WASM files from node_modules to public/ort/
 * Idempotent: safe to run multiple times
 */

import { readdir, copyFile, mkdir, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");

const ORT_SOURCE_DIR = join(
  ROOT_DIR,
  "node_modules",
  "onnxruntime-web",
  "dist",
);
const ORT_TARGET_DIR = join(ROOT_DIR, "public", "ort");

// Required ORT WASM files (must exist in source)
// ONNX Runtime Web loads these dynamically based on capabilities
// Note: Newer versions may only include threaded variants
const REQUIRED_FILES = [
  "ort-wasm-simd-threaded.wasm", // Multi-threaded SIMD (preferred, always present)
];

// Fallback files (may not exist in newer versions)
const FALLBACK_FILES = [
  "ort-wasm-simd.wasm", // SIMD fallback (if available)
  "ort-wasm.wasm", // Basic fallback (if available)
];

// Optional files (nice to have but not required)
const OPTIONAL_FILES = [
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.asyncify.wasm",
  "ort-wasm-simd.jsep.wasm",
  "ort-wasm.jsep.wasm",
];

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy a single file
 */
async function copyAsset(sourceFile, targetFile) {
  try {
    await copyFile(sourceFile, targetFile);
    return true;
  } catch (error) {
    console.error(
      `[copy-ort-assets] ❌ Failed to copy ${sourceFile}:`,
      error.message,
    );
    return false;
  }
}

/**
 * Main function
 */
async function copyOrtAssets() {
  console.log("[copy-ort-assets] Copying ONNX Runtime Web assets...\n");

  // Check if source directory exists
  if (!(await fileExists(ORT_SOURCE_DIR))) {
    console.error(
      `[copy-ort-assets] ❌ Source directory not found: ${ORT_SOURCE_DIR}\n` +
        `  Please run: npm install onnxruntime-web`,
    );
    process.exit(1);
  }

  // Create target directory if it doesn't exist
  try {
    await mkdir(ORT_TARGET_DIR, { recursive: true });
    console.log(
      `[copy-ort-assets] Created target directory: ${ORT_TARGET_DIR}`,
    );
  } catch (error) {
    if (error.code !== "EEXIST") {
      console.error(
        `[copy-ort-assets] ❌ Failed to create target directory:`,
        error.message,
      );
      process.exit(1);
    }
  }

  // Check and copy required files
  let requiredCopied = 0;
  let requiredMissing = [];

  for (const fileName of REQUIRED_FILES) {
    const sourcePath = join(ORT_SOURCE_DIR, fileName);
    const targetPath = join(ORT_TARGET_DIR, fileName);

    if (!(await fileExists(sourcePath))) {
      requiredMissing.push(fileName);
      console.error(`[copy-ort-assets] ❌ Required file missing: ${fileName}`);
      continue;
    }

    const copied = await copyAsset(sourcePath, targetPath);
    if (copied) {
      console.log(`[copy-ort-assets] ✅ Copied: ${fileName}`);
      requiredCopied++;
    }
  }

  // Copy fallback files if they exist (not required but helpful)
  let fallbackCopied = 0;
  for (const fileName of FALLBACK_FILES) {
    const sourcePath = join(ORT_SOURCE_DIR, fileName);
    const targetPath = join(ORT_TARGET_DIR, fileName);

    if (await fileExists(sourcePath)) {
      const copied = await copyAsset(sourcePath, targetPath);
      if (copied) {
        console.log(`[copy-ort-assets] ✅ Copied (fallback): ${fileName}`);
        fallbackCopied++;
      }
    }
  }

  // Copy optional files if they exist
  let optionalCopied = 0;
  for (const fileName of OPTIONAL_FILES) {
    const sourcePath = join(ORT_SOURCE_DIR, fileName);
    const targetPath = join(ORT_TARGET_DIR, fileName);

    if (await fileExists(sourcePath)) {
      const copied = await copyAsset(sourcePath, targetPath);
      if (copied) {
        console.log(`[copy-ort-assets] ✅ Copied (optional): ${fileName}`);
        optionalCopied++;
      }
    }
  }

  // Summary
  console.log(`\n[copy-ort-assets] Summary:`);
  console.log(
    `  Required files: ${requiredCopied}/${REQUIRED_FILES.length} copied`,
  );

  if (requiredMissing.length > 0) {
    console.error(`\n[copy-ort-assets] ❌ Missing required files:`);
    requiredMissing.forEach((file) => console.error(`  - ${file}`));
    console.error(
      `\n[copy-ort-assets] Please ensure onnxruntime-web is installed and up to date:\n` +
        `  npm install onnxruntime-web@latest`,
    );
    process.exit(1);
  }

  if (fallbackCopied > 0) {
    console.log(`  Fallback files: ${fallbackCopied} copied`);
  }

  if (optionalCopied > 0) {
    console.log(`  Optional files: ${optionalCopied} copied`);
  }

  console.log(`\n[copy-ort-assets] ✅ All required assets copied successfully`);
  console.log(`  Target: ${ORT_TARGET_DIR}\n`);
}

// Run if called directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("copy-ort-assets.mjs")
) {
  copyOrtAssets().catch((error) => {
    console.error("[copy-ort-assets] ❌ Fatal error:", error);
    process.exit(1);
  });
} else {
  // Always run if this is the main module
  copyOrtAssets().catch((error) => {
    console.error("[copy-ort-assets] ❌ Fatal error:", error);
    process.exit(1);
  });
}

export { copyOrtAssets };
