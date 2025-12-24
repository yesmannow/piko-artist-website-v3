"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { JogWheel3D } from "./JogWheel3D";
import { DeskProps } from "./DeskProps";
import { Expand, Music } from "lucide-react";
import { OverlayShell } from "../ui/OverlayShell";

interface JogWheelProps {
  rotation: number; // Rotation in degrees
  isPlaying: boolean;
  size?: number;
  onScrub?: (delta: number) => void; // Delta rotation for scrubbing
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
  onDragStart,
  onDragEnd,
  bpm = 120,
  playbackRate = 1.0,
  coverArt,
}: JogWheelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragRotation, setDragRotation] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [previousCoverArt, setPreviousCoverArt] = useState<string | undefined>(coverArt);
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);

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

      // Call scrub callback
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

      // Call scrub callback
      if (onScrub) {
        onScrub(deltaAngle);
      }

      lastAngleRef.current = currentAngle;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragRotation(0);
      lastAngleRef.current = null;
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
    };
  }, [isDragging, onScrub, onDragEnd]);

  // Calculate display rotation: use drag rotation when dragging, otherwise use rotation prop
  const displayRotation = isDragging ? dragRotation : (isPlaying ? rotation : 0);

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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverArt}
              alt="Vinyl Label"
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverArt}
              alt="Album Artwork"
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
        style={{ width: "100%", height: "100%", pointerEvents: "none", touchAction: "none" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} />
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

