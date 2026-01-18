export interface KeyResult {
  root: string;
  scale: "major" | "minor";
  camelot: string;
}

type WorkerResponse =
  | { type: "ANALYZE_KEY_DONE"; data: KeyResult }
  | { type: "ANALYZE_KEY_ERROR"; error?: string }
  | { type: "ANALYZE_KEY_START" };

/**
 * Analyze an AudioBuffer for its musical key using the key.worker.
 * Resolves with Camelot/root/scale or rejects with an error string.
 */
export async function analyzeTrackKey(
  audioBuffer: AudioBuffer,
): Promise<KeyResult> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    throw new Error("Key analysis worker unavailable in this environment");
  }

  const worker = new Worker(
    new URL("../../workers/key.worker.ts", import.meta.url),
    { type: "module" },
  );

  return new Promise<KeyResult>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerResponse | any>) => {
      const payload = event.data as WorkerResponse;
      const { type, data, error } = payload as any;
      if (type === "ANALYZE_KEY_DONE" && data) {
        resolve(data);
        worker.terminate();
      }
      if (type === "ANALYZE_KEY_ERROR") {
        reject(
          new Error(
            error || "Key detection failed (worker returned an unknown error)",
          ),
        );
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      reject(new Error(err.message || "Key detection worker error"));
      worker.terminate();
    };

    worker.postMessage({
      type: "ANALYZE_KEY_START",
      input: {
        channelData: [audioBuffer.getChannelData(0)],
        sampleRate: audioBuffer.sampleRate,
      },
    });
  });
}
