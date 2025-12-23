"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Headphones } from "lucide-react";

interface RemixDeckProps {
  trackName: string;
  audioUrl: string;
  isMuted: boolean;
  isSolo: boolean;
  hasSolo: boolean; // Whether any track is soloed
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  isPlaying: boolean;
  playbackRate: number;
  audioContext?: AudioContext;
  filterNode?: BiquadFilterNode;
  masterGain?: GainNode;
}

export interface RemixDeckRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export const RemixDeck = forwardRef<RemixDeckRef, RemixDeckProps>(
  (
    {
      trackName,
      audioUrl,
      isMuted,
      isSolo,
      hasSolo,
      onMuteToggle,
      onSoloToggle,
      isPlaying,
      playbackRate,
      audioContext,
      filterNode,
      masterGain,
    },
    ref
  ) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Initialize WaveSurfer
    useEffect(() => {
      if (!waveformRef.current) return;

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#555",
        progressColor: "#ccff00", // Toxic Lime
        cursorColor: "#ccff00",
        barWidth: 2,
        barRadius: 1,
        responsive: true,
        height: 60, // Reduced height for mobile
        normalize: true,
        backend: "MediaElement",
        mediaControls: false,
        minPxPerSec: 10, // Allow horizontal scrolling on mobile
      });

      wavesurferRef.current = ws;

      // Load audio
      ws.load(audioUrl);

      // Set up Web Audio connection when ready
      ws.on("ready", () => {
        if (!audioContext || !filterNode || !masterGain) return;

        try {
          const mediaElement = ws.getMediaElement();
          if (!mediaElement) return;

          // Create MediaElementAudioSourceNode
          const mediaSource = audioContext.createMediaElementSource(mediaElement);
          mediaSourceRef.current = mediaSource;

          // Create gain node for volume/mute/solo control
          const gainNode = audioContext.createGain();
          // Solo logic: if any track is soloed, only soloed tracks play (unless muted)
          const shouldPlay = hasSolo ? (isSolo && !isMuted) : !isMuted;
          gainNode.gain.value = shouldPlay ? 1.0 : 0;
          gainNodeRef.current = gainNode;

          // Connect: MediaElement -> Gain -> Filter -> Master -> Destination
          mediaSource.connect(gainNode);
          gainNode.connect(filterNode);
        } catch (error) {
          // Media element may already be connected, ignore
          console.warn("Could not connect media element to Web Audio:", error);
        }
      });

      return () => {
        if (mediaSourceRef.current) {
          try {
            mediaSourceRef.current.disconnect();
          } catch {
            // Ignore disconnect errors
          }
        }
        ws.destroy();
      };
    }, [audioUrl, audioContext, filterNode, masterGain, isMuted, isSolo, hasSolo]);

    // Update playback rate
    useEffect(() => {
      if (wavesurferRef.current) {
        wavesurferRef.current.setPlaybackRate(playbackRate);
      }
    }, [playbackRate]);

    // Update mute/solo state
    useEffect(() => {
      if (gainNodeRef.current) {
        // Solo logic: if any track is soloed, only soloed tracks play (unless muted)
        const shouldPlay = hasSolo ? (isSolo && !isMuted) : !isMuted;
        gainNodeRef.current.gain.value = shouldPlay ? 1.0 : 0;
      }
    }, [isMuted, isSolo, hasSolo]);

    // Expose control methods via ref
    useImperativeHandle(ref, () => ({
      play: () => {
        wavesurferRef.current?.play();
      },
      pause: () => {
        wavesurferRef.current?.pause();
      },
      stop: () => {
        wavesurferRef.current?.stop();
      },
      seek: (time: number) => {
        const duration = wavesurferRef.current?.getDuration();
        if (duration) {
          wavesurferRef.current?.seekTo(time / duration);
        }
      },
      getCurrentTime: () => {
        return wavesurferRef.current?.getCurrentTime() || 0;
      },
      getDuration: () => {
        return wavesurferRef.current?.getDuration() || 0;
      },
    }));

    // Sync playback state
    useEffect(() => {
      if (!wavesurferRef.current) return;

      if (isPlaying) {
        wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }, [isPlaying]);

    return (
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#1a1a1a] border border-white/10 rounded-lg">
        {/* Top (Mobile) / Left (Desktop): Track Name and Controls */}
        <div className="flex flex-row md:flex-col items-center md:items-center justify-between md:justify-start gap-3 md:gap-2 min-w-0 md:min-w-[120px]">
          <div className="font-industrial font-bold uppercase tracking-wider text-sm md:text-sm text-white truncate md:whitespace-normal">
            {trackName}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {/* Mute Button */}
            <motion.button
              type="button"
              onClick={onMuteToggle}
              className={`w-11 h-11 md:w-10 md:h-10 rounded border-2 border-black flex items-center justify-center transition-all min-h-[44px] ${
                isMuted
                  ? "bg-red-500 text-white"
                  : "bg-[#2a2a2a] text-white/60 hover:text-white"
              }`}
              style={{
                boxShadow: isMuted ? "2px 2px 0px 0px rgba(0,0,0,1)" : "none",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </motion.button>

            {/* Solo Button */}
            <motion.button
              type="button"
              onClick={onSoloToggle}
              className={`w-11 h-11 md:w-10 md:h-10 rounded border-2 border-black flex items-center justify-center transition-all min-h-[44px] ${
                isSolo
                  ? "bg-[#ccff00] text-black"
                  : "bg-[#2a2a2a] text-white/60 hover:text-white"
              }`}
              style={{
                boxShadow: isSolo ? "2px 2px 0px 0px rgba(0,0,0,1)" : "none",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Headphones className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Bottom (Mobile) / Right (Desktop): Waveform Container */}
        <div className="flex-1 min-w-0 overflow-x-auto md:overflow-visible" ref={waveformRef} />
      </div>
    );
  }
);

RemixDeck.displayName = "RemixDeck";

