import { useState, useEffect, useRef } from "react";
import {
  detectBPM,
  estimateBPMFromMetadata,
  type BPMResult,
} from "@/utils/bpmDetection";

interface UseBPMDetectionOptions {
  audioBuffer?: AudioBuffer | null;
  trackTitle?: string;
  trackArtist?: string;
  enabled?: boolean;
}

export function useBPMDetection({
  audioBuffer,
  trackTitle = "",
  trackArtist = "",
  enabled = true,
}: UseBPMDetectionOptions) {
  const [bpm, setBpm] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) {
      setBpm(null);
      setConfidence(0);
      return;
    }

    // Cancel any ongoing detection
    if (detectionAbortRef.current) {
      detectionAbortRef.current.abort();
    }

    const abortController = new AbortController();
    detectionAbortRef.current = abortController;

    const detect = async () => {
      setIsDetecting(true);

      try {
        // First, try metadata extraction (fast, no processing)
        const metadataBPM = estimateBPMFromMetadata(trackTitle, trackArtist);
        if (metadataBPM) {
          if (!abortController.signal.aborted) {
            setBpm(metadataBPM);
            setConfidence(0.7); // Medium confidence for metadata
            setIsDetecting(false);
          }
          return;
        }

        // Then try audio analysis if buffer is available
        if (audioBuffer && audioBuffer.length > 0) {
          const result: BPMResult = await detectBPM(audioBuffer);
          if (!abortController.signal.aborted) {
            setBpm(result.bpm);
            setConfidence(result.confidence);
          }
        } else {
          // Fallback to default
          if (!abortController.signal.aborted) {
            setBpm(120);
            setConfidence(0.3);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.warn("BPM detection error:", error);
          setBpm(120);
          setConfidence(0.3);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsDetecting(false);
        }
      }
    };

    detect();

    return () => {
      abortController.abort();
    };
  }, [audioBuffer, trackTitle, trackArtist, enabled]);

  return {
    bpm,
    confidence,
    isDetecting,
  };
}
