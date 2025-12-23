"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import { useAudio } from "@/context/AudioContext";

function FloatingShape({ position, type, color, isPlaying }: { position: [number, number, number]; type: "sphere" | "cylinder"; color: string; isPlaying: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseRotationSpeed = useRef({
    x: (Math.random() - 0.5) * 0.01,
    y: (Math.random() - 0.5) * 0.01,
    z: (Math.random() - 0.5) * 0.01,
  });
  const basePosition = useRef(position);
  const vibrationOffset = useRef({ x: 0, y: 0, z: 0 });

  useFrame((state) => {
    if (!meshRef.current) return;

    // Audio-reactive rotation speed multiplier
    const speedMultiplier = isPlaying ? 3 : 1;
    const rotationSpeed = {
      x: baseRotationSpeed.current.x * speedMultiplier,
      y: baseRotationSpeed.current.y * speedMultiplier,
      z: baseRotationSpeed.current.z * speedMultiplier,
    };

    // Rotation
    meshRef.current.rotation.x += rotationSpeed.x;
    meshRef.current.rotation.y += rotationSpeed.y;
    meshRef.current.rotation.z += rotationSpeed.z;

    // Audio-reactive vibration
    const time = state.clock.getElapsedTime();
    if (isPlaying) {
      const beatFrequency = 2; // Simulated beat frequency
      const vibrationIntensity = 0.15;
      vibrationOffset.current.x = Math.sin(time * beatFrequency * 4) * vibrationIntensity;
      vibrationOffset.current.y = Math.sin(time * beatFrequency * 3) * vibrationIntensity;
      vibrationOffset.current.z = Math.sin(time * beatFrequency * 5) * vibrationIntensity;
    } else {
      vibrationOffset.current = { x: 0, y: 0, z: 0 };
    }

    // Floating drift with vibration
    const floatY = Math.sin(time * 0.5) * 0.3;
    const floatX = Math.cos(time * 0.3) * 0.2;
    meshRef.current.position.y = basePosition.current[1] + floatY + vibrationOffset.current.y;
    meshRef.current.position.x = basePosition.current[0] + floatX + vibrationOffset.current.x;
    meshRef.current.position.z = basePosition.current[2] + vibrationOffset.current.z;
  });

  if (type === "sphere") {
    return (
      <Sphere ref={meshRef} args={[0.3, 32, 32]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          metalness={0.1}
          transparent
          opacity={0.8}
          wireframe={false}
        />
      </Sphere>
    );
  }

  return (
    <Cylinder ref={meshRef} args={[0.2, 0.2, 0.4, 32]} position={position}>
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0.1}
        transparent
        opacity={0.8}
        wireframe={false}
      />
    </Cylinder>
  );
}

export function HeroScene() {
  const { isPlaying } = useAudio();

  // New "Street" palette colors
  const colors = [
    "#ccff00", // toxic-lime
    "#ff0099", // spray-magenta
    "#ff6600", // safety-orange
  ];

  const shapes = [
    { type: "sphere" as const, position: [-2, 1, -3] as [number, number, number], color: colors[0] },
    { type: "cylinder" as const, position: [2, -1, -4] as [number, number, number], color: colors[1] },
    { type: "sphere" as const, position: [0, 2, -5] as [number, number, number], color: colors[2] },
    { type: "cylinder" as const, position: [-1.5, -0.5, -3.5] as [number, number, number], color: colors[0] },
    { type: "sphere" as const, position: [1.5, 0.5, -4.5] as [number, number, number], color: colors[1] },
    { type: "cylinder" as const, position: [-0.5, 1.5, -4] as [number, number, number], color: colors[2] },
  ];

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff0099" />
        {shapes.map((shape, index) => (
          <FloatingShape key={index} type={shape.type} position={shape.position} color={shape.color} isPlaying={isPlaying} />
        ))}
      </Canvas>
    </div>
  );
}

