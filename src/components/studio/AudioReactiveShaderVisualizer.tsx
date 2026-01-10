"use client";

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * AudioReactiveParticles - WebGL particle system driven by audio analysis
 * 
 * Phase 4: Advanced Features - 3D Visualizer (WebGL)
 * 
 * Creates a GPU-accelerated particle system that responds to music:
 * - Bass frequencies displace particles vertically
 * - Mid frequencies affect particle size
 * - High frequencies modulate color/opacity
 * - Uses custom vertex and fragment shaders for realtime GPU processing
 */

interface AudioReactiveParticlesProps {
  analyser: AnalyserNode | null;
  count?: number;
}

export function AudioReactiveParticles({
  analyser,
  count = 10000,
}: AudioReactiveParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const frequencyDataRef = useRef<Uint8Array & { buffer: ArrayBuffer } | null>(null);
  
  // Initialize frequency data buffer
  useEffect(() => {
    if (analyser) {
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      // Cast to the expected type - new Uint8Array(length) creates ArrayBuffer, not ArrayBufferLike
      frequencyDataRef.current = buffer as Uint8Array & { buffer: ArrayBuffer };
    }
  }, [analyser]);
  
  // Create particle geometry
  useEffect(() => {
    if (!meshRef.current) return;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // Initialize particle positions in a sphere
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 5 + Math.random() * 5;
      
      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Random colors
      colors[i * 3 + 0] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();
      
      // Random sizes
      sizes[i] = Math.random() * 2 + 1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    meshRef.current.geometry = geometry;
  }, [count]);
  
  // Update shader uniforms based on audio data
  useFrame((state) => {
    if (!materialRef.current || !analyser || !frequencyDataRef.current) return;
    
    // Get frequency data
    // @ts-ignore - Runtime guarantees new Uint8Array(length) creates ArrayBuffer, not ArrayBufferLike
    analyser.getByteFrequencyData(frequencyDataRef.current);
    
    const data = frequencyDataRef.current;
    const binCount = data.length;
    
    // Calculate frequency bands (normalized 0-1)
    const bassEnd = Math.floor(binCount * 0.1); // 0-10% = bass
    const midEnd = Math.floor(binCount * 0.3);  // 10-30% = mid
    const highEnd = Math.floor(binCount * 0.6); // 30-60% = high
    
    const bass = data.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd / 255;
    const mid = data.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - bassEnd) / 255;
    const high = data.slice(midEnd, highEnd).reduce((a, b) => a + b, 0) / (highEnd - midEnd) / 255;
    
    // Update shader uniforms
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uBass.value = bass;
    materialRef.current.uniforms.uMid.value = mid;
    materialRef.current.uniforms.uHigh.value = high;
  });
  
  return (
    <points ref={meshRef}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uBass: { value: 0 },
          uMid: { value: 0 },
          uHigh: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}

/**
 * Vertex Shader - Displaces particles based on bass frequencies
 */
const vertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  
  attribute float size;
  attribute vec3 color;
  
  varying vec3 vColor;
  varying float vIntensity;
  
  void main() {
    vColor = color;
    
    // Calculate displacement based on bass
    vec3 pos = position;
    
    // Bass: Vertical displacement (y-axis)
    float bassDisplacement = uBass * 3.0;
    pos.y += sin(uTime + position.x * 0.5) * bassDisplacement;
    
    // Mid: Radial expansion
    float midExpansion = uMid * 2.0;
    pos *= 1.0 + midExpansion;
    
    // High: Rotation/swirl
    float angle = uHigh * uTime * 0.5;
    float cosA = cos(angle);
    float sinA = sin(angle);
    float x = pos.x * cosA - pos.z * sinA;
    float z = pos.x * sinA + pos.z * cosA;
    pos.x = x;
    pos.z = z;
    
    // Calculate intensity for fragment shader
    vIntensity = (uBass + uMid + uHigh) / 3.0;
    
    // Project position
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size based on mid frequencies and distance
    float scaledSize = size * (1.0 + uMid * 2.0);
    gl_PointSize = scaledSize * (300.0 / -mvPosition.z);
  }
`;

/**
 * Fragment Shader - Modulates color/opacity based on treble levels
 */
const fragmentShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  
  varying vec3 vColor;
  varying float vIntensity;
  
  void main() {
    // Create circular particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
      discard;
    }
    
    // Soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Color modulation based on high frequencies
    vec3 color = vColor;
    
    // High frequencies shift color toward cyan
    color.r = mix(color.r, 0.0, uHigh * 0.7);
    color.g = mix(color.g, 1.0, uHigh * 0.8);
    color.b = mix(color.b, 1.0, uHigh * 0.9);
    
    // Bass adds warmth (red/orange)
    color.r = mix(color.r, 1.0, uBass * 0.5);
    color.g = mix(color.g, 0.5, uBass * 0.3);
    
    // Brightness based on overall intensity
    color *= 0.5 + vIntensity * 1.5;
    
    // Opacity based on intensity
    alpha *= 0.3 + vIntensity * 0.7;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * AudioReactivePlane - Plane mesh with displaced vertices
 * 
 * Alternative visualizer style using a deforming plane
 */

interface AudioReactivePlaneProps {
  analyser: AnalyserNode | null;
  segments?: number;
}

export function AudioReactivePlane({
  analyser,
  segments = 128,
}: AudioReactivePlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const frequencyDataRef = useRef<Uint8Array & { buffer: ArrayBuffer } | null>(null);
  
  useEffect(() => {
    if (analyser) {
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      // Cast to the expected type - new Uint8Array(length) creates ArrayBuffer, not ArrayBufferLike
      frequencyDataRef.current = buffer as Uint8Array & { buffer: ArrayBuffer };
    }
  }, [analyser]);
  
  useFrame((state) => {
    if (!materialRef.current || !analyser || !frequencyDataRef.current) return;
    
    // @ts-ignore - Runtime guarantees new Uint8Array(length) creates ArrayBuffer, not ArrayBufferLike
    analyser.getByteFrequencyData(frequencyDataRef.current);
    const data = frequencyDataRef.current;
    const binCount = data.length;
    
    const bassEnd = Math.floor(binCount * 0.1);
    const midEnd = Math.floor(binCount * 0.3);
    const highEnd = Math.floor(binCount * 0.6);
    
    const bass = data.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd / 255;
    const mid = data.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - bassEnd) / 255;
    const high = data.slice(midEnd, highEnd).reduce((a, b) => a + b, 0) / (highEnd - midEnd) / 255;
    
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uBass.value = bass;
    materialRef.current.uniforms.uMid.value = mid;
    materialRef.current.uniforms.uHigh.value = high;
  });
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 4, 0, 0]}>
      <planeGeometry args={[20, 20, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={planeVertexShader}
        fragmentShader={planeFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uBass: { value: 0 },
          uMid: { value: 0 },
          uHigh: { value: 0 },
        }}
        wireframe={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

const planeVertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  
  varying vec2 vUv;
  varying float vElevation;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Wave effect based on bass
    float wave1 = sin(pos.x * 2.0 + uTime) * uBass * 2.0;
    float wave2 = sin(pos.y * 2.0 + uTime * 0.5) * uBass * 2.0;
    
    // Ripple effect based on mid
    float dist = length(pos.xy);
    float ripple = sin(dist * 3.0 - uTime * 2.0) * uMid * 1.5;
    
    // Combine effects
    pos.z = wave1 + wave2 + ripple;
    vElevation = pos.z;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const planeFragmentShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  
  varying vec2 vUv;
  varying float vElevation;
  
  void main() {
    // Color based on elevation and audio
    vec3 color = vec3(0.0);
    
    // Base color gradient (dark blue to cyan)
    color.b = 0.3 + vUv.y * 0.7;
    color.g = vUv.y * 0.8;
    
    // Bass adds red warmth
    color.r = uBass * 0.8;
    
    // High frequencies add cyan
    color.g += uHigh * 0.5;
    color.b += uHigh * 0.3;
    
    // Elevation adds brightness
    float brightness = 0.5 + abs(vElevation) * 0.5;
    color *= brightness;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
