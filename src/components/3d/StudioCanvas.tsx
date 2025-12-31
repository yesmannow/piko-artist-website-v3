"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GlitchController } from "./GlitchController";
import { useSpring, animated } from "@react-spring/three";
import { HolographicDeck } from "./HolographicDeck";
import { useOrientation } from "@/hooks/useOrientation";
import { useSceneCleanup } from "@/hooks/useSceneCleanup";

interface StudioCanvasProps {
  deckAIsPlaying?: boolean;
  deckAAudioLevel?: number;
  deckBIsPlaying?: boolean;
  deckBAudioLevel?: number;
  deckAColor?: string;
  deckBColor?: string;
  getFrequencyData?: () => Uint8Array | null;
  playbackRate?: number; // For tape stop effect
}

/**
 * Internal component that uses useThree hook (must be inside Canvas)
 */
function SceneContent({
  deckAIsPlaying,
  deckAAudioLevel,
  deckBIsPlaying,
  deckBAudioLevel,
  deckAColor,
  deckBColor,
  getFrequencyData,
  isLandscape,
}: Omit<StudioCanvasProps, "playbackRate"> & { isLandscape: boolean }) {
  const { scene } = useThree();
  const sceneRef = useRef(scene);

  // Update scene ref when scene changes
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  // Attach memory cleanup hook
  useSceneCleanup(sceneRef);

  // Spring animation for smooth position transitions
  const deckAPosition = useSpring({
    position: isLandscape ? [-6, 0, 0] : [0, 4, 0],
    config: { mass: 1, tension: 120, friction: 26 },
  });

  const deckBPosition = useSpring({
    position: isLandscape ? [6, 0, 0] : [0, -4, 0],
    config: { mass: 1, tension: 120, friction: 26 },
  });

  return (
    <>
      {/* Lighting Setup */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#ff0099" />

      {/* Camera Controls - Rotation only, no zoom/pan */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
      />

      {/* Deck A - Left/Top */}
      <animated.group position={deckAPosition.position as any}>
        <HolographicDeck
          isPlaying={deckAIsPlaying}
          audioLevel={deckAAudioLevel}
          color={deckAColor}
        />
      </animated.group>

      {/* Deck B - Right/Bottom */}
      <animated.group position={deckBPosition.position as any}>
        <HolographicDeck
          isPlaying={deckBIsPlaying}
          audioLevel={deckBAudioLevel}
          color={deckBColor}
        />
      </animated.group>

      {/* Post-Processing Effects */}
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.9} />
        {getFrequencyData && (
          <GlitchController getFrequencyData={getFrequencyData} />
        )}
      </EffectComposer>
    </>
  );
}

/**
 * StudioCanvas - Responsive 3D canvas container for DJ mixer decks
 *
 * Features:
 * - DPR capping (max 2x) to prevent mobile overheating
 * - Responsive layout: side-by-side (landscape) vs vertical stack (portrait)
 * - Smooth position transitions when orientation changes
 * - Touch-action: none to prevent scroll-jacking
 * - Optimized lighting for holographic materials
 * - Automatic memory cleanup on unmount
 */
export function StudioCanvas({
  deckAIsPlaying = false,
  deckAAudioLevel = 0,
  deckBIsPlaying = false,
  deckBAudioLevel = 0,
  deckAColor = "#00ffff", // Cyan default
  deckBColor = "#ff0099", // Magenta default
  getFrequencyData,
  playbackRate = 1.0,
}: StudioCanvasProps) {
  const isLandscape = useOrientation();

  // Spring animation for smooth position transitions
  // Landscape: side-by-side, Portrait: vertical stack
  const deckAPosition = useSpring({
    position: isLandscape ? [-6, 0, 0] : [0, 4, 0],
    config: { mass: 1, tension: 120, friction: 26 },
  });

  const deckBPosition = useSpring({
    position: isLandscape ? [6, 0, 0] : [0, -4, 0],
    config: { mass: 1, tension: 120, friction: 26 },
  });

  return (
    <div className="absolute inset-0 z-0" style={{ touchAction: "none" }}>
      <Canvas
        dpr={[1, 2]} // CRITICAL: Cap DPR at 2x to prevent mobile overheating
        camera={{ position: [0, 0, 12], fov: 50 }}
        className="touch-none"
        style={{ touchAction: "none" }}
      >
        <SceneContent
          deckAIsPlaying={deckAIsPlaying}
          deckAAudioLevel={deckAAudioLevel}
          deckBIsPlaying={deckBIsPlaying}
          deckBAudioLevel={deckBAudioLevel}
          deckAColor={deckAColor}
          deckBColor={deckBColor}
          getFrequencyData={getFrequencyData}
          isLandscape={isLandscape}
        />
      </Canvas>
    </div>
  );
}

