"use client";

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { getRealtimeAudioSystem } from '@/engine/rt/RealtimeAudioSystem';
import * as THREE from 'three';

/**
 * AudioReactiveMaterial - Shader material driven by audio analyser data
 */
/**
 * Creates a Uint8Array with ArrayBuffer backing for Web Audio API compatibility.
 * new Uint8Array(length) creates an ArrayBuffer-backed array at runtime.
 * TypeScript infers ArrayBufferLike, but we assert the correct runtime type.
 */
function createAudioBuffer(size: number): Uint8Array & { buffer: ArrayBuffer } {
  const buffer = new Uint8Array(size);
  // Runtime guarantee: new Uint8Array(length) creates ArrayBuffer, not ArrayBufferLike
  return buffer as Uint8Array & { buffer: ArrayBuffer };
}

function AudioReactiveMaterial() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const analyserDataRef = useRef<Uint8Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize analyser
  useEffect(() => {
    try {
      const rtAudio = getRealtimeAudioSystem();

      if (rtAudio.isReady) {
        // Create analyser node
        const analyser = rtAudio.context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        // Pre-allocate buffer using helper to ensure correct typing
        analyserDataRef.current = createAudioBuffer(analyser.frequencyBinCount);

        analyserRef.current = analyser;

        console.log('[Visualizer] Analyser initialized');
      }
    } catch (error) {
      console.error('[Visualizer] Failed to initialize analyser:', error);
    }
  }, []);

  // Update shader uniforms based on audio data
  useFrame(() => {
    if (!materialRef.current || !analyserRef.current || !analyserDataRef.current) return;

    // Update analyser data (reuses pre-allocated buffer)
    // Runtime guarantee: new Uint8Array(length) creates ArrayBuffer-backed array
    // TypeScript infers ArrayBufferLike, but runtime is correct (ArrayBuffer)
    // Type assertion is safe because createAudioBuffer uses new Uint8Array(length)
    const buffer = analyserDataRef.current;
    analyserRef.current.getByteFrequencyData(buffer as Parameters<typeof analyserRef.current.getByteFrequencyData>[0]);

    const analyserData = analyserDataRef.current;

    // Calculate audio metrics
    const average = analyserData.reduce((a, b) => a + b, 0) / analyserData.length;
    const bass = analyserData.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
    const mid = analyserData.slice(4, 16).reduce((a, b) => a + b, 0) / 12;
    const high = analyserData.slice(16, 32).reduce((a, b) => a + b, 0) / 16;

    // Update shader uniforms
    materialRef.current.uniforms.uTime.value += 0.01;
    materialRef.current.uniforms.uBass.value = bass / 255;
    materialRef.current.uniforms.uMid.value = mid / 255;
    materialRef.current.uniforms.uHigh.value = high / 255;
    materialRef.current.uniforms.uAverage.value = average / 255;
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={`
        varying vec2 vUv;
        varying vec3 vPosition;

        uniform float uTime;
        uniform float uBass;

        void main() {
          vUv = uv;
          vPosition = position;

          // Bass-reactive displacement
          vec3 pos = position;
          float displacement = sin(position.x * 2.0 + uTime) * uBass * 0.3;
          pos.z += displacement;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `}
      fragmentShader={`
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uHigh;
        uniform float uAverage;

        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          // Audio-reactive colors
          vec3 bassColor = vec3(1.0, 0.843, 0.0); // Gold
          vec3 midColor = vec3(0.0, 0.5, 1.0);    // Blue
          vec3 highColor = vec3(1.0, 0.0, 0.5);   // Pink

          // Gradient based on position
          float gradient = vUv.y;

          // Mix colors based on frequency bands
          vec3 color = bassColor * uBass * (1.0 - gradient);
          color += midColor * uMid * gradient;
          color += highColor * uHigh * vUv.x;

          // Pulsing effect
          float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
          color *= 0.5 + uAverage * 0.5 + pulse * 0.2;

          // Glow effect
          float glow = smoothstep(0.0, 1.0, uAverage);
          color += vec3(glow * 0.2);

          gl_FragColor = vec4(color, 1.0);
        }
      `}
      uniforms={{
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uHigh: { value: 0 },
        uAverage: { value: 0 },
      }}
    />
  );
}

/**
 * VisualizerScene - Three.js scene with audio-reactive geometry
 */
function VisualizerScene() {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.5} />

      {/* Point lights */}
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />

      {/* Audio-reactive plane */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <planeGeometry args={[8, 8, 32, 32]} />
        <AudioReactiveMaterial />
      </mesh>

      {/* Rotating audio-reactive sphere */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <AudioReactiveMaterial />
      </mesh>
    </>
  );
}

/**
 * StudioVisualizerPage - Detachable visualizer window
 *
 * This page is designed to be opened in a separate window (window.open)
 * for multi-monitor setups.
 */
export default function StudioVisualizerPage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if audio system is initialized
    try {
      const rtAudio = getRealtimeAudioSystem();
      setIsReady(rtAudio.isReady);

      if (!rtAudio.isReady) {
        console.warn('[Visualizer] Audio system not initialized yet');
      }
    } catch (error) {
      console.error('[Visualizer] Failed to access audio system:', error);
    }
  }, []);

  return (
    <div className="w-full h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-black uppercase tracking-tight text-lg">
            Studio Visualizer
          </h1>
          <div className="text-xs text-zinc-400 font-mono">
            {isReady ? '● ACTIVE' : '○ WAITING FOR AUDIO'}
          </div>
        </div>
      </div>

      {/* Three.js Canvas */}
      {isReady ? (
        <Canvas
          camera={{ position: [0, 5, 10], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
        >
          <VisualizerScene />
        </Canvas>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white font-mono text-sm">Waiting for audio system...</p>
            <p className="text-zinc-500 text-xs">Initialize the main studio window first</p>
          </div>
        </div>
      )}
    </div>
  );
}
