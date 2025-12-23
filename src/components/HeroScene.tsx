"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

function FloatingShape({ position, type, color }: { position: [number, number, number]; type: "sphere" | "cylinder"; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationSpeed = useRef({
    x: (Math.random() - 0.5) * 0.01,
    y: (Math.random() - 0.5) * 0.01,
    z: (Math.random() - 0.5) * 0.01,
  });
  const basePosition = useRef(position);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Rotation
    meshRef.current.rotation.x += rotationSpeed.current.x;
    meshRef.current.rotation.y += rotationSpeed.current.y;
    meshRef.current.rotation.z += rotationSpeed.current.z;

    // Floating drift
    const time = state.clock.getElapsedTime();
    meshRef.current.position.y = basePosition.current[1] + Math.sin(time * 0.5) * 0.3;
    meshRef.current.position.x = basePosition.current[0] + Math.cos(time * 0.3) * 0.2;
  });

  if (type === "sphere") {
    return (
      <Sphere ref={meshRef} args={[0.3, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          distort={0.3}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.6}
        />
      </Sphere>
    );
  }

  return (
    <Cylinder ref={meshRef} args={[0.2, 0.2, 0.4, 32]} position={position}>
      <MeshDistortMaterial
        color={color}
        distort={0.2}
        speed={1.5}
        roughness={0.1}
        metalness={0.8}
        transparent
        opacity={0.6}
      />
    </Cylinder>
  );
}

export function HeroScene() {
  const colors = [
    "hsl(var(--neon-green))",
    "hsl(var(--neon-pink))",
    "hsl(var(--neon-cyan))",
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
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="hsl(var(--neon-pink))" />
        {shapes.map((shape, index) => (
          <FloatingShape key={index} type={shape.type} position={shape.position} color={shape.color} />
        ))}
      </Canvas>
    </div>
  );
}

