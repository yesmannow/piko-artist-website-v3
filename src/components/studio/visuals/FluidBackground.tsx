// src/components/studio/visuals/FluidBackground.tsx
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Environment } from '@react-three/drei';
import * as Tone from 'tone';
import * as THREE from 'three';

const ReactiveOrb = () => {
  const materialRef = useRef<any>(null);
  
  // Create Meter node for analysis (smoothing 0.8 for organic feel)
  const meter = useMemo(() => new Tone.Meter({ smoothing: 0.8 }), []);

  useEffect(() => {
    // Connect to Master Output without breaking chain
    Tone.getDestination().connect(meter);
    return () => { meter.dispose(); };
  }, [meter]);

  useFrame((state) => {
    if (!materialRef.current) return;

    // 1. Get Audio Level (Decibels: -Infinity to +3)
    const rawLevel = meter.getValue();
    const level = typeof rawLevel === 'number' ? rawLevel : -100;

    // 2. Normalize (-60db floor to 0-1 range)
    // Clamp values to avoid glitches
    const energy = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(level, -60, -5, 0, 1), 
      0, 
      1
    );

    // 3. Modulate Distort and Speed based on Energy
    // Base distortion 0.3, Max 1.0. Speed increases with energy.
    const targetDistort = 0.3 + (energy * 0.7);
    const targetSpeed = 1.5 + (energy * 4.0);

    // 4. Lerp for fluid motion (The "Liquid" feel)
    materialRef.current.distort = THREE.MathUtils.lerp(
      materialRef.current.distort, 
      targetDistort, 
      0.1
    );
    materialRef.current.speed = THREE.MathUtils.lerp(
      materialRef.current.speed, 
      targetSpeed, 
      0.05
    );
  });

  return (
    <Sphere args={[1, 128, 128]} scale={2.2}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#050505"       // Obsidian Black
        envMapIntensity={1.5}
        clearcoat={1.0}       // Glassy layer
        clearcoatRoughness={0.1}
        metalness={0.9}       // Metallic reflection
        roughness={0.1}
      />
    </Sphere>
  );
};

export const FluidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-zinc-950 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        {/* Colorful rim lights to define the black sphere */}
        <directionalLight position={[10, 10, 5]} intensity={2} color="#4f46e5" /> {/* Indigo */}
        <directionalLight position={[-10, -10, -5]} intensity={2} color="#c026d3" /> {/* Fuchsia */}
        <Environment preset="city" />
        <ReactiveOrb />
      </Canvas>
    </div>
  );
};
