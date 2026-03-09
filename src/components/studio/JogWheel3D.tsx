'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';

function Platter({ rotation, coverArt, isLoading, slipActive, ghostRotation }: { rotation: number; coverArt?: string; isLoading: boolean; slipActive?: boolean; ghostRotation?: number }) {
  
  // Safe load texture - handling missing art
  const defaultTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.beginPath();
      ctx.arc(128, 128, 100, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Use TextureLoader directly inside component, but gracefully degradation via useLoader?
  // We should create a helper component for the texture to use Suspense
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Aluminum Platter Base */}
      <Cylinder args={[2.8, 2.9, 0.4, 64]} position={[0, -0.2, 0]}>
        <meshStandardMaterial 
          color="#888888" 
          metalness={0.9} 
          roughness={0.4} 
        />
      </Cylinder>
      
      {/* Rotating Top Plate with Artwork */}
      <group rotation={[0, -rotation * (Math.PI / 180), 0]}>
        <Cylinder args={[2.7, 2.7, 0.42, 64]} position={[0, -0.21, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
        </Cylinder>
        
        {/* Record Grooves / Marker */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 2.6, 64]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.8} />
        </mesh>
        
        {/* Silver ring marker */}
        <mesh position={[0, 0.011, 2.1]}>
          <boxGeometry args={[0.2, 0.01, 0.6]} />
          <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={0.5} />
        </mesh>

        {/* Center label (Artwork) */}
        {coverArt ? (
          <ArtworkLabel url={coverArt} />
        ) : (
          <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.8, 32]} />
            <primitive object={new THREE.MeshBasicMaterial({ map: defaultTexture })} attach="material" />
          </mesh>
        )}
      </group>

      {/* Ghost Marker for Slip Mode */}
      {slipActive && ghostRotation !== undefined && (
        <group rotation={[0, -ghostRotation * (Math.PI / 180), 0]}>
           <mesh position={[0, 0.015, 2.3]}>
             <boxGeometry args={[0.3, 0.01, 0.1]} />
             <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.8} transparent opacity={0.6} />
           </mesh>
        </group>
      )}

      {/* Loading Spinner ring */}
      {isLoading && <LoadingAnimator />}
    </group>
  );
}

function LoadingAnimator() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z -= delta * 5;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 0.95, 32, 1, 0, Math.PI * 1.5]} />
      <meshBasicMaterial color="#00f2ff" side={THREE.DoubleSide} />
    </mesh>
  );
}

function ArtworkLabel({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.8, 64]} />
      <meshBasicMaterial map-colorSpace={THREE.SRGBColorSpace} map={texture} />
    </mesh>
  );
}

export function JogWheel3D({ rotation, coverArt, isLoading, slipActive, ghostRotation }: { rotation: number; coverArt?: string; isLoading: boolean; slipActive?: boolean; ghostRotation?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas shadows orthographic camera={{ position: [0, 5, 0], zoom: 35 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 20, 5]} intensity={2.5} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={1} color="#00f2ff" />
        <Platter 
          rotation={rotation} 
          coverArt={coverArt} 
          isLoading={isLoading} 
          slipActive={slipActive} 
          ghostRotation={ghostRotation} 
        />
      </Canvas>
    </div>
  );
}
