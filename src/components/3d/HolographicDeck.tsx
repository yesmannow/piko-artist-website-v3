"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { useDrag } from "@use-gesture/react";
import * as THREE from "three";
import { HolographicMaterial } from "./materials/HolographicMaterial";

// Ensure HolographicMaterial is registered in R3F namespace
// This must be called before JSX usage
extend({ HolographicMaterial });

interface HolographicDeckProps {
  isPlaying?: boolean;
  audioLevel?: number; // 0.0 to 1.0
  color?: string;
  impactPulse?: boolean; // For session launch impact effect
}

export function HolographicDeck({
  isPlaying = false,
  audioLevel = 0,
  color = "#E0E0E0", // Industrial Chrome default
  impactPulse = false,
}: HolographicDeckProps) {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [impactFlash, setImpactFlash] = useState(0.0);

  // Spring physics for smooth rotation
  const [{ rotation }, api] = useSpring(() => ({
    rotation: [0, 0, 0],
    config: { mass: 1, tension: 170, friction: 26 }, // Heavy, vinyl-like feel
  }));

  // Gesture Control: One-finger drag to rotate
  const bind = useDrag(({ offset: [x], active }) => {
    setIsDragging(active);
    // Rotate Y axis based on horizontal drag
    api.start({ rotation: [0, x / 50, 0] });
  });

  // Handle impact pulse effect - Blinding Silver/White Flash
  useEffect(() => {
    if (impactPulse) {
      // Scale up to 1.1
      setScale(1.1);
      // Trigger blinding flash
      setImpactFlash(1.0);
      // Flash fades out over 200ms
      setTimeout(() => {
        setImpactFlash(0.0);
      }, 200);
      // Scale returns to normal
      setTimeout(() => {
        setScale(1.0);
      }, 300);
    }
  }, [impactPulse]);

  // Animation Loop
  useFrame((state, delta) => {
    if (materialRef.current) {
      // 1. Animate Chrome texture
      materialRef.current.uTime = state.clock.getElapsedTime();

      // 2. Audio Reactivity
      materialRef.current.uAudio = THREE.MathUtils.lerp(
        materialRef.current.uAudio,
        audioLevel,
        0.1
      );

      // 3. Impact Flash (fade out smoothly)
      materialRef.current.uImpactFlash = THREE.MathUtils.lerp(
        materialRef.current.uImpactFlash,
        impactFlash,
        0.15
      );
    }

    // 3. Auto-spin if playing and not being touched
    if (isPlaying && !isDragging && meshRef.current) {
        meshRef.current.rotation.y += delta * 0.5; // Slow spin
    }

    // 4. Apply impact pulse scale
    if (meshRef.current) {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.2);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, scale, 0.2);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, scale, 0.2);
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
      {/* @ts-expect-error - holographicMaterial is extended via extend() but TypeScript doesn't recognize it */}
      <holographicMaterial
        ref={materialRef}
        uColor={new THREE.Color(color)}
        uBrushedMetalFreq={isPlaying ? 150.0 : 100.0} // Higher frequency for sharper chrome grooves
        uFresnelPower={3.0} // Higher power for intense edge reflections
        uImpactFlash={impactFlash}
        transparent={false} // Chrome is opaque
        depthWrite={true}
        side={THREE.DoubleSide}
        metalness={0.9} // High metalness for chrome
        roughness={0.1} // Low roughness for high polish
      />
    </animated.mesh>
  );
}

