"use client";

import { useCallback, useRef, useState } from "react";
import { useAudioEngine } from "@/hooks/audio/useAudioEngine";

/**
 * useSocialExport - skeleton hook for recording master output and preparing
 * media for social export (audio + future canvas merge via FFmpeg.wasm).
 */
export function useSocialExport() {
  const { getRecorderStream } = useAudioEngine();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const startRecording = useCallback(() => {
    if (isRecording) return;
    const stream = getRecorderStream();
    if (!stream) {
      console.warn("[useSocialExport] No recorder stream available");
      return;
    }
    try {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("[useSocialExport] Failed to start MediaRecorder:", err);
    }
  }, [getRecorderStream, isRecording]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return null;
    return new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setIsRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  // Placeholder for future FFmpeg.wasm pipeline to merge audio + canvas frames.
  const convertToSocialMP4 = useCallback(async (audio: Blob, _filename?: string) => {
    setIsProcessing(true);
    setProgress(0);
    try {
      // Placeholder: simply return an object URL for now
      setProgress(100);
      return URL.createObjectURL(audio);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    convertToSocialMP4,
    isProcessing,
    progress,
  };
}
