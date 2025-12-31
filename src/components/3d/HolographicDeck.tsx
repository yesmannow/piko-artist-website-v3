"use client";

import React, { useRef, useState } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { useDrag } from "@use-gesture/react";
import * as THREE from "three";
import { HolographicMaterial } from "./materials/HolographicMaterial";

interface HolographicDeckProps {
  isPlaying?: boolean;
  audioLevel?: number; // 0.0 to 1.0
  color?: string;
}

export function HolographicDeck({
  isPlaying = false,
  audioLevel = 0,
  color = "#00ffff",
}: HolographicDeckProps) {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Spring physics for smooth rotation
  const [{ rotation }, api] = useSpring(() => ({
    rotation: [0, 0, 0],
    config: { mass: 1, tension: 170, friction: 26 }, // Heavy, vinyl-like feel
  }));

  // Gesture Control: One-finger drag to rotate
  const bind = useDrag(({ offset: [x, y], active }) => {
    setIsDragging(active);
    // Rotate Y axis based on horizontal drag
    api.start({ rotation: [0, x / 50, 0] });
  });

  // Animation Loop
  useFrame((state, delta) => {
    if (materialRef.current) {
      // 1. Animate Scanlines
      materialRef.current.uTime = state.clock.getElapsedTime();

      // 2. Audio Reactivity
      // Lerp current audio value for smoothness
      materialRef.current.uAudio = THREE.MathUtils.lerp(
        materialRef.current.uAudio,
        audioLevel,
        0.1
      );
    }

    // 3. Auto-spin if playing and not being touched
    if (isPlaying && !isDragging && meshRef.current) {
        meshRef.current.rotation.y += delta * 0.5; // Slow spin
    }
  });

  return (
    <animated.mesh
      {...(bind() as any)} // Bind gestures
      ref={meshRef}
      rotation={rotation as any}
      scale={1}
    >
      {/* Vinyl Shape: Radius Top, Radius Bottom, Height, Segments */}
      <cylinderGeometry args={[4, 4, 0.2, 64]} />

      {/* Custom Shader Material */}
      <holographicMaterial
        ref={materialRef}
        uColor={new THREE.Color(color)}
        uScanlineFreq={isPlaying ? 40.0 : 10.0} // Scanlines move faster when playing
        uFresnelPower={2.5}
        transparent={true}
        depthWrite={false} // Crucial for "hologram" look
        side={THREE.DoubleSide}
      />
    </animated.mesh>
  );
}

