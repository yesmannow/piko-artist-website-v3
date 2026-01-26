/// <reference lib="webworker" />

import * as ort from "onnxruntime-web";
import {
  StemWorkerRequestSchema,
  StemWorkerResponseSchema,
} from "@/utils/stems/stemMessageSchema";
import type { Float32ArrayBuffer } from "@/workers/stem.types";

declare const self: DedicatedWorkerGlobalScope;
export {};

const respond = (response: unknown) => {
  const parsed = StemWorkerResponseSchema.safeParse(response);
  if (!parsed.success) {
    console.error("[StemWorker] Invalid response payload", parsed.error);
    return;
  }
  self.postMessage(parsed.data);
};

const respondWithError = (error: string, id?: string) => {
  respond({ type: "ERROR", id, error });
};

let session: ort.InferenceSession | null = null;
let initialized = false;
const aborted = new Set<string>();

async function pcmToInputTensor(audioBuffer: Float32Array, channels: number): Promise<ort.Tensor> {
  const samples = audioBuffer.length / channels;
  const data = Float32Array.from(audioBuffer);
  return new ort.Tensor("float32", data, [1, channels, samples]);
}

function extractStemFromOutput(output: ort.OnnxValue, channels: number): Float32ArrayBuffer[] {
  const tensor = output.data as Float32Array;
  const dims = (output.dims ?? []) as number[];
  const samples = dims[2] ?? Math.floor(tensor.length / channels);
  const stems: Float32ArrayBuffer[] = [];

  for (let ch = 0; ch < channels; ch++) {
    const channelData = new Float32Array(samples) as Float32ArrayBuffer;
    const offset = ch * samples;
    for (let i = 0; i < samples; i++) {
      channelData[i] = tensor[offset + i];
    }
    stems.push(channelData);
  }

  return stems;
}

self.onmessage = async (event: MessageEvent) => {
  const parsed = StemWorkerRequestSchema.safeParse(event.data);
  if (!parsed.success) {
    respondWithError("Invalid worker request");
    return;
  }

  const msg = parsed.data;

  try {
    switch (msg.type) {
      case "INIT": {
        if (initialized) {
          respond({ type: "READY" });
          return;
        }

        const hasWebGPU =
          typeof self !== "undefined" &&
          "navigator" in self &&
          typeof (self as typeof self & { navigator?: { gpu?: unknown } }).navigator?.gpu !== "undefined";
        const providers = hasWebGPU ? ["webgpu", "wasm"] : ["wasm"];

        session = await ort.InferenceSession.create(msg.modelUrl, {
          executionProviders: providers,
        });

        initialized = true;
        respond({ type: "READY" });
        return;
      }
      case "ABORT": {
        aborted.add(msg.id);
        return;
      }
      case "PING": {
        respond({ type: "PONG" });
        return;
      }
      case "SEPARATE": {
        if (!session) {
          respondWithError("Session not initialized", msg.id);
          return;
        }

        if (aborted.has(msg.id)) {
          respondWithError("Stem job aborted", msg.id);
          aborted.delete(msg.id);
          return;
        }

        const { id, audioBuffer, channels = 2 } = msg;
        const pcm = new Float32Array(audioBuffer);

        const inputTensor = await pcmToInputTensor(pcm, channels);
        const feeds: Record<string, ort.Tensor> = {
          input: inputTensor,
        };

        const results: Record<string, ort.OnnxValue> = await session.run(feeds);

        const stems: Record<string, Float32ArrayBuffer[]> = {};
        if (results.vocals) {
          stems.vocals = extractStemFromOutput(results.vocals, channels);
        }
        if (results.drums) {
          stems.drums = extractStemFromOutput(results.drums, channels);
        }
        if (results.bass) {
          stems.bass = extractStemFromOutput(results.bass, channels);
        }
        if (results.other) {
          stems.other = extractStemFromOutput(results.other, channels);
        }

        if (Object.keys(stems).length === 0) {
          respondWithError("Stem separation returned no data", id);
          return;
        }

        respond({ type: "RESULT", id, stems });
        return;
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    if (msg.type === "INIT") {
      respond({ type: "INIT_ERROR", error });
      return;
    }

    const id = "id" in msg ? (msg as { id?: string }).id : undefined;
    respondWithError(error, id);
  }
};
