"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { JogWheel3D } from "./JogWheel3D";
import { DeskProps } from "./DeskProps";

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
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);

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
      {/* Vinyl Label Overlay */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden border-2 border-zinc-900 z-10 pointer-events-none"
        style={{
          width: "35%",
          height: "35%",
          transform: `translate(-50%, -50%) rotate(${displayRotation}deg)`,
        }}
      >
        {coverArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverArt} alt="Label" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#111] flex items-center justify-center">
            <span className="text-[6px] text-zinc-500 font-bold tracking-widest">PIKO</span>
          </div>
        )}
      </div>

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

