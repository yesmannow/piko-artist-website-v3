"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GlitchController, BrightnessFilter } from "./GlitchController";
import { useSpring, animated } from "@react-spring/three";
import { HolographicDeck } from "./HolographicDeck";
import { useOrientation } from "@/hooks/useOrientation";
import { useSceneCleanup } from "@/hooks/useSceneCleanup";
import { useGyroLighting } from "@/hooks/useGyroLighting";
import * as THREE from "three";

interface StudioCanvasProps {
  deckAIsPlaying?: boolean;
  deckAAudioLevel?: number;
  deckBIsPlaying?: boolean;
  deckBAudioLevel?: number;
  deckAColor?: string;
  deckBColor?: string;
  getFrequencyData?: () => Uint8Array | null;
  playbackRate?: number; // For tape stop effect
  impactPulse?: boolean; // For session launch impact effect
  remixIntensity?: number; // 0-1, environmental reactivity trigger
  visualizerLevel?: number; // 0-1, bass intensity for reactive camera shake
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
  impactPulse,
  remixIntensity = 0,
  visualizerLevel = 0,
  gyroOrientation,
}: Omit<StudioCanvasProps, "playbackRate"> & {
  isLandscape: boolean;
  impactPulse?: boolean;
  remixIntensity?: number;
  visualizerLevel?: number;
  gyroOrientation?: { x: number; y: number };
}) {
  const { scene, camera } = useThree();
  const sceneRef = useRef(scene);
  const baseCameraYRef = useRef(camera.position.y);
  const pointLight1Ref = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null);

  // Update scene ref when scene changes
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  // Attach memory cleanup hook
  useSceneCleanup(sceneRef);

  // Reactive Camera Shake - Simulates speaker vibration when bass intensity > 0.7
  useFrame(() => {
    if (visualizerLevel > 0.7) {
      // Subtle vertical shake based on bass intensity
      const shakeIntensity = (visualizerLevel - 0.7) * 0.3; // Max 0.09 units of shake
      const shake = (Math.random() - 0.5) * shakeIntensity;
      camera.position.y = baseCameraYRef.current + shake;
    } else {
      // Smooth return to base position
      camera.position.y = baseCameraYRef.current;
    }
  });

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
      {/* Industrial Lighting Setup - Harsh Top-Down Lighting */}
      <ambientLight intensity={0.3} />
      {/* Harsh top-down light (emphasizes metallic edges) */}
      <directionalLight position={[0, 10, 5]} intensity={1.5} color="#E0E0E0" castShadow />
      {/* Fill light from sides - Gyro-controlled on mobile */}
      <pointLight
        ref={pointLight1Ref}
        position={[
          gyroOrientation ? gyroOrientation.x * 10 : 10,
          5,
          gyroOrientation ? gyroOrientation.y * 10 + 10 : 10
        ]}
        intensity={0.8}
        color="#E0E0E0"
      />
      <pointLight
        ref={pointLight2Ref}
        position={[
          gyroOrientation ? -gyroOrientation.x * 10 : -10,
          5,
          gyroOrientation ? -gyroOrientation.y * 10 + 10 : 10
        ]}
        intensity={0.8}
        color="#E0E0E0"
      />

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
          impactPulse={impactPulse}
        />
      </animated.group>

      {/* Deck B - Right/Bottom */}
      <animated.group position={deckBPosition.position as any}>
        <HolographicDeck
          isPlaying={deckBIsPlaying}
          audioLevel={deckBAudioLevel}
          color={deckBColor}
          impactPulse={impactPulse}
        />
      </animated.group>

      {/* Post-Processing Effects */}
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.9} />
        {getFrequencyData ? (
          <GlitchController
            getFrequencyData={getFrequencyData}
            impactPulse={impactPulse}
            remixIntensity={remixIntensity}
          />
        ) : (
          <></>
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
  impactPulse = false,
  remixIntensity = 0,
  visualizerLevel = 0,
}: StudioCanvasProps) {
  const isLandscape = useOrientation();
  // Gyro-lighting with intensity multiplier (2.0 = more responsive)
  const { x: gyroX, y: gyroY } = useGyroLighting(2.0);

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

  // Battery saver: only render when needed
  const shouldRender = deckAIsPlaying || deckBIsPlaying || visualizerLevel > 0;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="absolute inset-0 z-0 relative" style={{ touchAction: "none" }}>
      <Canvas
        dpr={[1, 2]} // CRITICAL: Cap DPR at 2x to prevent mobile overheating
        camera={{ position: [0, 0, 12], fov: 50 }}
        className="touch-none"
        style={{ touchAction: "none" }}
        frameloop={isMobile && !shouldRender ? "demand" : "always"}
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
          impactPulse={impactPulse}
          remixIntensity={remixIntensity}
          visualizerLevel={visualizerLevel}
          gyroOrientation={{ x: gyroX, y: gyroY }}
        />
      </Canvas>
      {/* Brightness filter for environmental reactivity */}
      <BrightnessFilter intensity={remixIntensity} />
    </div>
  );
}

