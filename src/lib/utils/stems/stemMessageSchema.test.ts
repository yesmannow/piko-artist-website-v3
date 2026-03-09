import { describe, it, expect } from "vitest";
import {
  StemWorkerRequestSchema,
  StemWorkerResultSchema,
} from "./stemMessageSchema";
import { isStemWorkerResult } from "./validateWorkerOutput";

describe("Stem worker message schemas", () => {
  it("accepts a valid RESULT message", () => {
    const msg = {
      type: "RESULT",
      id: "test-1",
      stems: {
        vocals: [new Float32Array([0.1, 0.2])],
      },
    };

    const parsed = StemWorkerResultSchema.parse(msg);
    expect(parsed.id).toBe("test-1");
    expect(parsed.stems.vocals[0]).toBeInstanceOf(Float32Array);
  });

  it("rejects a RESULT message with non-Float32Array channels", () => {
    const msg = {
      type: "RESULT",
      id: "test-2",
      stems: {
        vocals: [[0.1, 0.2]],
      },
    };

    expect(() => StemWorkerResultSchema.parse(msg)).toThrow();
  });

  it("validates a SEPARATE request", () => {
    const msg = {
      type: "SEPARATE",
      id: "abc",
      audioBuffer: new ArrayBuffer(8),
    };

    const parsed = StemWorkerRequestSchema.parse(msg);
    expect(parsed.type).toBe("SEPARATE");
    if (parsed.type === "SEPARATE") {
      expect(parsed.id).toBe("abc");
    }
  });

  it("rejects an invalid request type", () => {
    const msg = {
      type: "FOO",
    };

    const result = StemWorkerRequestSchema.safeParse(msg);
    expect(result.success).toBe(false);
  });
});

describe("isStemWorkerResult", () => {
  it("returns true for a valid RESULT message", () => {
    const msg = {
      type: "RESULT",
      id: "ok",
      stems: {
        drums: [new Float32Array([0, 1, 2])],
      },
    };

    expect(isStemWorkerResult(msg)).toBe(true);
  });

  it("returns false for a non-RESULT message", () => {
    const msg = {
      type: "READY",
    };

    expect(isStemWorkerResult(msg)).toBe(false);
  });
});
