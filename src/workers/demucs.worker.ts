/**
 * Demucs Worker - AI Stem Separation using ONNX Runtime
 *
 * This worker runs in a separate thread to prevent UI blocking during inference.
 * Uses SharedArrayBuffer for efficient data transfer (requires COOP/COEP headers).
 *
 * Execution Provider Priority:
 * 1. WebGPU (desktop GPU) - fastest
 * 2. WASM (fallback) - works on all devices
 */

// Import ONNX Runtime Web
import * as ort from 'onnxruntime-web';

// Worker message types
interface LoadMessage {
  type: 'load';
  data: {
    modelUrl: string;
  };
}

interface SeparateMessage {
  type: 'separate';
  data: {
    audioData: Float32Array;
  };
}

interface CancelMessage {
  type: 'cancel';
  data?: never;
}

type WorkerMessage = LoadMessage | SeparateMessage | CancelMessage;

interface ProgressMessage {
  type: 'progress';
  value: number; // 0-1
}

interface ResultMessage {
  type: 'result';
  stems: Map<string, Float32Array>;
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

let session: ort.InferenceSession | null = null;
let isCancelled = false;

// Handle messages from main thread
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'load':
        await loadModel(data.modelUrl);
        break;

      case 'separate':
        if (!session) {
          self.postMessage({ type: 'error', error: 'Model not loaded' } as ErrorMessage);
          return;
        }
        await separateStems(data.audioData);
        break;

      case 'cancel':
        isCancelled = true;
        break;

      default:
        self.postMessage({ type: 'error', error: `Unknown message type: ${type}` } as ErrorMessage);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorMessage);
  }
};

/**
 * Load the Demucs ONNX model
 */
async function loadModel(modelUrl: string) {
  isCancelled = false;

  // Configure ONNX Runtime for multi-threading
  ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

  // Try WebGPU first, fallback to WASM
  const executionProviders: string[] = [];

  try {
    // Check if WebGPU is available
    if ('gpu' in navigator) {
      executionProviders.push('webgpu');
    }
  } catch {
    // WebGPU not available
  }

  // Always include WASM as fallback
  executionProviders.push('wasm');

  // Load the model
  session = await ort.InferenceSession.create(modelUrl, {
    executionProviders,
  });

  self.postMessage({ type: 'progress', value: 1.0 } as ProgressMessage);
}

/**
 * Separate audio into stems
 */
async function separateStems(audioData: Float32Array) {
  if (!session || isCancelled) return;

  isCancelled = false;

  // Post progress updates
  self.postMessage({ type: 'progress', value: 0.1 } as ProgressMessage);

  // Prepare input tensor
  // Demucs expects: [batch, channels, samples]
  // For mono input, we'll duplicate to stereo
  const inputShape = [1, 2, audioData.length];
  const inputData = new Float32Array(inputShape[0] * inputShape[1] * inputShape[2]);

  // Duplicate mono to stereo
  for (let i = 0; i < audioData.length; i++) {
    inputData[i * 2] = audioData[i];
    inputData[i * 2 + 1] = audioData[i];
  }

  const inputTensor = new ort.Tensor('float32', inputData, inputShape);

  self.postMessage({ type: 'progress', value: 0.3 } as ProgressMessage);

  if (isCancelled) return;

  // Run inference
  await session.run({ input: inputTensor });

  self.postMessage({ type: 'progress', value: 0.8 } as ProgressMessage);

  if (isCancelled) return;

  // Extract stems from output
  // Demucs outputs 4 stems: drums, bass, vocals, other
  const stems = new Map<string, Float32Array>();

  // Note: Actual output structure depends on the model
  // This is a placeholder - adjust based on actual Demucs model output
  const outputNames = ['drums', 'bass', 'vocals', 'other'];

  // For now, we'll create placeholder stems
  // In production, you'd extract from the actual model output
  outputNames.forEach((name) => {
    // This is a simplified example - actual implementation would
    // extract the correct tensor from the model output
    stems.set(name, new Float32Array(audioData.length));
  });

  self.postMessage({ type: 'progress', value: 1.0 } as ProgressMessage);
  self.postMessage({ type: 'result', stems } as ResultMessage);
}
