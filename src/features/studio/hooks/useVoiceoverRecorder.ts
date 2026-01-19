"use client";

import { useCallback, useRef, useState } from "react";
import { StudioEngine } from "../lib/StudioEngine";
import { StudioBufferCache } from "../lib/StudioBufferCache";
import { useStudioStore } from "../stores/useStudioStore";
import { TimelineEngine } from "../lib/TimelineEngine";

function peakCacheFromBuffer(buffer: AudioBuffer, targetPoints: number = 1024): Float32Array {
  const channels = Math.min(1, buffer.numberOfChannels);
  const len = buffer.length;
  const points = Math.max(256, Math.min(targetPoints, len));
  const hop = Math.max(1, Math.floor(len / points));

  const peaks = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const start = i * hop;
    const end = Math.min(len, start + hop);
    let max = 0;
    for (let ch = 0; ch < channels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let s = start; s < end; s++) {
        const v = Math.abs(data[s] ?? 0);
        if (v > max) max = v;
      }
    }
    peaks[i] = max;
  }

  let globalMax = 0;
  for (let i = 0; i < peaks.length; i++) globalMax = Math.max(globalMax, peaks[i] || 0);
  if (globalMax > 0) {
    for (let i = 0; i < peaks.length; i++) peaks[i] = peaks[i] / globalMax;
  }
  return peaks;
}

type RecorderChunkMsg = { type: "chunk"; samples: Float32Array };

export function useVoiceoverRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);

  const chunksRef = useRef<Float32Array[]>([]);
  const pendingStopRef = useRef(false);

  const start = useCallback(async () => {
    if (isRecording) return;
    setError(null);
    chunksRef.current = [];
    pendingStopRef.current = false;

    try {
      const engine = StudioEngine.getInstance();
      const ctx = await engine.initFromUserGesture();

      // Ensure recorder worklet is loaded
      await ctx.audioWorklet.addModule("/worklets/recorder-processor.js");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const src = ctx.createMediaStreamSource(stream);
      sourceRef.current = src;

      const node = new AudioWorkletNode(ctx, "recorder-processor");
      workletRef.current = node;

      // Keep node running but prevent feedback
      const silent = ctx.createGain();
      silent.gain.value = 0;
      silentGainRef.current = silent;

      node.connect(silent);
      silent.connect(ctx.destination);

      node.port.onmessage = (evt: MessageEvent<RecorderChunkMsg>) => {
        const msg = evt.data;
        if (!msg || msg.type !== "chunk") return;
        chunksRef.current.push(msg.samples);

        // If we requested stop and this was the flush, finalize.
        if (pendingStopRef.current) {
          // no-op here; stop() will finalize after flush
        }
      };

      src.connect(node);
      node.port.postMessage({ type: "reset" });

      setIsRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start recording.");
      setIsRecording(false);
    }
  }, [isRecording]);

  const stop = useCallback(async () => {
    if (!isRecording) return;
    pendingStopRef.current = true;

    try {
      const engine = StudioEngine.getInstance();
      const ctx = await engine.initFromUserGesture();

      // Flush remaining samples
      workletRef.current?.port.postMessage({ type: "flush" });

      // Small delay to allow flush message delivery
      await new Promise((r) => setTimeout(r, 30));

      // Disconnect graph
      try {
        sourceRef.current?.disconnect();
      } catch {}
      try {
        workletRef.current?.disconnect();
      } catch {}
      try {
        silentGainRef.current?.disconnect();
      } catch {}

      // Stop mic tracks
      streamRef.current?.getTracks().forEach((t) => t.stop());

      // Assemble PCM
      const chunks = chunksRef.current;
      const total = chunks.reduce((acc, c) => acc + c.length, 0);
      if (total <= 0) {
        setError("No audio captured (mic permission or input may be muted).");
        return;
      }

      const mono = new Float32Array(total);
      let offset = 0;
      for (const c of chunks) {
        mono.set(c, offset);
        offset += c.length;
      }

      // Create AudioBuffer
      const buffer = ctx.createBuffer(1, mono.length, ctx.sampleRate);
      buffer.getChannelData(0).set(mono);

      // Create clip and add to Voiceover track at current timeline playhead (or 0)
      const state = useStudioStore.getState();
      const voiceTrackId = state.ensureVoiceoverTrack();
      const startSeconds = TimelineEngine.getInstance().getPositionSeconds();

      const clipId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `clip-${crypto.randomUUID()}`
          : `clip-${Math.random().toString(16).slice(2)}`;

      StudioBufferCache.getInstance().setClipBuffer(clipId, buffer);

      useStudioStore.getState().addTimelineClip(voiceTrackId, {
        id: clipId,
        name: `Voiceover_${new Date().toISOString().slice(11, 19).replace(/:/g, "")}`,
        startSeconds: Math.max(0, startSeconds),
        durationSeconds: buffer.duration,
        sourceOffsetSeconds: 0,
        sourceDurationSeconds: buffer.duration,
        peaks: peakCacheFromBuffer(buffer, 1024),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to finalize recording.");
    } finally {
      streamRef.current = null;
      sourceRef.current = null;
      workletRef.current = null;
      silentGainRef.current = null;
      chunksRef.current = [];
      pendingStopRef.current = false;
      setIsRecording(false);
    }
  }, [isRecording]);

  return { isRecording, error, start, stop };
}

