"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useSceneCleanup } from "@/hooks/useSceneCleanup";
import { HolographicMaterial } from "@/components/3d/materials/HolographicMaterial";
import * as THREE from "three";
import Link from "next/link";

// Preload the model
useGLTF.preload("/3d/turntable-2610.glb");

/**
 * TurntableModel - 3D turntable with holographic platter
 *
 * Loads the turntable GLB model and applies HolographicMaterial
 * to the platter for visual consistency with Studio page.
 */
function TurntableModel({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  const { scene } = useGLTF("/3d/turntable-2610.glb");
  const groupRef = useRef<THREE.Group>(null);
  const platterRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<any>(null);
  const { scene: threeScene } = useThree();
  const sceneRef = useRef(threeScene);

  // Update scene ref for cleanup
  useEffect(() => {
    sceneRef.current = threeScene;
  }, [threeScene]);

  // Attach memory cleanup
  useSceneCleanup(sceneRef);

  // Find and replace platter material with HolographicMaterial shader
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Look for platter geometry (typically a cylinder or disc)
        // Check by geometry type, name, or position (platter is usually at top)
        const isPlatter =
          child.geometry.type === "CylinderGeometry" ||
          child.name.toLowerCase().includes("platter") ||
          child.name.toLowerCase().includes("disc") ||
          child.name.toLowerCase().includes("vinyl") ||
          (child.position.y > 0.5 && child.geometry.type === "CylinderGeometry");

        if (isPlatter) {
          platterRef.current = child;

          // Create custom shader material matching HolographicMaterial
          const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color("#00ffff") },
              uAudio: { value: 0.3 },
              uScanlineFreq: { value: 40.0 },
              uFresnelPower: { value: 2.5 },
            },
            vertexShader: `
              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec2 vUv;
              varying vec3 vViewPosition;

              void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vUv = uv;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;

                gl_Position = projectionMatrix * mvPosition;
              }
            `,
            fragmentShader: `
              uniform float uTime;
              uniform vec3 uColor;
              uniform float uAudio;
              uniform float uScanlineFreq;
              uniform float uFresnelPower;

              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vViewPosition;
              varying vec2 vUv;

              void main() {
                vec3 viewDir = normalize(vViewPosition);
                vec3 normal = normalize(vNormal);
                float fresnel = pow(1.0 - abs(dot(normal, viewDir)), uFresnelPower);

                float scanline = sin(vPosition.y * uScanlineFreq - uTime * 2.0);
                scanline = smoothstep(0.4, 0.6, scanline);

                float pulse = uAudio * 0.5;

                vec3 finalColor = uColor + (fresnel * 2.0) + (pulse * uColor);

                float alpha = fresnel + (scanline * 0.1) + (pulse * 0.2);
                alpha = clamp(alpha, 0.0, 1.0);

                gl_FragColor = vec4(finalColor, alpha);
              }
            `,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          });

          child.material = shaderMaterial;
          materialRef.current = shaderMaterial;
        }
      }
    });
  }, [scene]);

  // Animation: Slow drift rotation + mouse parallax
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Constant slow drift on Y-axis
      groupRef.current.rotation.y += delta * 0.1;

      // Mouse parallax tilt (subtle)
      const tiltX = mousePosition.y * 0.1; // Tilt based on vertical mouse position
      const tiltZ = mousePosition.x * 0.1; // Tilt based on horizontal mouse position
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ, 0.05);
    }

    // Update holographic material time
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      materialRef.current.uAudio = 0.3; // Subtle pulse for preview
    }
  });

  return (
    <primitive
      ref={groupRef}
      object={scene}
      scale={[2, 2, 2]}
      position={[0, -1, 0]}
    />
  );
}

/**
 * Loading Skeleton - Placeholder while model loads
 */
function StudioSkeleton() {
  return (
    <div className="w-full h-full bg-black/20 flex items-center justify-center">
      <div className="relative">
        <div className="w-32 h-32 border-4 border-toxic-lime/30 border-t-toxic-lime rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-toxic-lime/60 font-mono text-xs">LOADING...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * StudioMixerPreview - High-fidelity Studio preview section
 *
 * Features:
 * - Split-screen layout (desktop) / vertical stack (mobile)
 * - Value proposition with CTA
 * - 3D turntable with holographic platter
 * - Mouse parallax interaction
 * - Performance optimizations (DPR capping, mobile simplifications)
 */
export function StudioMixerPreview() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.matchMedia("(orientation: portrait)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // Normalize to -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePosition({ x, y });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      return () => container.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <section className="relative py-12 md:py-20 px-4 md:px-8 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          ref={containerRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        >
          {/* Left Side: Value Proposition */}
          <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-mono font-bold uppercase tracking-tighter text-foreground"
              style={{ fontFamily: "monospace" }}
            >
              DECONSTRUCT
              <br />
              THE SOUND
            </motion.h2>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-base md:text-lg text-foreground/80 leading-relaxed max-w-lg"
            >
              Isolate any vocal. Strip any beat. Piko Studio V3 leverages Neural Stem Separation and Holographic DSP to transform your library into a live instrument. Don&apos;t just listen—remix in real-time.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Link href="/studio">
                <motion.button
                  className="relative px-8 py-4 md:px-12 md:py-6 bg-cyan-500 text-black font-mono font-bold text-lg md:text-xl uppercase tracking-wider transform -rotate-1 hover:rotate-0 transition-transform shadow-hard border-2 border-black min-h-[60px] w-full md:w-auto"
                  style={{
                    boxShadow: "0 0 30px rgba(0, 255, 255, 0.5), 6px 6px 0px 0px rgba(0,0,0,1)",
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(0, 255, 255, 0.5), 6px 6px 0px 0px rgba(0,0,0,1)",
                      "0 0 50px rgba(0, 255, 255, 0.8), 6px 6px 0px 0px rgba(0,0,0,1)",
                      "0 0 30px rgba(0, 255, 255, 0.5), 6px 6px 0px 0px rgba(0,0,0,1)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  ENTER THE NERVE CENTER →
                </motion.button>
              </Link>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="font-mono text-xs md:text-sm text-toxic-lime"
            >
              <span className="text-red-600">&gt;</span> SYSTEM_READY: NEURAL_ENGINE_ONLINE
            </motion.div>
          </div>

          {/* Right Side: 3D Turntable */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] order-1 lg:order-2">
            <Suspense fallback={<StudioSkeleton />}>
              <Canvas
                dpr={[1, 2]} // CRITICAL: Cap DPR at 2x to prevent mobile overheating
                camera={{ position: [0, 2, 8], fov: 50 }}
                className="w-full h-full"
              >
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1.2} />
                <pointLight position={[-10, -10, -10]} intensity={0.6} color="#00ffff" />

                {/* Simplified scene on mobile */}
                {!isMobile ? (
                  <TurntableModel mousePosition={mousePosition} />
                ) : (
                  // Mobile: Simplified version (no parallax, just rotation)
                  <TurntableModel mousePosition={{ x: 0, y: 0 }} />
                )}
              </Canvas>
            </Suspense>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

