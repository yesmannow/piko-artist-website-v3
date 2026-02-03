"use client";

/**
 * Scene3D Component
 *
 * React Three Fiber 3D Visualizer
 * - ReactiveShape (Sphere) distorts based on Tone.Meter input (Bass)
 * - Color/geometry changes based on currentTheme from Zustand (Chill vs. Hype)
 * - PHASE VI: Audio-reactive lighting synced to bass frequencies
 */

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as Tone from 'tone';
import { useStore } from '@/store/useStore';
import * as THREE from 'three';
import { useAudioAnalyser } from '@/hooks/useAudioAnalyser';

function ReactiveLighting() {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const { deckA, deckB } = useStore();

  // Get audio analysis from the active deck
  let activeDeck = null;
  if (deckA.isPlaying) {
    activeDeck = deckA;
  } else if (deckB.isPlaying) {
    activeDeck = deckB;
  }

  const { bass } = useAudioAnalyser(null, Boolean(activeDeck?.isPlaying));

  useFrame(() => {
    if (!spotLightRef.current || !ambientLightRef.current) return;

    // React to bass frequencies (kick drum)
    const bassBoost = bass * 2; // Amplify bass response
    const baseIntensity = 1;
    const maxBoost = 0.5;

    // Pulse lights on bass peaks
    spotLightRef.current.intensity = baseIntensity + (bassBoost * maxBoost);
    ambientLightRef.current.intensity = 0.5 + (bassBoost * 0.2);
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.5} />
      <spotLight
        ref={spotLightRef}
        position={[10, 10, 10]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
    </>
  );
}

function ReactiveShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  const meterRef = useRef<Tone.Meter | null>(null);
  const { deckA, deckB } = useStore();

  // Determine theme from active track
  const activeTrack = deckA.trackData || deckB.trackData;
  const isHype = (activeTrack?.energy || 0) > 0.6 || (activeTrack?.bpm || 0) > 110;
  const themeColor = isHype ? '#ef4444' : '#06b6d4'; // Crimson for hype, Cyan for chill

  // Initialize audio meter
  useEffect(() => {
    const meter = new Tone.Meter();
    // Connect to master output (this would need to be connected to the actual audio engine)
    // For now, we'll use a dummy connection
    meterRef.current = meter;

    return () => {
      meter.dispose();
    };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Get audio level (0-1)
    const level = meterRef.current?.getValue() as number || 0;
    const normalizedLevel = Math.max(0, Math.min(1, (level + 60) / 60)); // Normalize from dB

    // Animate sphere
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = time * 0.2;
    meshRef.current.rotation.y = time * 0.3;

    // Scale based on audio level
    const scale = 1 + normalizedLevel * 0.3;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        color={themeColor}
        distort={0.4}
        speed={2}
        roughness={0.2}
        metalness={0.8}
        emissive={themeColor}
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
}

interface Scene3DProps {
  className?: string;
  isActive?: boolean;
}

export function Scene3D({ className, isActive = true }: Scene3DProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const shouldRender = isActive && isVisible;

  return (
    <div className={`w-full h-full ${className || ''}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]} // Cap DPR for mobile performance
        gl={{ antialias: true, alpha: true }}
      >
        <ReactiveLighting />
        {shouldRender && <ReactiveShape />}
      </Canvas>
    </div>
  );
}
