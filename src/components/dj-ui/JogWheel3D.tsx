"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface JogWheel3DProps {
  isPlaying: boolean;
  isScratching?: boolean;
  rotation?: number; // External rotation value in degrees (for scrubbing)
  bpm?: number; // Track BPM (default 120)
  playbackRate?: number; // Playback rate/pitch (default 1.0)
}

export function JogWheel3D({
  isPlaying,
  isScratching = false,
  rotation = 0,
  bpm = 120,
  playbackRate = 1.0
}: JogWheel3DProps) {
  const { scene } = useGLTF("/3d/music-20.glb");
  const meshRef = useRef<THREE.Group>(null);
  const baseRotationRef = useRef(0);
  const lastRotationPropRef = useRef(0);

  // Update rotation when prop changes (for scrubbing or external control)
  useEffect(() => {
    if (meshRef.current) {
      const rotationRad = (rotation * Math.PI) / 180;
      if (isScratching) {
        // When scratching, directly set rotation from prop
        meshRef.current.rotation.y = rotationRad;
        baseRotationRef.current = rotationRad;
      } else {
        // When not scratching, update base rotation if prop changed significantly
        // This handles the case when rotation prop is updated externally
        const diff = Math.abs(rotation - lastRotationPropRef.current);
        if (diff > 1) { // Only update if significant change
          baseRotationRef.current = rotationRad;
          meshRef.current.rotation.y = rotationRad;
        }
      }
      lastRotationPropRef.current = rotation;
    }
  }, [rotation, isScratching]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isScratching) {
      // When scratching, rotation is controlled by external prop (handled in useEffect)
      // Just ensure it stays in sync
      const rotationRad = (rotation * Math.PI) / 180;
      meshRef.current.rotation.y = rotationRad;
    } else if (isPlaying) {
      // Auto-rotate when playing - sync to BPM and pitch
      // rotationSpeed = (bpm / 60) * playbackRate in radians per second
      // Convert to radians: (bpm / 60) gives rotations per second, multiply by 2π for radians
      const rotationSpeed = (bpm / 60) * playbackRate * 2 * Math.PI;
      meshRef.current.rotation.y += delta * rotationSpeed;
      baseRotationRef.current = meshRef.current.rotation.y;
    } else {
      // When not playing and not scratching, keep current rotation
      meshRef.current.rotation.y = baseRotationRef.current;
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={scene}
      scale={1.5}
      rotation={[0, 0, 0]}
    />
  );
}

