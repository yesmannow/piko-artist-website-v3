/**
 * stemSeparator.worker.ts - Stem Separation Web Worker
 *
 * Phase 8B: Real AI inference with onnxruntime-web
 *
 * Architecture:
 * - onnxruntime-web with backend selection (WebGPU → WASM)
 * - Chunked processing with overlap and crossfade stitching
 * - Non-blocking chunk processing via dedicated Web Worker
 * - Typed message protocol for communication
 * - Progress tracking with stage updates
 * - Transferable objects for zero-copy buffer transfer
 * - Cancellation support
 *
 * Message Types:
 * - READY: Worker is initialized and ready
 * - SEPARATE: Request to separate audio
 * - PROGRESS: Progress update during separation
 * - SEPARATE_COMPLETE: Separation finished successfully
 * - SEPARATE_ERROR: Separation failed
 * - CANCEL: Cancel current separation
 * - ERROR: General error
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type WorkerMessageType =
  | 'READY'
  | 'CONFIG'
  | 'SEPARATE'
  | 'PROGRESS'
  | 'SEPARATE_COMPLETE'
  | 'SEPARATE_ERROR'
  | 'CANCEL'
  | 'ERROR';

interface WorkerMessage {
  type: WorkerMessageType;
  requestId?: string;
  data?: any;
  progress?: number;
  stage?: string;
  message?: string;
  stems?: {
    vocals: ArrayBuffer | null;
    drums: ArrayBuffer | null;
    bass: ArrayBuffer | null;
    other: ArrayBuffer | null;
  };
}

interface SeparateRequest {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  channelBuffers: ArrayBuffer[];
}

interface ChunkResult {
  vocals: Float32Array;
  drums: Float32Array;
  bass: Float32Array;
  other: Float32Array;
  startSample: number;
  endSample: number;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let isInitialized = false;
let currentRequestId: string | null = null;
let isProcessing = false;
let cancellationRequested = false;
let ort: any = null; // onnxruntime-web
let session: any = null; // ONNX inference session
let backend: 'webgpu' | 'wasm' = 'wasm';

// Configuration constants
const CHUNK_SIZE_SAMPLES = 44100 * 10; // 10 seconds at 44.1kHz
const OVERLAP_SAMPLES = 44100 * 1; // 1 second overlap
const CROSSFADE_SAMPLES = 44100 * 0.5; // 0.5 second crossfade
const DEFAULT_MODEL_URL = '/models/demucs_v4_quantized.onnx';
const WASM_PATH = '/ort/'; // Path to ONNX Runtime WASM files

// Runtime configuration (set via CONFIG message)
let activeModelUrl: string = DEFAULT_MODEL_URL;

// ============================================================================
// BACKEND SELECTION
// ============================================================================

/**
 * Detect and select the best available backend
 * Priority: WebGPU > WASM
 */
async function selectBackend(): Promise<'webgpu' | 'wasm'> {
  try {
    // Check for WebGPU support
    if ('gpu' in navigator) {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        console.log('[StemSeparatorWorker] WebGPU backend available');
        return 'webgpu';
      }
    }
  } catch (error) {
    console.warn('[StemSeparatorWorker] WebGPU not available, falling back to WASM:', error);
  }

  console.log('[StemSeparatorWorker] Using WASM backend');
  return 'wasm';
}

/**
 * Load onnxruntime-web with appropriate backend
 *
 * Note: In a Web Worker, we need to handle the import carefully.
 * For now, we'll use a try-catch with fallback to stub mode if ONNX isn't available.
 */
async function loadONNXRuntime(): Promise<void> {
  if (ort) {
    return; // Already loaded
  }

  try {
    // Dynamic import of onnxruntime-web
    ort = await import('onnxruntime-web');

    // Configure WASM paths for local assets
    // This ensures ONNX Runtime loads WASM files from /ort/ instead of CDN
    if (ort.env && ort.env.wasm) {
      ort.env.wasm.wasmPaths = WASM_PATH;
      console.log(`[StemSeparatorWorker] Configured WASM paths: ${WASM_PATH}`);
    }

    // Set backend preference
    backend = await selectBackend();

    // Configure execution providers based on backend
    if (backend === 'webgpu') {
      ort.env.wasm.numThreads = 1; // WebGPU doesn't need threading
    } else {
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      ort.env.wasm.simd = true; // Enable SIMD for WASM
    }

    console.log(`[StemSeparatorWorker] ONNX Runtime loaded with ${backend} backend`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[StemSeparatorWorker] ❌ Failed to load ONNX Runtime:', errorMessage);

    // Send error to main thread for UI display
    self.postMessage({
      type: 'ERROR',
      message: `ONNX Runtime failed to load: ${errorMessage}. Please ensure onnxruntime-web is installed and WASM files are available at ${WASM_PATH}`,
    } as WorkerMessage);

    // Don't set ort to null - throw to prevent stub mode in production
    throw new Error(`ONNX Runtime load failed: ${errorMessage}`);
  }
}

/**
 * Load ONNX model
 */
async function loadModel(): Promise<void> {
  if (session) {
    return; // Already loaded
  }

  if (!ort) {
    throw new Error('ONNX Runtime not loaded. Cannot load model.');
  }

  try {
    self.postMessage({
      type: 'PROGRESS',
      progress: 5,
      stage: 'Loading ONNX model...',
    } as WorkerMessage);

    // Check if model file exists (fast-fail)
    try {
      const modelResponse = await fetch(activeModelUrl, { method: 'HEAD' });
      if (!modelResponse.ok) {
        throw new Error(`Model file not found at ${activeModelUrl}. Status: ${modelResponse.status}`);
      }
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      self.postMessage({
        type: 'ERROR',
        message: `Model file missing: ${activeModelUrl}. ${errorMessage}. Please ensure the model is accessible at the configured URL.`,
      } as WorkerMessage);
      throw new Error(`Model file not found: ${errorMessage}`);
    }

    const executionProviders = backend === 'webgpu'
      ? ['webgpu', 'wasm'] // Try WebGPU first, fallback to WASM
      : ['wasm'];

    session = await ort.InferenceSession.create(activeModelUrl, {
      executionProviders,
      graphOptimizationLevel: 'all',
    });

    console.log('[StemSeparatorWorker] ✅ Model loaded');
    self.postMessage({
      type: 'PROGRESS',
      progress: 10,
      stage: 'Model loaded',
    } as WorkerMessage);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[StemSeparatorWorker] ❌ Failed to load model:', errorMessage);

    // Send detailed error to main thread
    self.postMessage({
      type: 'ERROR',
      message: `Model load failed: ${errorMessage}. Check that ${activeModelUrl} exists and is accessible.`,
    } as WorkerMessage);

    throw new Error(`Failed to load model: ${errorMessage}`);
  }
}

// ============================================================================
// CHUNKING & PROCESSING
// ============================================================================

/**
 * Process a single chunk through the ONNX model
 */
async function processChunk(
  audioData: Float32Array,
  chunkIndex: number,
  totalChunks: number
): Promise<ChunkResult> {
  if (cancellationRequested) {
    throw new Error('Cancelled');
  }

  // Update progress
  const baseProgress = 10; // After model loading
  const processingProgress = 80; // 80% for processing
  const progress = baseProgress + (processingProgress * (chunkIndex + 1)) / totalChunks;

  self.postMessage({
    type: 'PROGRESS',
    requestId: currentRequestId,
    progress: Math.round(progress),
    stage: `Processing chunk ${chunkIndex + 1}/${totalChunks}`,
  } as WorkerMessage);

  // Prepare input tensor
  // Demucs expects shape: [batch, channels, samples]
  // For mono input, we use [1, 1, samples]
  const inputTensor = new ort.Tensor('float32', audioData, [1, 1, audioData.length]);

  // Run inference
  const feeds = { input: inputTensor };
  const results = await session.run(feeds);

  // Extract outputs (Demucs outputs 4 stems: vocals, drums, bass, other)
  // Output shape: [batch, stems, channels, samples]
  const output = results.output as { data: Float32Array; dims: number[] };
  const outputData = output.data as Float32Array;
  const [batch, numStems, channels, samples] = output.dims;

  // Extract each stem (assuming output order: vocals, drums, bass, other)
  const stemLength = channels * samples;
  const vocals = outputData.slice(0, stemLength);
  const drums = outputData.slice(stemLength, stemLength * 2);
  const bass = outputData.slice(stemLength * 2, stemLength * 3);
  const other = outputData.slice(stemLength * 3, stemLength * 4);

  // If stereo output, mix to mono for now
  const toMono = (stereo: Float32Array): Float32Array => {
    if (channels === 1) return stereo;
    const mono = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) / 2;
    }
    return mono;
  };

  return {
    vocals: toMono(vocals),
    drums: toMono(drums),
    bass: toMono(bass),
    other: toMono(other),
    startSample: chunkIndex * (CHUNK_SIZE_SAMPLES - OVERLAP_SAMPLES),
    endSample: chunkIndex * (CHUNK_SIZE_SAMPLES - OVERLAP_SAMPLES) + samples,
  };
}

/**
 * Apply crossfade between two chunks to avoid seams
 */
function crossfadeChunks(
  previous: Float32Array,
  current: Float32Array,
  fadeLength: number = CROSSFADE_SAMPLES
): Float32Array {
  const result = new Float32Array(previous.length + current.length - fadeLength);

  // Copy previous chunk (except fade region)
  result.set(previous.slice(0, previous.length - fadeLength), 0);

  // Crossfade region: blend previous and current
  for (let i = 0; i < fadeLength; i++) {
    const t = i / fadeLength; // 0 to 1
    const fadeOut = 1 - t; // Previous fades out
    const fadeIn = t; // Current fades in

    const prevIdx = previous.length - fadeLength + i;
    const currIdx = i;
    const resultIdx = previous.length - fadeLength + i;

    result[resultIdx] = previous[prevIdx] * fadeOut + current[currIdx] * fadeIn;
  }

  // Copy remaining current chunk
  result.set(current.slice(fadeLength), previous.length - fadeLength);

  return result;
}

/**
 * Stitch chunks together with crossfading
 */
function stitchChunks(chunks: ChunkResult[], totalLength: number): {
  vocals: Float32Array;
  drums: Float32Array;
  bass: Float32Array;
  other: Float32Array;
} {
  const vocals = new Float32Array(totalLength);
  const drums = new Float32Array(totalLength);
  const bass = new Float32Array(totalLength);
  const other = new Float32Array(totalLength);

  let previousChunk: ChunkResult | null = null;

  for (const chunk of chunks) {
    if (previousChunk) {
      // Crossfade with previous chunk
      const prevVocals = vocals.slice(
        previousChunk.startSample,
        previousChunk.endSample
      );
      const prevDrums = drums.slice(
        previousChunk.startSample,
        previousChunk.endSample
      );
      const prevBass = bass.slice(
        previousChunk.startSample,
        previousChunk.endSample
      );
      const prevOther = other.slice(
        previousChunk.startSample,
        previousChunk.endSample
      );

      const fadedVocals = crossfadeChunks(prevVocals, chunk.vocals);
      const fadedDrums = crossfadeChunks(prevDrums, chunk.drums);
      const fadedBass = crossfadeChunks(prevBass, chunk.bass);
      const fadedOther = crossfadeChunks(prevOther, chunk.other);

      vocals.set(fadedVocals, previousChunk.startSample);
      drums.set(fadedDrums, previousChunk.startSample);
      bass.set(fadedBass, previousChunk.startSample);
      other.set(fadedOther, previousChunk.startSample);
    } else {
      // First chunk: just copy
      vocals.set(chunk.vocals, chunk.startSample);
      drums.set(chunk.drums, chunk.startSample);
      bass.set(chunk.bass, chunk.startSample);
      other.set(chunk.other, chunk.startSample);
    }

    previousChunk = chunk;
  }

  return { vocals, drums, bass, other };
}

/**
 * Stub separation: Returns the original mix as all 4 stems
 * Used as fallback when ONNX Runtime is not available
 */
async function stubSeparate(
  request: SeparateRequest,
  requestId: string
): Promise<void> {
  if (isProcessing) {
    self.postMessage({
      type: 'SEPARATE_ERROR',
      requestId,
      message: 'Already processing',
    } as WorkerMessage);
    return;
  }

  isProcessing = true;
  currentRequestId = requestId;
  cancellationRequested = false;

  try {
    // Report progress stages
    const stages = [
      { progress: 10, stage: 'Loading audio data' },
      { progress: 30, stage: 'Preparing separation (stub mode)' },
      { progress: 50, stage: 'Processing stems (stub mode)' },
      { progress: 70, stage: 'Finalizing stems' },
      { progress: 100, stage: 'Complete' },
    ];

    for (const stage of stages) {
      if (cancellationRequested) {
        throw new Error('Cancelled');
      }

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 200));

      self.postMessage({
        type: 'PROGRESS',
        requestId,
        progress: stage.progress,
        stage: stage.stage,
      } as WorkerMessage);
    }

    // STUB: Return original mix as all 4 stems
    // Mix down to mono if stereo
    let monoBuffer: Float32Array;

    if (request.channelBuffers.length === 2) {
      // Stereo: mix down to mono
      const left = new Float32Array(request.channelBuffers[0]);
      const right = new Float32Array(request.channelBuffers[1]);
      monoBuffer = new Float32Array(request.length);

      for (let i = 0; i < request.length; i++) {
        monoBuffer[i] = (left[i] + right[i]) / 2;
      }
    } else {
      // Mono: use as-is
      monoBuffer = new Float32Array(request.channelBuffers[0]);
    }

    // Return the same mono buffer for all 4 stems
    // This allows testing routing, UX, and caching
    const stems = {
      vocals: monoBuffer.buffer.slice(0), // Copy buffer
      drums: monoBuffer.buffer.slice(0),
      bass: monoBuffer.buffer.slice(0),
      other: monoBuffer.buffer.slice(0),
    };

    // Transfer ownership of buffers
    const transferBuffers = [
      stems.vocals,
      stems.drums,
      stems.bass,
      stems.other,
    ];

    (self as DedicatedWorkerGlobalScope).postMessage(
      {
        type: 'SEPARATE_COMPLETE',
        requestId,
        stems,
        message: 'Stub separation complete (all stems = original mix)',
      } as WorkerMessage,
      transferBuffers as Transferable[] // Transfer list: zero-copy
    );

    console.log('[StemSeparatorWorker] ✅ Stub separation complete');

  } catch (error) {
    if (error instanceof Error && error.message === 'Cancelled') {
      self.postMessage({
        type: 'SEPARATE_ERROR',
        requestId,
        message: 'Separation cancelled',
      } as WorkerMessage);
    } else {
      console.error('[StemSeparatorWorker] ❌ Separation failed:', error);
      self.postMessage({
        type: 'SEPARATE_ERROR',
        requestId,
        message: error instanceof Error ? error.message : 'Unknown error',
      } as WorkerMessage);
    }
  } finally {
    isProcessing = false;
    currentRequestId = null;
    cancellationRequested = false;
  }
}

/**
 * Separate audio using chunked processing with overlap and crossfade
 */
async function separateAudio(
  request: SeparateRequest,
  requestId: string
): Promise<void> {
  if (isProcessing) {
    self.postMessage({
      type: 'SEPARATE_ERROR',
      requestId,
      message: 'Already processing',
    } as WorkerMessage);
    return;
  }

  isProcessing = true;
  currentRequestId = requestId;
  cancellationRequested = false;

  try {
    // Load ONNX Runtime and model if not already loaded
    await loadONNXRuntime();

    // Fast-fail if ONNX Runtime failed to load (no silent stub fallback in production)
    if (!ort) {
      const errorMsg = 'ONNX Runtime failed to load. Stem separation unavailable.';
      self.postMessage({
        type: 'SEPARATE_ERROR',
        requestId,
        message: errorMsg,
      } as WorkerMessage);
      throw new Error(errorMsg);
    }

    await loadModel();

    // Fast-fail if model failed to load
    if (!session) {
      const errorMsg = `Model failed to load from ${activeModelUrl}. Please ensure the model file exists.`;
      self.postMessage({
        type: 'SEPARATE_ERROR',
        requestId,
        message: errorMsg,
      } as WorkerMessage);
      throw new Error(errorMsg);
    }

    // Convert input to mono Float32Array
    let monoData: Float32Array;
    if (request.channelBuffers.length === 2) {
      // Stereo: mix down to mono
      const left = new Float32Array(request.channelBuffers[0]);
      const right = new Float32Array(request.channelBuffers[1]);
      monoData = new Float32Array(request.length);

      for (let i = 0; i < request.length; i++) {
        monoData[i] = (left[i] + right[i]) / 2;
      }
    } else {
      // Mono: use as-is
      monoData = new Float32Array(request.channelBuffers[0]);
    }

    // Calculate chunks
    const totalSamples = monoData.length;
    const chunkStep = CHUNK_SIZE_SAMPLES - OVERLAP_SAMPLES;
    const numChunks = Math.ceil((totalSamples - OVERLAP_SAMPLES) / chunkStep);

    self.postMessage({
      type: 'PROGRESS',
      requestId,
      progress: 15,
      stage: `Processing ${numChunks} chunks...`,
    } as WorkerMessage);

    // Process chunks (non-blocking: yield to event loop between chunks)
    const chunkResults: ChunkResult[] = [];

    for (let i = 0; i < numChunks; i++) {
      if (cancellationRequested) {
        throw new Error('Cancelled');
      }

      const start = i * chunkStep;
      const end = Math.min(start + CHUNK_SIZE_SAMPLES, totalSamples);
      const chunkData = monoData.slice(start, end);

      // Pad chunk if necessary (model expects fixed size)
      let paddedChunk = chunkData;
      if (chunkData.length < CHUNK_SIZE_SAMPLES) {
        paddedChunk = new Float32Array(CHUNK_SIZE_SAMPLES);
        paddedChunk.set(chunkData);
      }

      // Process chunk
      const result = await processChunk(paddedChunk, i, numChunks);
      result.startSample = start;
      result.endSample = end;
      chunkResults.push(result);

      // Yield to event loop to prevent UI blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Stitch chunks together
    self.postMessage({
      type: 'PROGRESS',
      requestId,
      progress: 90,
      stage: 'Stitching chunks...',
    } as WorkerMessage);

    const stitched = stitchChunks(chunkResults, totalSamples);

    // Convert to ArrayBuffers for transfer
    const stems = {
      vocals: stitched.vocals.buffer.slice(0),
      drums: stitched.drums.buffer.slice(0),
      bass: stitched.bass.buffer.slice(0),
      other: stitched.other.buffer.slice(0),
    };

    // Transfer ownership of buffers
    const transferBuffers = [
      stems.vocals,
      stems.drums,
      stems.bass,
      stems.other,
    ];

    (self as DedicatedWorkerGlobalScope).postMessage(
      {
        type: 'SEPARATE_COMPLETE',
        requestId,
        stems,
        message: 'Separation complete',
      } as WorkerMessage,
      transferBuffers as Transferable[] // Transfer list: zero-copy
    );

    console.log('[StemSeparatorWorker] ✅ Separation complete');

  } catch (error) {
    if (error instanceof Error && error.message === 'Cancelled') {
      self.postMessage({
        type: 'SEPARATE_ERROR',
        requestId,
        message: 'Separation cancelled',
      } as WorkerMessage);
    } else {
      console.error('[StemSeparatorWorker] ❌ Separation failed:', error);
      self.postMessage({
        type: 'SEPARATE_ERROR',
        requestId,
        message: error instanceof Error ? error.message : 'Unknown error',
      } as WorkerMessage);
    }
  } finally {
    isProcessing = false;
    currentRequestId = null;
    cancellationRequested = false;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the worker
 * Sends READY message when complete
 */
async function initialize(): Promise<void> {
  if (isInitialized) {
    return;
  }

  console.log('[StemSeparatorWorker] Initializing...');

  try {
    // Load ONNX Runtime (model will be loaded on first use)
    await loadONNXRuntime();

    isInitialized = true;

    self.postMessage({
      type: 'READY',
      message: 'Stem separator worker ready',
    } as WorkerMessage);

    console.log('[StemSeparatorWorker] ✅ Ready');
  } catch (error) {
    console.error('[StemSeparatorWorker] ❌ Initialization failed:', error);
    self.postMessage({
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Initialization failed',
    } as WorkerMessage);
  }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, requestId, data } = event.data;

  try {
    switch (type) {
      case 'READY':
        // Client requesting initialization
        await initialize();
        break;

      case 'CONFIG':
        // Configuration message: update model URL
        if (data && typeof data === 'object' && 'modelUrl' in data) {
          const newModelUrl = data.modelUrl as string;
          if (newModelUrl && typeof newModelUrl === 'string') {
            activeModelUrl = newModelUrl;
            console.log(`[StemSeparatorWorker] Model URL configured: ${activeModelUrl}`);

            // If session exists, it was loaded with old URL - invalidate it
            if (session) {
              console.warn('[StemSeparatorWorker] Model URL changed, existing session will be reloaded on next separation');
              session = null;
            }
          }
        }
        break;

      case 'SEPARATE':
        if (!requestId || !data) {
          self.postMessage({
            type: 'ERROR',
            message: 'Invalid SEPARATE request: missing requestId or data',
          } as WorkerMessage);
          return;
        }

        await separateAudio(data as SeparateRequest, requestId);
        break;

      case 'CANCEL':
        if (requestId === currentRequestId && isProcessing) {
          cancellationRequested = true;
          console.log('[StemSeparatorWorker] Cancellation requested');
        }
        break;

      default:
        console.warn('[StemSeparatorWorker] Unknown message type:', type);
    }
  } catch (error) {
    console.error('[StemSeparatorWorker] Error handling message:', error);
    self.postMessage({
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerMessage);
  }
};

// Export empty object to make TypeScript happy with worker module
export {};
