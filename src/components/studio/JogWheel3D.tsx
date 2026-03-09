'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useMemo, Suspense } from 'react';
import { useDeckStore } from '@/store/deckStore';

// ── Design-system colors ──────────────────────────────────────────────────
// Obsidian palette aligned with the Liquid Obsidian design system.
const OBSIDIAN_800 = '#1e293b';  // slate-800 — label background ring
const OBSIDIAN_900 = '#0f172a';  // slate-900 — label center fill

// ── Platter ───────────────────────────────────────────────────────────────
// Rotation is driven by useFrame reading the Zustand store directly so that
// playhead position updates never trigger React re-renders on the Deck.

interface PlatterProps {
  deckId: 'A' | 'B';
  accentColor: string;
  coverArt?: string;
  isLoading: boolean;
  slipActive?: boolean;
  ghostRotation?: number;
}

function Platter({ deckId, accentColor, coverArt, isLoading, slipActive, ghostRotation }: PlatterProps) {
  const rotatingGroupRef = useRef<THREE.Group>(null);

  // Zero-lag rotation: read store inside the Three.js render loop — no React re-renders.
  useFrame(() => {
    if (!rotatingGroupRef.current) return;
    const state = useDeckStore.getState();
    const rotation = deckId === 'A' ? state.deckA.rotation : state.deckB.rotation;
    rotatingGroupRef.current.rotation.y = -rotation * (Math.PI / 180);
  });

  const defaultTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = OBSIDIAN_800;
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = OBSIDIAN_900;
      ctx.beginPath();
      ctx.arc(128, 128, 100, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  const defaultLabel = (
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.8, 32]} />
      <primitive object={new THREE.MeshBasicMaterial({ map: defaultTexture })} attach="material" />
    </mesh>
  );

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Aluminum platter base */}
      <Cylinder args={[2.8, 2.9, 0.4, 64]} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.35} />
      </Cylinder>

      {/* Rotating top plate — driven by useFrame, not a prop */}
      <group ref={rotatingGroupRef}>
        <Cylinder args={[2.7, 2.7, 0.42, 64]} position={[0, -0.21, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
        </Cylinder>

        {/* Record groove ring */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 2.6, 64]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.8} />
        </mesh>

        {/* Per-deck accent marker */}
        <mesh position={[0, 0.011, 2.1]}>
          <boxGeometry args={[0.2, 0.01, 0.6]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} />
        </mesh>

        {/* Center label — Suspense isolates texture loading failures */}
        {coverArt ? (
          <Suspense fallback={defaultLabel}>
            <ArtworkLabel url={coverArt} />
          </Suspense>
        ) : (
          defaultLabel
        )}
      </group>

      {/* Ghost marker for slip mode */}
      {slipActive && ghostRotation !== undefined && (
        <group rotation={[0, -ghostRotation * (Math.PI / 180), 0]}>
          <mesh position={[0, 0.015, 2.3]}>
            <boxGeometry args={[0.3, 0.01, 0.1]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.8} transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {isLoading && <LoadingAnimator accentColor={accentColor} />}
    </group>
  );
}

// ── LoadingAnimator ────────────────────────────────────────────────────────

function LoadingAnimator({ accentColor }: { accentColor: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z -= delta * 5;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 0.95, 32, 1, 0, Math.PI * 1.5]} />
      <meshBasicMaterial color={accentColor} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── ArtworkLabel — must be inside Suspense (useLoader throws a Promise) ────

function ArtworkLabel({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.8, 64]} />
      <meshBasicMaterial map-colorSpace={THREE.SRGBColorSpace} map={texture} />
    </mesh>
  );
}

// ── JogWheel3D ─────────────────────────────────────────────────────────────
// pointer-events-none is intentionally absent: the Canvas must be
// reachable so Three.js raycasting and browser pointer capture both work.

export interface JogWheel3DProps {
  deckId: 'A' | 'B';
  accentColor: string;
  coverArt?: string;
  isLoading: boolean;
  slipActive?: boolean;
  ghostRotation?: number;
}

export function JogWheel3D({ deckId, accentColor, coverArt, isLoading, slipActive, ghostRotation }: JogWheel3DProps) {
  return (
    <div className="absolute inset-0">
      <Canvas shadows orthographic camera={{ position: [0, 5, 0], zoom: 35 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 20, 5]} intensity={2.5} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={1} color={accentColor} />
        <Platter
          deckId={deckId}
          accentColor={accentColor}
          coverArt={coverArt}
          isLoading={isLoading}
          slipActive={slipActive}
          ghostRotation={ghostRotation}
        />
      </Canvas>
    </div>
  );
}
