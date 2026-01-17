#!/usr/bin/env node

/**
 * test-model-url.mjs - Test if model URL is accessible
 *
 * Usage:
 *   NEXT_PUBLIC_MODEL_URL=https://your-url.com/model.onnx node scripts/test-model-url.mjs
 */

const modelUrl = process.env.NEXT_PUBLIC_MODEL_URL || process.env.MODEL_URL;

if (!modelUrl) {
  console.error("❌ No model URL provided");
  console.error("Set NEXT_PUBLIC_MODEL_URL or MODEL_URL environment variable");
  process.exit(1);
}

console.log(`🔍 Testing model URL: ${modelUrl}\n`);

try {
  const response = await fetch(modelUrl, { method: "HEAD" });

  if (response.ok) {
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const sizeMB = contentLength
      ? (parseInt(contentLength) / 1024 / 1024).toFixed(2)
      : "unknown";

    console.log("✅ Model URL is accessible!");
    console.log(`   Content-Type: ${contentType || "unknown"}`);
    console.log(`   Size: ${sizeMB} MB`);
    console.log(`   Status: ${response.status} ${response.statusText}\n`);

    // Check if it's actually an ONNX file
    if (
      contentType &&
      !contentType.includes("octet-stream") &&
      !contentType.includes("onnx")
    ) {
      console.warn("⚠️  Warning: Content-Type doesn't look like an ONNX file");
      console.warn("   Expected: application/octet-stream or similar");
      console.warn("   Got:", contentType);
    }

    console.log("✅ URL is ready to use!");
    console.log("   Set this in Vercel: NEXT_PUBLIC_MODEL_URL=" + modelUrl);
  } else {
    console.error(
      `❌ Model URL returned error: ${response.status} ${response.statusText}`,
    );
    console.error("   Check that the URL is correct and publicly accessible");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Failed to fetch model URL:");
  console.error("   Error:", error.message);
  console.error("\n   Possible issues:");
  console.error("   - URL is incorrect");
  console.error("   - Server is down");
  console.error("   - CORS/network restrictions");
  console.error("   - Authentication required");
  process.exit(1);
}
