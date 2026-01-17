"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useSceneCleanup } from "@/hooks/useSceneCleanup";
// HolographicMaterial is used inline in TurntableModel, not imported here
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
function TurntableModel({
  mousePosition,
  audioLevel = 0,
}: {
  mousePosition: { x: number; y: number };
  audioLevel?: number;
}) {
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
          (child.position.y > 0.5 &&
            child.geometry.type === "CylinderGeometry");

        if (isPlatter) {
          platterRef.current = child;

          // Create custom shader material matching HolographicMaterial
          const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color("#D4AF37") }, // Brushed Gold
              uAudio: { value: 0.3 },
              uBrushedMetalFreq: { value: 100.0 }, // Vinyl groove texture
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
              uniform float uBrushedMetalFreq;
              uniform float uFresnelPower;

              varying vec3 vNormal;
              varying vec3 vPosition;
              varying vec3 vViewPosition;
              varying vec2 vUv;

              void main() {
                vec3 viewDir = normalize(vViewPosition);
                vec3 normal = normalize(vNormal);
                float fresnel = pow(1.0 - abs(dot(normal, viewDir)), uFresnelPower);

                // Brushed Metal / Vinyl Groove texture
                float brushedMetal = sin(vPosition.y * uBrushedMetalFreq + vPosition.x * 50.0 - uTime * 0.5);
                brushedMetal = smoothstep(0.3, 0.7, brushedMetal) * 0.3;

                float pulse = uAudio * 0.5;

                vec3 finalColor = uColor + (fresnel * 2.0) + (pulse * uColor) + (brushedMetal * uColor * 0.5);

                float alpha = fresnel + (brushedMetal * 0.15) + (pulse * 0.2);
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

  // Animation: Slow drift rotation + mouse parallax + audio bounce
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Constant slow drift on Y-axis
      groupRef.current.rotation.y += delta * 0.1;

      // Mouse parallax tilt (subtle)
      const tiltX = mousePosition.y * 0.1; // Tilt based on vertical mouse position
      const tiltZ = mousePosition.x * 0.1; // Tilt based on horizontal mouse position
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        tiltX,
        0.05,
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        tiltZ,
        0.05,
      );

      // Audio bounce: Scale from 1.0 to 1.05 based on audioLevel
      const baseScale = 2.0;
      const bounceScale = 1.0 + audioLevel * 0.05; // 0-5% scale increase
      const targetScale = baseScale * bounceScale;
      groupRef.current.scale.x = THREE.MathUtils.lerp(
        groupRef.current.scale.x,
        targetScale,
        0.1,
      );
      groupRef.current.scale.y = THREE.MathUtils.lerp(
        groupRef.current.scale.y,
        targetScale,
        0.1,
      );
      groupRef.current.scale.z = THREE.MathUtils.lerp(
        groupRef.current.scale.z,
        targetScale,
        0.1,
      );
    }

    // Update holographic material time and audio reactivity
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      materialRef.current.uAudio = THREE.MathUtils.lerp(
        materialRef.current.uAudio,
        audioLevel,
        0.1,
      ); // Smooth audio reactivity
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
        <div className="w-32 h-32 border-4 border-brushed-gold/30 border-t-brushed-gold rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-brushed-gold/60 font-sans text-xs">
            LOADING...
          </span>
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
  const [audioLevel, setAudioLevel] = useState(0); // For audio bounce effect
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulate subtle audio pulse for preview (in real implementation, this would come from audio context)
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(() => {
        // Subtle pulse animation (0.1 to 0.3)
        return Math.sin(Date.now() / 1000) * 0.1 + 0.2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          window.matchMedia("(orientation: portrait)").matches,
      );
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
              className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold uppercase tracking-tighter text-foreground"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              OWN THE
              <br />
              MASTER
            </motion.h2>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-base md:text-lg text-foreground/80 leading-relaxed max-w-lg"
            >
              The industry&apos;s most powerful remix suite. Isolate stems,
              command the mix, and reinvent every beat with professional-grade
              AI deconstruction.
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
                  className="relative px-8 py-4 md:px-12 md:py-6 text-black font-sans font-bold text-lg md:text-xl uppercase tracking-wider transform -rotate-1 hover:rotate-0 transition-transform shadow-hard border-2 border-black min-h-[60px] w-full md:w-auto overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #D4AF37 0%, #F4D03F 50%, #D4AF37 100%)",
                    backgroundSize: "200% 100%",
                    boxShadow:
                      "0 0 30px rgba(212, 175, 55, 0.5), 6px 6px 0px 0px rgba(0,0,0,1)",
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    boxShadow: [
                      "0 0 30px rgba(212, 175, 55, 0.5), 6px 6px 0px 0px rgba(0,0,0,1)",
                      "0 0 50px rgba(212, 175, 55, 0.8), 6px 6px 0px 0px rgba(0,0,0,1)",
                      "0 0 30px rgba(212, 175, 55, 0.5), 6px 6px 0px 0px rgba(0,0,0,1)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <span className="relative z-10">ENTER THE BOOTH →</span>
                </motion.button>
              </Link>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="font-sans text-xs md:text-sm text-brushed-gold/80"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              STUDIO_ENGINE: CONSOLE_ONLINE
            </motion.div>
          </div>

          {/* Right Side: 3D Turntable - Responsive container */}
          <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] order-1 lg:order-2">
            <Suspense fallback={<StudioSkeleton />}>
              <Canvas
                dpr={[1, 2]} // CRITICAL: Cap DPR at 2x to prevent mobile overheating
                camera={{ position: [0, 2, 8], fov: 50 }}
                className="w-full h-full"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  pointerEvents: "auto", // Only canvas has pointer events
                }}
              >
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1.2} />
                <pointLight
                  position={[-10, -10, -10]}
                  intensity={0.6}
                  color="#00ffff"
                />

                {/* Simplified scene on mobile */}
                {!isMobile ? (
                  <TurntableModel
                    mousePosition={mousePosition}
                    audioLevel={audioLevel}
                  />
                ) : (
                  // Mobile: Simplified version (no parallax, just rotation)
                  <TurntableModel
                    mousePosition={{ x: 0, y: 0 }}
                    audioLevel={audioLevel}
                  />
                )}
              </Canvas>
            </Suspense>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
