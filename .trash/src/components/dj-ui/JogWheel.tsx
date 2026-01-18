"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import Image from "next/image";
import { JogWheel3D } from "./JogWheel3D";
import { DeskProps } from "./DeskProps";
import { Expand, Music } from "lucide-react";
import { OverlayShell } from "../ui/OverlayShell";
import { useHaptic } from "@/hooks/useHaptic";

interface JogWheelProps {
  rotation: number; // Rotation in degrees
  isPlaying: boolean;
  size?: number;
  onScrub?: (delta: number) => void; // Delta rotation for scrubbing
  onVelocityChange?: (velocity: number) => void; // Angular velocity for playbackRate control
  onDragStart?: () => void;
  onDragEnd?: () => void;
  bpm?: number; // Track BPM (default 120)
  playbackRate?: number; // Playback rate/pitch (default 1.0)
  coverArt?: string; // Cover art image URL for vinyl label
}

export function JogWheel({
  rotation,
  isPlaying,
  size = 200,
  onScrub,
  onVelocityChange,
  onDragStart,
  onDragEnd,
  bpm = 120,
  playbackRate = 1.0,
  coverArt,
}: JogWheelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragRotation, setDragRotation] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [previousCoverArt, setPreviousCoverArt] = useState<string | undefined>(
    coverArt,
  );
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const lastHapticTimeRef = useRef<number>(0);
  const { triggerHaptic, stopHaptic } = useHaptic();

  // Velocity-based scratch physics
  const angularVelocityRef = useRef<number>(0); // Current angular velocity (degrees per ms)
  const lastDeltaAngleRef = useRef<number>(0);
  const lastDeltaTimeRef = useRef<number>(0);
  const inertiaAnimationRef = useRef<number | null>(null);
  const FRICTION_COEFFICIENT = 0.95; // Per frame friction

  // Handle smooth cover art transitions
  useEffect(() => {
    if (coverArt !== previousCoverArt) {
      // Trigger transition animation
      setPreviousCoverArt(coverArt);
    }
  }, [coverArt, previousCoverArt]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onDragStart?.();
    e.preventDefault();

    if (wheelRef.current) {
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      lastAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!wheelRef.current || lastAngleRef.current === null) return;

      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Calculate delta angle
      let deltaAngle = currentAngle - lastAngleRef.current;

      // Handle wrap-around
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      // Update drag rotation
      setDragRotation((prev) => prev + deltaAngle);

      // Calculate angular velocity (degrees per millisecond)
      const now = Date.now();
      const timeDelta = now - lastDeltaTimeRef.current;

      if (timeDelta > 0) {
        // Angular velocity: degrees per millisecond
        const velocity = deltaAngle / timeDelta;
        angularVelocityRef.current = velocity;

        // Map velocity to playbackRate: fast forward = +2.0x, backward = -1.5x
        // Scale factor: 1 degree/ms ≈ 0.01x playback rate
        const playbackRateMultiplier = Math.max(
          -1.5,
          Math.min(2.0, velocity * 0.01),
        );
        const targetPlaybackRate = isPlaying
          ? 1.0 + playbackRateMultiplier
          : playbackRateMultiplier;

        // Notify parent component of velocity change
        if (onVelocityChange) {
          onVelocityChange(targetPlaybackRate);
        }

        // Haptic feedback based on velocity
        const absVelocity = Math.abs(velocity);
        triggerHaptic(undefined, absVelocity);
      }

      lastDeltaAngleRef.current = deltaAngle;
      lastDeltaTimeRef.current = now;
      lastHapticTimeRef.current = now;

      // Call scrub callback (for position-based seeking)
      if (onScrub) {
        onScrub(deltaAngle);
      }

      lastAngleRef.current = currentAngle;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!wheelRef.current || lastAngleRef.current === null) return;
      if (e.touches.length === 0) return;

      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const touch = e.touches[0];
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Calculate delta angle
      let deltaAngle = currentAngle - lastAngleRef.current;

      // Handle wrap-around
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      // Update drag rotation
      setDragRotation((prev) => prev + deltaAngle);

      // Calculate angular velocity (degrees per millisecond)
      const now = Date.now();
      const timeDelta = now - lastDeltaTimeRef.current;

      if (timeDelta > 0) {
        // Angular velocity: degrees per millisecond
        const velocity = deltaAngle / timeDelta;
        angularVelocityRef.current = velocity;

        // Map velocity to playbackRate: fast forward = +2.0x, backward = -1.5x
        // Scale factor: 1 degree/ms ≈ 0.01x playback rate
        const playbackRateMultiplier = Math.max(
          -1.5,
          Math.min(2.0, velocity * 0.01),
        );
        const targetPlaybackRate = isPlaying
          ? 1.0 + playbackRateMultiplier
          : playbackRateMultiplier;

        // Notify parent component of velocity change
        if (onVelocityChange) {
          onVelocityChange(targetPlaybackRate);
        }

        // Haptic feedback based on velocity
        const absVelocity = Math.abs(velocity);
        triggerHaptic(undefined, absVelocity);
      }

      lastDeltaAngleRef.current = deltaAngle;
      lastDeltaTimeRef.current = now;
      lastHapticTimeRef.current = now;

      // Call scrub callback (for position-based seeking)
      if (onScrub) {
        onScrub(deltaAngle);
      }

      lastAngleRef.current = currentAngle;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      lastAngleRef.current = null;
      stopHaptic(); // Stop continuous haptics

      // Apply inertia: spin down to 1.0x (or 0.0x if paused) naturally
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
      }

      const applyInertia = () => {
        const currentVelocity = angularVelocityRef.current;

        // Apply friction
        angularVelocityRef.current = currentVelocity * FRICTION_COEFFICIENT;

        // Map to playbackRate
        const playbackRateMultiplier = Math.max(
          -1.5,
          Math.min(2.0, angularVelocityRef.current * 0.01),
        );
        const targetPlaybackRate = isPlaying
          ? 1.0 + playbackRateMultiplier
          : Math.max(0, playbackRateMultiplier); // Don't go below 0 when paused

        if (onVelocityChange) {
          onVelocityChange(targetPlaybackRate);
        }

        // Continue until velocity is negligible
        if (Math.abs(angularVelocityRef.current) > 0.01) {
          inertiaAnimationRef.current = requestAnimationFrame(applyInertia);
        } else {
          // Snap to neutral playback rate
          if (onVelocityChange) {
            onVelocityChange(isPlaying ? 1.0 : 0.0);
          }
          angularVelocityRef.current = 0;
          inertiaAnimationRef.current = null;
        }
      };

      // Start inertia animation
      inertiaAnimationRef.current = requestAnimationFrame(applyInertia);

      onDragEnd?.();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);

      // Cleanup inertia animation
      if (inertiaAnimationRef.current) {
        cancelAnimationFrame(inertiaAnimationRef.current);
        inertiaAnimationRef.current = null;
      }
    };
  }, [isDragging, onScrub, onDragEnd, isPlaying, onVelocityChange, stopHaptic]);

  // Calculate display rotation: use drag rotation when dragging, otherwise use rotation prop
  const displayRotation = isDragging ? dragRotation : isPlaying ? rotation : 0;

  return (
    <div
      ref={wheelRef}
      className="relative cursor-grab active:cursor-grabbing select-none touch-none z-0"
      style={{ width: size, height: size, touchAction: "none" }}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        setIsDragging(true);
        onDragStart?.();
        e.preventDefault();
        if (wheelRef.current) {
          const rect = wheelRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const touch = e.touches[0];
          const dx = touch.clientX - centerX;
          const dy = touch.clientY - centerY;
          lastAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
        }
      }}
    >
      {/* Rotating Outer Ring - Visual Feedback */}
      <motion.svg
        className="absolute inset-0 pointer-events-none z-5"
        viewBox="0 0 100 100"
        style={{ width: size, height: size }}
        animate={{
          rotate: isPlaying && !isDragging ? [0, 360] : 0,
        }}
        transition={{
          duration: isPlaying && !isDragging ? 60 / (bpm * playbackRate) : 0,
          repeat: isPlaying && !isDragging ? Infinity : 0,
          ease: "linear",
        }}
      >
        {/* Outer ring with tick marks */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="0.5"
        />
        {/* BPM indicator marks */}
        {Array.from({ length: 4 }).map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="2"
            x2="50"
            y2="6"
            stroke="rgba(0, 255, 100, 0.6)"
            strokeWidth="1"
            transform={`rotate(${i * 90} 50 50)`}
          />
        ))}
        {/* Secondary marks */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`sec-${i}`}
            x1="50"
            y1="2"
            x2="50"
            y2="4"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="0.5"
            transform={`rotate(${i * 45 + 22.5} 50 50)`}
          />
        ))}
      </motion.svg>

      {/* Vinyl Label Overlay with Smooth Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={coverArt || "default"}
          initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: displayRotation }}
          exit={{ opacity: 0, scale: 0.8, rotate: 180 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden border-2 border-zinc-900 z-10 pointer-events-none"
          style={{
            width: "35%",
            height: "35%",
          }}
        >
          {coverArt ? (
            <Image
              src={coverArt}
              alt="Vinyl Label"
              fill
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-[#111] flex items-center justify-center">
              <Music className="w-1/3 h-1/3 text-zinc-500" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Interactive Vinyl Artwork Button */}
      {coverArt && (
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center z-20 hover:bg-black/80 transition-colors touch-manipulation"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Expand vinyl artwork"
          title="Click to view full artwork"
        >
          <Expand className="w-4 h-4 text-white" />
        </motion.button>
      )}

      {/* Expanded Vinyl Artwork Modal */}
      {coverArt && (
        <OverlayShell
          open={isExpanded}
          onClose={() => setIsExpanded(false)}
          z="modal"
          backdropClassName="backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative max-w-[min(92vw,500px)] w-full aspect-square rounded-full overflow-hidden border-4 border-white/20 shadow-2xl"
          >
            <Image
              src={coverArt}
              alt="Album Artwork"
              fill
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30" />
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] min-w-[44px]"
              aria-label="Close artwork"
            >
              <span className="text-white text-xl">×</span>
            </button>
          </motion.div>
        </OverlayShell>
      )}

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          touchAction: "none",
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={0.5}
        />
        <Suspense fallback={null}>
          <JogWheel3D
            isPlaying={isPlaying && !isDragging}
            isScratching={isDragging}
            rotation={displayRotation}
            bpm={bpm}
            playbackRate={playbackRate}
          />
          <DeskProps />
        </Suspense>
      </Canvas>

      {/* Play indicator overlay */}
      {isPlaying && !isDragging && (
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500 animate-pulse pointer-events-none z-20" />
      )}

      {/* Drag indicator overlay */}
      {isDragging && (
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 pointer-events-none z-20" />
      )}
    </div>
  );
}
