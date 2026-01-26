import type { StemWorkerResult } from "@/workers/stem.types";

export function isStemWorkerResult(msg: unknown): msg is StemWorkerResult {
  if (!msg || typeof msg !== "object") return false;

  const anyMsg = msg as Record<string, unknown>;

  if (anyMsg.type !== "RESULT") return false;
  if (typeof anyMsg.id !== "string") return false;
  if (typeof anyMsg.stems !== "object" || anyMsg.stems === null) return false;

  for (const [key, value] of Object.entries(anyMsg.stems)) {
    if (typeof key !== "string") return false;
    if (!Array.isArray(value)) return false;

    for (const channel of value) {
      if (!(channel instanceof Float32Array)) return false;
      if (channel.length === 0) return false;
    }
  }

  return true;
}
