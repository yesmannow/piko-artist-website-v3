"use client";

/**
 * Scene3D Component
 *
 * React Three Fiber 3D Visualizer
 * - ReactiveShape (Sphere) distorts based on Tone.Meter input (Bass)
 * - Color/geometry changes based on currentTheme from Zustand (Chill vs. Hype)
 * - PHASE VI: Audio-reactive lighting synced to bass frequencies
 * - PHASE X: GPU-adaptive rendering for mobile performance
 */

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as Tone from 'tone';
import { useStore } from '@/store/useStore';
import { useStudioStore } from '@/store/useStudioStore';
import * as THREE from 'three';
import { useAudioAnalyser } from '@/hooks/useAudioAnalyser';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { getPerformanceProfile, getFallbackProfile, type PerformanceProfile } from '@/lib/gpu-utils';

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

function ReactiveShape({ perfProfile }: { readonly perfProfile: PerformanceProfile }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const meterRef = useRef<Tone.Meter | null>(null);
  const { deckA, deckB } = useStore();
  const audioEngine = useAudioEngine();

  // Determine theme from active track
  const activeTrack = deckA.trackData || deckB.trackData;
  const isHype = (activeTrack?.energy || 0) > 0.6 || (activeTrack?.bpm || 0) > 110;
  const themeColor = isHype ? '#ef4444' : '#06b6d4'; // Crimson for hype, Cyan for chill

  // Phase X: Connect to real master bus meter
  useEffect(() => {
    if (!audioEngine.isReady) return;

    try {
      const masterChannel = audioEngine.getMasterChannel();
      if (masterChannel) {
        const meter = new Tone.Meter();
        masterChannel.connect(meter);
        meterRef.current = meter;

        return () => {
          if (meterRef.current) {
            masterChannel.disconnect(meterRef.current);
            meterRef.current.dispose();
          }
        };
      }
    } catch (err) {
      console.warn('[Scene3D] Failed to connect master meter:', err);
    }
  }, [audioEngine, audioEngine.isReady]);

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

  // Phase X: GPU-adaptive sphere detail
  const sphereSegments = perfProfile.sphereDetail;

  // Phase X: Use basic material on low-end devices
  if (perfProfile.useBasicMaterials) {
    return (
      <Sphere ref={meshRef} args={[1, sphereSegments, sphereSegments]}>
        <meshBasicMaterial color={themeColor} />
      </Sphere>
    );
  }

  return (
    <Sphere ref={meshRef} args={[1, sphereSegments, sphereSegments]}>
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
  readonly className?: string;
  readonly isActive?: boolean;
}

export function Scene3D({ className, isActive = true }: Scene3DProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [perfProfile, setPerfProfile] = useState<PerformanceProfile>(getFallbackProfile());
  const performanceMode = useStudioStore((state) => state.performanceMode);

  // Phase X: Detect GPU capabilities on mount
  useEffect(() => {
    getPerformanceProfile().then(setPerfProfile);
  }, []);

  // Phase X: Override with manual performance mode if set
  useEffect(() => {
    if (performanceMode === 'low') {
      // Legitimate use: responding to external performance mode change
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPerfProfile((prev) => ({
        ...prev,
        tier: 1,
        isLowEnd: true,
        fpsTarget: 30,
        sphereDetail: 32,
        enableAntialias: false,
        useBasicMaterials: true,
      }));
    } else if (performanceMode === 'high') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPerfProfile((prev) => ({
        ...prev,
        tier: 3,
        isLowEnd: false,
        fpsTarget: 60,
        sphereDetail: 64,
        enableAntialias: true,
        useBasicMaterials: false,
      }));
    }
  }, [performanceMode]);

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
        dpr={[1, perfProfile.maxDPR]} // Phase X: GPU-adaptive DPR
        gl={{
          antialias: perfProfile.enableAntialias, // Phase X: Disable on mobile
          alpha: true,
        }}
        frameloop={shouldRender ? 'always' : 'never'} // Phase X: Pause when not visible
      >
        <ReactiveLighting />
        {shouldRender && <ReactiveShape perfProfile={perfProfile} />}
      </Canvas>
    </div>
  );
}
