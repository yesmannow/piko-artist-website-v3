"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, Download } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

interface SessionRecorderProps {
  canvasSelector?: string; // CSS selector for the canvas element (e.g., "canvas" or ".studio-canvas")
  audioContext?: AudioContext | null;
  audioDestination?: AudioNode | null;
}

const MAX_RECORDING_DURATION = 30; // 30 seconds for social sharing

/**
 * SessionRecorder - "Drop Cam" for recording Studio sessions
 *
 * Captures canvas video + audio output and combines them into a WebM file.
 * Features:
 * - 30-second auto-stop limit (optimal for social sharing)
 * - Real-time recording timer
 * - Automatic download on stop
 * - Toxic-lime design system compliance
 */
export function SessionRecorder({
  canvasSelector = "canvas",
  audioContext,
  audioDestination,
}: SessionRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const { triggerHaptic } = useHaptic();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!audioContext || !audioDestination) {
      console.error("[SessionRecorder] Missing audio context or destination");
      return;
    }

    // Find canvas element (works with React Three Fiber Canvas)
    const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
    if (!canvas) {
      console.error(
        "[SessionRecorder] Canvas element not found:",
        canvasSelector,
      );
      return;
    }

    try {
      // 1. Capture canvas video stream
      const videoStream = canvas.captureStream(30); // 30 FPS

      // 2. Capture audio stream from audio destination
      // If audioDestination is provided, use it; otherwise create a MediaStreamDestination
      let audioStream: MediaStream;
      if (audioDestination) {
        const audioDestinationNode =
          audioContext.createMediaStreamDestination();
        audioDestination.connect(audioDestinationNode);
        audioStreamRef.current = audioDestinationNode;
        audioStream = audioDestinationNode.stream;
      } else {
        // Fallback: try to get audio from the default audio context destination
        // This is a workaround if audioDestination is not provided
        const audioDestinationNode =
          audioContext.createMediaStreamDestination();
        audioStreamRef.current = audioDestinationNode;
        audioStream = audioDestinationNode.stream;
        console.warn(
          "[SessionRecorder] audioDestination not provided, using fallback",
        );
      }

      // 3. Combine video + audio
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      // 4. Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/webm;codecs=vp8";

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          // Create blob from chunks
          const blob = new Blob(chunksRef.current, { type: mimeType });

          // Generate filename with timestamp
          const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, -5);
          const filename = `Piko_Studio_Session_${timestamp}.webm`;

          // Download file
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Show success feedback
          triggerHaptic();
        } catch (error) {
          console.error(
            "[SessionRecorder] Failed to process recording:",
            error,
          );
        } finally {
          setIsProcessing(false);
          chunksRef.current = [];
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      setIsRecording(true);
      setRecordingTime(0);
      triggerHaptic();

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 0.1;
          // Auto-stop at 30 seconds
          if (newTime >= MAX_RECORDING_DURATION) {
            stopRecording();
            return MAX_RECORDING_DURATION;
          }
          return newTime;
        });
      }, 100);
    } catch (error) {
      console.error("[SessionRecorder] Failed to start recording:", error);
      setIsRecording(false);
    }
  }, [canvasSelector, audioContext, audioDestination, triggerHaptic]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
        audioStreamRef.current.disconnect();
        audioStreamRef.current = null;
      }

      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-4 py-2 font-bold uppercase text-xs tracking-wider transition-all touch-manipulation ${
          isRecording
            ? "bg-red-500 text-white border-2 border-red-600"
            : "bg-zinc-800 text-zinc-300 border-2 border-zinc-700 hover:border-toxic-lime hover:text-toxic-lime"
        }`}
        style={{ borderRadius: 0 }}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <motion.div
          animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
        >
          <Circle className={isRecording ? "fill-current" : ""} size={16} />
        </motion.div>
        <span>REC</span>
        {isRecording && (
          <span className="text-xs font-mono">
            {formatTime(recordingTime)}/{MAX_RECORDING_DURATION}s
          </span>
        )}
      </button>

      {/* Success Toast */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-2 border-toxic-lime text-toxic-lime text-xs font-bold uppercase"
            style={{ borderRadius: 0 }}
          >
            <Download size={14} />
            <span>EXPORTING...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
