/**
 * onnxLoader.ts - ONNX Runtime Loader Utility
 *
 * Phase 8B: Helper for loading onnxruntime-web in Web Workers
 *
 * Handles dynamic import and backend selection for Web Workers
 */

/**
 * Load onnxruntime-web in a Web Worker context
 * Uses importScripts or dynamic import depending on worker type
 */
export async function loadONNXRuntimeInWorker(): Promise<any> {
  // Try dynamic import first (for module workers)
  try {
    const ort = await import("onnxruntime-web");
    return ort;
  } catch (error) {
    // Fallback: try loading from CDN or public path
    console.warn(
      "[onnxLoader] Dynamic import failed, trying alternative method:",
      error,
    );

    // For classic workers, we might need to use importScripts
    // But since we're using module workers, this is a fallback
    throw new Error(
      "Failed to load ONNX Runtime. Ensure onnxruntime-web is installed.",
    );
  }
}

/**
 * Detect available backends and select the best one
 */
export async function selectBackend(): Promise<"webgpu" | "wasm"> {
  try {
    // Check for WebGPU support
    if (typeof navigator !== "undefined" && "gpu" in navigator) {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        console.log("[onnxLoader] WebGPU backend available");
        return "webgpu";
      }
    }
  } catch (error) {
    console.warn(
      "[onnxLoader] WebGPU not available, falling back to WASM:",
      error,
    );
  }

  console.log("[onnxLoader] Using WASM backend");
  return "wasm";
}

/**
 * Configure ONNX Runtime environment based on backend
 */
export function configureONNXEnvironment(
  ort: any,
  backend: "webgpu" | "wasm",
): void {
  if (backend === "webgpu") {
    ort.env.wasm.numThreads = 1; // WebGPU doesn't need threading
  } else {
    ort.env.wasm.numThreads =
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    ort.env.wasm.simd = true; // Enable SIMD for WASM
  }
}
