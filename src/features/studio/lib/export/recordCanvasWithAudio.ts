"use client";

import { AudioContextManager } from "@/features/audio-engine/lib/AudioContextManager";
import { MasterBus } from "@/features/audio-engine/lib/MasterBus";

function pickMimeType(): { mimeType: string; ext: string } {
  const candidates: Array<{ mimeType: string; ext: string }> = [
    { mimeType: "video/mp4", ext: "mp4" },
    { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" },
    { mimeType: "video/webm;codecs=vp9,opus", ext: "webm" },
    { mimeType: "video/webm;codecs=vp8,opus", ext: "webm" },
    { mimeType: "video/webm", ext: "webm" },
  ];

  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: "video/webm", ext: "webm" };
}

export async function recordCanvasWithAudio(opts: {
  canvas: HTMLCanvasElement;
  fps?: number;
  durationSeconds: number;
}): Promise<{ blob: Blob; mimeType: string; ext: string }> {
  const { canvas, fps = 60, durationSeconds } = opts;

  const manager = AudioContextManager.getInstance();
  const ctx = manager.getContext();
  if (!ctx) throw new Error("AudioContext not available.");
  await manager.resume();

  const videoStream = canvas.captureStream(fps);
  const dest = ctx.createMediaStreamDestination();
  MasterBus.getInstance().connectTap(dest);

  const stream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const { mimeType, ext } = pickMimeType();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = () => reject(new Error("Recording failed."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  recorder.start(250);

  await new Promise((r) => setTimeout(r, Math.max(0, durationSeconds) * 1000));
  recorder.stop();

  const blob = await done;

  // Cleanup
  MasterBus.getInstance().disconnectTap(dest);
  stream.getTracks().forEach((t) => t.stop());

  return { blob, mimeType, ext };
}

