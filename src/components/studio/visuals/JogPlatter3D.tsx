"use client";

/**
 * JogPlatter3D Component
 *
 * Interactive 3D Jog Wheel with vinyl physics
 * - Realistic platter with metallic material
 * - Album art texture mapping
 * - Rotation synced to Audio Engine playback
 * - Touch zones: Top (scratch/scrub) vs Side (pitch bend)
 * - 60fps smooth animation via useFrame
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh, Group } from 'three';
import * as THREE from 'three';

interface JogPlatter3DProps {
  deckId: 'A' | 'B';
  artworkUrl?: string;
  isPlaying: boolean;
  bpm?: number;
  progress: number; // 0-1
  accent?: string;
  onScratch?: (delta: number) => void;
  onBend?: (amount: number) => void;
}

export function JogPlatter3D({
  deckId,
  artworkUrl,
  isPlaying,
  bpm = 120,
  progress,
  accent = '#22d3ee',
  onScratch,
  onBend,
}: JogPlatter3DProps) {
  const groupRef = useRef<Group>(null);
  const platterRef = useRef<Mesh>(null);
  const markerRef = useRef<Mesh>(null);
  const labelRef = useRef<Mesh>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragZone, setDragZone] = useState<'top' | 'side' | null>(null);
  const [lastPointerAngle, setLastPointerAngle] = useState(0);

  const rotationRef = useRef(0);
  const velocityRef = useRef(0);

  // Calculate rotation speed based on BPM (4 beats = 1 full rotation)
  const rotationSpeed = useMemo(() => {
    if (!bpm) return 0;
    // 4 beats = 1 rotation, 60 seconds = 1 minute
    const beatsPerSecond = bpm / 60;
    const rotationsPerSecond = beatsPerSecond / 4;
    return rotationsPerSecond * Math.PI * 2; // radians per second
  }, [bpm]);

  // Load album artwork texture
  const artworkTexture = useLoader(
    TextureLoader,
    artworkUrl || '/images/placeholder-vinyl.png',
    undefined,
    () => {
      console.log(`[JogPlatter3D:${deckId}] Texture load failed, using fallback`);
    }
  );

  useEffect(() => {
    if (artworkTexture) {
      artworkTexture.anisotropy = 16;
      artworkTexture.minFilter = THREE.LinearMipmapLinearFilter;
      artworkTexture.magFilter = THREE.LinearFilter;
    }
  }, [artworkTexture]);

  // Animation loop - 60fps rotation updates
  useFrame((state, delta) => {
    if (!platterRef.current || !labelRef.current) return;

    if (isDragging && dragZone === 'top') {
      // Manual scratch - rotation controlled by user
      platterRef.current.rotation.y = rotationRef.current;
      labelRef.current.rotation.y = rotationRef.current;
      velocityRef.current = 0;
    } else if (isPlaying && !isDragging) {
      // Auto-play rotation
      const deltaRotation = rotationSpeed * delta;
      rotationRef.current += deltaRotation;
      velocityRef.current = deltaRotation;

      platterRef.current.rotation.y = rotationRef.current;
      labelRef.current.rotation.y = rotationRef.current;
    } else {
      // Deceleration when stopped
      velocityRef.current *= 0.92; // Friction
      if (Math.abs(velocityRef.current) > 0.001) {
        rotationRef.current += velocityRef.current;
        platterRef.current.rotation.y = rotationRef.current;
        labelRef.current.rotation.y = rotationRef.current;
      }
    }

    // Update marker rotation
    if (markerRef.current) {
      markerRef.current.rotation.y = platterRef.current.rotation.y;
    }

    // Subtle bobbing animation when playing (vinyl realism)
    if (isPlaying && groupRef.current) {
      const bobAmount = Math.sin(state.clock.elapsedTime * 2) * 0.002;
      groupRef.current.position.y = bobAmount;
    }
  });

  // Handle pointer interactions
  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    setIsDragging(true);

    // Determine if clicking top surface or side edge
    const point = event.point;
    const distance = Math.hypot(point.x, point.z);
    const zone = distance > 0.8 ? 'side' : 'top';
    setDragZone(zone);

    // Calculate initial angle for scratch/bend
    const angle = Math.atan2(point.z, point.x);
    setLastPointerAngle(angle);
  };

  const handlePointerMove = (event: any) => {
    if (!isDragging) return;
    event.stopPropagation();

    const point = event.point;
    const currentAngle = Math.atan2(point.z, point.x);
    const angleDelta = currentAngle - lastPointerAngle;

    if (dragZone === 'top') {
      // Scratch/Scrub - direct rotation control
      rotationRef.current += angleDelta;
      if (onScratch) {
        onScratch(angleDelta);
      }
    } else if (dragZone === 'side') {
      // Pitch Bend - nudge effect
      const bendAmount = angleDelta * 10; // Amplify for pitch bend
      if (onBend) {
        onBend(bendAmount);
      }
    }

    setLastPointerAngle(currentAngle);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragZone(null);
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Platter (Vinyl) */}
      <mesh
        ref={platterRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <cylinderGeometry args={[1, 1, 0.05, 64]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Center Label (Album Art) */}
      <mesh
        ref={labelRef}
        position={[0, 0.026, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.35, 0.35, 0.001, 32]} />
        <meshStandardMaterial
          map={artworkTexture}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Rotation Marker (White stripe) */}
      <mesh
        ref={markerRef}
        position={[0.85, 0.026, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <boxGeometry args={[0.15, 0.005, 0.015]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Progress Indicator Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.95, 0.02, 16, 100, progress * Math.PI * 2]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.8}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Outer Rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.03, 16, 64]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>

      {/* Vinyl Grooves (detail lines) */}
      {[...Array(8)].map((_, i) => {
        const radius = 0.4 + (i * 0.06);
        return (
          <mesh key={i} position={[0, 0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, 0.002, 8, 64]} />
            <meshStandardMaterial
              color="#0f0f0f"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}
