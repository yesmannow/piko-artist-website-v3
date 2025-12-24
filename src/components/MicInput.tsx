"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface MicInputProps {
  audioContext?: AudioContext;
  masterGainNode?: GainNode;
}

type MicState = "disabled" | "enabled" | "permission-denied" | "error";

export function MicInput({ audioContext, masterGainNode }: MicInputProps) {
  const [micState, setMicState] = useState<MicState>("disabled");
  const [inputLevel, setInputLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const micGainRef = useRef<GainNode | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }

    if (micGainRef.current) {
      micGainRef.current.disconnect();
      micGainRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Enable microphone
  const enableMic = useCallback(async () => {
    if (!audioContext || !masterGainNode) {
      setError("Audio context not available");
      setMicState("error");
      return;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio nodes
      const micSource = audioContext.createMediaStreamSource(stream);
      micSourceRef.current = micSource;

      // Create analyser for level metering
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create gain node for mic volume control (monitor only, low volume)
      const micGain = audioContext.createGain();
      micGain.gain.value = 0.3; // Low volume for monitoring
      micGainRef.current = micGain;

      // Connect: micSource -> analyser (for metering)
      micSource.connect(analyser);
      // Connect: micSource -> micGain -> masterGain (for monitoring)
      micSource.connect(micGain);
      micGain.connect(masterGainNode);

      setMicState("enabled");
      setError(null);

      // Start level metering
      const updateLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS (Root Mean Square) for level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(rms * 2, 1); // Scale and clamp to 0-1

        setInputLevel(level);

        if (micState === "enabled") {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();
    } catch (err) {
      cleanup();
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setMicState("permission-denied");
          setError("Microphone permission denied");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setMicState("error");
          setError("No microphone found");
        } else {
          setMicState("error");
          setError(err.message || "Failed to enable microphone");
        }
      } else {
        setMicState("error");
        setError("Unknown error occurred");
      }
    }
  }, [audioContext, masterGainNode, micState, cleanup]);

  // Disable microphone
  const disableMic = useCallback(() => {
    cleanup();
    setMicState("disabled");
    setInputLevel(0);
    setError(null);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Calculate level bar percentage
  const levelPercentage = Math.min(inputLevel * 100, 100);
  const isPeaking = inputLevel > 0.95;

  return (
    <div className="p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-base md:text-lg font-barlow uppercase tracking-wider text-gray-300 mb-2">
          MIC INPUT
        </h3>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Enable/Disable Button */}
        {micState === "disabled" ? (
          <button
            onClick={enableMic}
            disabled={!audioContext || !masterGainNode}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-barlow uppercase text-sm rounded border-2 border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
            aria-label="Enable microphone"
            title="Enable microphone for monitoring"
          >
            <Mic className="w-5 h-5" />
            ENABLE MIC
          </button>
        ) : micState === "enabled" ? (
          <button
            onClick={disableMic}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-barlow uppercase text-sm rounded border-2 border-red-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 touch-manipulation"
            aria-label="Disable microphone"
            title="Disable microphone"
          >
            <MicOff className="w-5 h-5" />
            DISABLE MIC
          </button>
        ) : null}

        {/* Status Indicator */}
        {micState === "enabled" && (
          <div className="flex items-center gap-2 text-xs text-green-500 font-barlow">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ACTIVE
          </div>
        )}

        {micState === "permission-denied" && (
          <div className="flex items-center gap-2 text-xs text-red-500 font-barlow">
            <AlertCircle className="w-4 h-4" />
            PERMISSION DENIED
          </div>
        )}

        {/* Input Level Meter */}
        {micState === "enabled" && (
          <div className="w-full max-w-xs">
            <div className="text-xs font-barlow uppercase text-gray-400 mb-2 text-center tracking-wider">
              INPUT LEVEL
            </div>
            <div className="bg-[#1a1a1a] rounded border border-gray-800/50 p-3">
              <div className="relative h-8 bg-[#0a0a0a] rounded border border-gray-700 overflow-hidden">
                {/* Level bar */}
                <div
                  className={`absolute bottom-0 left-0 h-full transition-all duration-75 ${
                    isPeaking
                      ? "bg-red-500"
                      : levelPercentage > 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${levelPercentage}%`,
                    boxShadow: isPeaking ? "0 0 10px rgba(239, 68, 68, 0.8)" : "none",
                  }}
                />
                {/* Peak indicator */}
                {isPeaking && (
                  <div className="absolute inset-0 bg-red-500/30 animate-pulse" />
                )}
              </div>
              <div className="text-[10px] font-barlow text-gray-500 text-center mt-1">
                {levelPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-500 font-barlow text-center max-w-xs">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

