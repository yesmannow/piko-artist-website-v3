"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, PerspectiveCamera } from "@react-three/drei";
import { motion } from "framer-motion";
import Link from "next/link";
import * as THREE from "three";

function TurntableModel({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/3d/turntable-2610.glb");
  
  // Auto-rotate the turntable
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += isHovered ? 0.01 : 0.005;
      // Subtle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={0.8} />
    </group>
  );
}

function Fallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#FFD700" wireframe />
    </mesh>
  );
}

export function StudioPreview3D({ isHovered }: { isHovered: boolean }) {
  const [is3DReady, setIs3DReady] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <div className="absolute inset-0 rounded-lg overflow-hidden border-2 border-[#FFD700]/30 bg-black/60 backdrop-blur-sm">
        <Canvas
          shadows
          dpr={[1, 2]}
          onCreated={() => setIs3DReady(true)}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 1.5, 8]} fov={50} />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.3}
            penumbra={1}
            intensity={1}
            castShadow
            color="#FFD700"
          />
          <spotLight
            position={[-10, 5, -10]}
            angle={0.3}
            penumbra={1}
            intensity={0.5}
            color="#ffffff"
          />
          <pointLight position={[0, 5, 0]} intensity={0.3} color="#FFD700" />

          {/* 3D Model */}
          <Suspense fallback={<Fallback />}>
            <TurntableModel isHovered={isHovered} />
          </Suspense>

          {/* Environment */}
          <Environment preset="city" />

          {/* Controls */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            autoRotate={false}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>

        {/* Loading Overlay */}
        {!is3DReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full"
            />
          </div>
        )}
      </div>

      {/* Interactive Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        <div className="bg-black/80 backdrop-blur-md px-6 py-3 border-2 border-[#FFD700]">
          <p className="text-[#FFD700] font-mono text-sm uppercase tracking-wider">
            Drag to Rotate • Click to Explore
          </p>
        </div>
      </motion.div>

      {/* Corner Labels */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1 border border-[#FFD700]/50">
        <span className="text-[10px] font-mono text-[#FFD700] uppercase tracking-wider">
          3D_PREVIEW
        </span>
      </div>

      <Link href="/studio">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-4 right-4 bg-[#FFD700] text-black px-4 py-2 font-black italic uppercase text-sm border-2 border-black cursor-pointer"
          style={{
            fontFamily: "var(--font-lexend), system-ui, sans-serif",
            transform: "skewX(-12deg)",
            boxShadow: "4px 4px 0px #000",
          }}
        >
          <span style={{ transform: "skewX(12deg)", display: "inline-block" }}>
            FULL STUDIO →
          </span>
        </motion.div>
      </Link>

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-lg"
        animate={{
          boxShadow: isHovered
            ? [
                "0 0 20px rgba(255, 215, 0, 0.3)",
                "0 0 40px rgba(255, 215, 0, 0.5)",
                "0 0 20px rgba(255, 215, 0, 0.3)",
              ]
            : "0 0 10px rgba(255, 215, 0, 0.2)",
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

// Preload the 3D model
useGLTF.preload("/3d/turntable-2610.glb");
