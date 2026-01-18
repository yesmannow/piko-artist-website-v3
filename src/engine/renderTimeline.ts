"use client";

import { TimelineSegment } from "@/store/useDeckMixerStore";
import { tracks as libraryTracks } from "@/lib/data";

export type TimelineRenderResult = {
  audioBuffer: AudioBuffer;
  duration: number;
};

type RenderOptions = {
  segments: TimelineSegment[];
  bpm?: number;
};

/**
 * Offline renderer that stitches timeline segments into a single AudioBuffer.
 * This is a minimal implementation that mixes source buffers at the right offsets
 * and applies simple fades to avoid clicks.
 */
export async function renderTimeline({
  segments,
  bpm = 120,
}: RenderOptions): Promise<TimelineRenderResult> {
  if (segments.length === 0) {
    throw new Error("Timeline is empty");
  }

  const sampleRate = 44100;
  const secondsPerBeat = 60 / bpm;

  const endBeat = segments.reduce(
    (max, seg) => Math.max(max, seg.endBeat ?? seg.startBeat + 16),
    0,
  );
  const totalDuration = endBeat * secondsPerBeat;

  const offlineContext = new OfflineAudioContext(2, totalDuration * sampleRate, sampleRate);

  for (const segment of segments) {
    const track = libraryTracks.find((t) => t.id === segment.trackId);
    if (!track) continue;

    // Fetch and decode audio
    const response = await fetch(track.src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const gain = offlineContext.createGain();
    const startTime = segment.startBeat * secondsPerBeat;
    const endTime =
      (segment.endBeat ?? segment.startBeat + Math.ceil(audioBuffer.duration / secondsPerBeat)) *
      secondsPerBeat;

    // Simple fade in/out to avoid clicks
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(1, startTime + 0.25);
    gain.gain.setValueAtTime(1, Math.max(startTime, endTime - 0.5));
    gain.gain.linearRampToValueAtTime(0.0001, endTime);

    source.connect(gain).connect(offlineContext.destination);
    source.start(startTime);
    source.stop(endTime);
  }

  const audioBuffer = await offlineContext.startRendering();
  return { audioBuffer, duration: totalDuration };
}
