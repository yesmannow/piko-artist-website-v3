"use client";

import { useGLTF } from "@react-three/drei";

export function DeskProps() {
  const { scene } = useGLTF("/3d/earphone-1952.glb");

  return (
    <primitive
      object={scene}
      position={[8, -2, 2]}
      scale={1.2}
      rotation={[0, -0.5, 0]}
    />
  );
}

