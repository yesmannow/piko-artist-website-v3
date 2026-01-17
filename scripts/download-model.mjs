#!/usr/bin/env node

/**
 * download-model.mjs - Download ONNX model for local development/testing
 *
 * Downloads the Demucs quantized ONNX model to public/models/demucs_v4_quantized.onnx
 *
 * Usage:
 *   npm run download:model
 *   MODEL_DOWNLOAD_URL=https://custom-url.com/model.onnx npm run download:model
 *
 * Features:
 * - Defaults to Hugging Face model URL
 * - Override via MODEL_DOWNLOAD_URL env var
 * - Prints download progress and file size
 * - Warns if file is >90MB (recommends Git LFS or external hosting)
 * - Never auto-commits to git
 * - Works on Windows PowerShell and Unix shells
 */

import { writeFile, mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");

// Default model URL (Hugging Face)
const DEFAULT_MODEL_URL =
  "https://huggingface.co/timcsy/demucs-web-onnx/resolve/main/htdemucs_embedded.onnx?download=true";

// Output path
const MODEL_DIR = join(ROOT_DIR, "public", "models");
const MODEL_PATH = join(MODEL_DIR, "demucs_v4_quantized.onnx");

// Size warning threshold (90MB)
const SIZE_WARNING_MB = 90;

/**
 * Download file with progress
 */
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirect
          const redirectUrl = response.headers.location;
          console.log(`[download-model] Redirecting to: ${redirectUrl}`);
          return downloadFile(redirectUrl, filePath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download: ${response.statusCode} ${response.statusMessage}`,
            ),
          );
          return;
        }

        const contentLength = parseInt(
          response.headers["content-length"] || "0",
          10,
        );
        const totalMB =
          contentLength > 0
            ? (contentLength / 1024 / 1024).toFixed(2)
            : "unknown";

        console.log(`[download-model] Downloading ${totalMB} MB...`);

        const fileStream = createWriteStream(filePath);
        let downloaded = 0;
        const startTime = Date.now();

        response.on("data", (chunk) => {
          downloaded += chunk.length;
          if (contentLength > 0) {
            const percent = ((downloaded / contentLength) * 100).toFixed(1);
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = downloaded / elapsed / 1024 / 1024; // MB/s
            process.stdout.write(
              `\r[download-model] Progress: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)} MB) @ ${speed.toFixed(2)} MB/s`,
            );
          }
        });

        fileStream.on("finish", () => {
          process.stdout.write("\n"); // New line after progress
          fileStream.close();
          resolve({ size: downloaded, sizeMB: downloaded / 1024 / 1024 });
        });

        fileStream.on("error", (err) => {
          fileStream.close();
          // Try to delete partial file
          import("fs").then((fs) => {
            fs.unlink(filePath, () => {});
          });
          reject(err);
        });

        response.pipe(fileStream);
      })
      .on("error", reject);
  });
}

/**
 * Main function
 */
async function downloadModel() {
  console.log("[download-model] Starting model download...\n");

  // Get download URL
  const modelUrl = process.env.MODEL_DOWNLOAD_URL || DEFAULT_MODEL_URL;
  console.log(`[download-model] Source URL: ${modelUrl}`);
  console.log(`[download-model] Output path: ${MODEL_PATH}\n`);

  // Ensure directory exists
  try {
    await mkdir(MODEL_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Download the model
  try {
    const result = await downloadFile(modelUrl, MODEL_PATH);
    const sizeMB = result.sizeMB.toFixed(2);

    console.log(`[download-model] ✅ Download complete!`);
    console.log(`[download-model] File size: ${sizeMB} MB`);
    console.log(`[download-model] Location: ${MODEL_PATH}\n`);

    // Warn if file is large
    if (result.sizeMB > SIZE_WARNING_MB) {
      console.warn(
        `[download-model] ⚠️  WARNING: Model file is ${sizeMB} MB (>${SIZE_WARNING_MB} MB)`,
      );
      console.warn(`[download-model] ⚠️  Recommendation:`);
      console.warn(
        `[download-model] ⚠️    1. Use Git LFS: git lfs track "*.onnx"`,
      );
      console.warn(
        `[download-model] ⚠️    2. Or use external hosting with NEXT_PUBLIC_MODEL_URL`,
      );
      console.warn(
        `[download-model] ⚠️    3. Add to .gitignore if not using LFS\n`,
      );
    }

    console.log(`[download-model] ✅ Model ready for use!`);
    console.log(`[download-model] Run: npm run check:stem-assets\n`);

    return true;
  } catch (error) {
    console.error(`[download-model] ❌ Download failed:`, error.message);
    console.error(
      `[download-model] Check your internet connection and the model URL`,
    );
    return false;
  }
}

// Run if called directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("download-model.mjs")
) {
  downloadModel()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("[download-model] ❌ Fatal error:", error);
      process.exit(1);
    });
}

export { downloadModel };
