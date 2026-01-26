import { z } from "zod";

const NonEmptyFloat32Array = z
  .instanceof(Float32Array)
  .refine((arr) => arr.length > 0, { message: "Float32Array channel must contain at least one sample" });

export const StemWorkerInitSchema = z.object({
  type: z.literal("INIT"),
  modelUrl: z.string(),
});

export const StemWorkerSeparateSchema = z.object({
  type: z.literal("SEPARATE"),
  id: z.string(),
  audioBuffer: z.instanceof(ArrayBuffer),
  channels: z.number().int().positive().optional(),
});

export const StemWorkerAbortSchema = z.object({
  type: z.literal("ABORT"),
  id: z.string(),
});

export const StemWorkerPingSchema = z.object({
  type: z.literal("PING"),
});

export const StemWorkerReadySchema = z.object({
  type: z.literal("READY"),
});

export const StemWorkerInitErrorSchema = z.object({
  type: z.literal("INIT_ERROR"),
  error: z.string(),
});

export const StemWorkerProgressSchema = z.object({
  type: z.literal("PROGRESS"),
  id: z.string(),
  value: z.number().min(0).max(1),
});

export const StemWorkerResultSchema = z.object({
  type: z.literal("RESULT"),
  id: z.string(),
  stems: z.object({}).catchall(z.array(NonEmptyFloat32Array)),
});

export const StemWorkerErrorSchema = z.object({
  type: z.literal("ERROR"),
  id: z.string().optional(),
  error: z.string(),
});

export const StemWorkerPongSchema = z.object({
  type: z.literal("PONG"),
});

export const StemWorkerRequestSchema = z.discriminatedUnion("type", [
  StemWorkerInitSchema,
  StemWorkerSeparateSchema,
  StemWorkerAbortSchema,
  StemWorkerPingSchema,
]);

export const StemWorkerResponseSchema = z.discriminatedUnion("type", [
  StemWorkerReadySchema,
  StemWorkerInitErrorSchema,
  StemWorkerProgressSchema,
  StemWorkerResultSchema,
  StemWorkerErrorSchema,
  StemWorkerPongSchema,
]);

export type StemWorkerRequest = z.infer<typeof StemWorkerRequestSchema>;
export type StemWorkerResponse = z.infer<typeof StemWorkerResponseSchema>;
