"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Event } from "@/lib/events";
import { useEventStore } from "@/stores/useEventStore";
import { useGlobeCameraFlyTo, latLngToVector3 } from "@/hooks/useGlobeCameraFlyTo";
import { useEventTimezoneAmbientLight } from "@/hooks/useEventTimezoneAmbientLight";
import { useMotionValue } from "framer-motion";

interface EventGlobeProps {
  events: Event[];
}

// Re-export latLngToVector3 from hook (for backward compatibility)
export { latLngToVector3 };

// Event Marker Component
function EventMarker({ event, position }: { event: Event; position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const flyTo = useGlobeCameraFlyTo();
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const hoverEvent = useEventStore((state) => state.hoverEvent);
  const setSelectedEvent = useEventStore((state) => state.setSelectedEvent);
  const setHoverEvent = useEventStore((state) => state.setHoverEvent);
  const setIsFlying = useEventStore((state) => state.setIsFlying);
  const isSelected = selectedEvent?.id === event.id;
  const isHovered = hoverEvent?.id === event.id;
  const isUpcoming = event.status === "upcoming";

  // Enhanced pulse animation for upcoming events
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    if (isUpcoming && !isSelected) {
      // Enhanced pulsing scale with smoother animation
      const scale = 1 + Math.sin(time * 2.5) * 0.25;
      meshRef.current.scale.setScalar(scale);
    } else {
      meshRef.current.scale.setScalar(isSelected ? 1.5 : isHovered ? 1.2 : 1);
    }

    // Enhanced ring pulse animation for upcoming events
    if (ringRef.current && isUpcoming && !isSelected) {
      const pulseScale = 1 + Math.sin(time * 2.5) * 0.4;
      const pulseOpacity = 0.2 + Math.sin(time * 2.5) * 0.3;
      ringRef.current.scale.setScalar(pulseScale);
      if (ringRef.current.material) {
        (ringRef.current.material as THREE.MeshStandardMaterial).opacity = pulseOpacity;
        // Pulsing emissive intensity
        (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + Math.sin(time * 2.5) * 0.3;
      }
    }

    // Enhanced glow effect for upcoming events
    if (glowRef.current && isUpcoming && !isSelected) {
      const glowScale = 1.2 + Math.sin(time * 2.5) * 0.3;
      const glowOpacity = 0.1 + Math.sin(time * 2.5) * 0.15;
      glowRef.current.scale.setScalar(glowScale);
      if (glowRef.current.material) {
        (glowRef.current.material as THREE.MeshStandardMaterial).opacity = glowOpacity;
        (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + Math.sin(time * 2.5) * 0.2;
      }
    }
  });

  const handleClick = () => {
    if (isSelected) {
      // Deselect immediately if already selected
      setSelectedEvent(null);
      return;
    }

    // Set flying state and fly to location
    setIsFlying(true);
    flyTo(event.lat, event.lng, 2.5);

    // Wait for camera animation to complete before opening modal
    setTimeout(() => {
      setSelectedEvent(event);
      // Clear flying state after a short delay
      setTimeout(() => setIsFlying(false), 300);
    }, 1200); // Match the fly-to animation duration
  };

  return (
    <group position={position}>
      {/* Enhanced pulsing ring for upcoming events */}
      {isUpcoming && (
        <>
          <mesh ref={ringRef}>
            <ringGeometry args={[0.08, 0.12, 32]} />
            <meshStandardMaterial
              color="#ccff00"
              transparent
              opacity={0.3}
              emissive="#ccff00"
              emissiveIntensity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Outer glow ring for upcoming events */}
          <mesh ref={glowRef}>
            <ringGeometry args={[0.12, 0.18, 32]} />
            <meshStandardMaterial
              color="#ccff00"
              transparent
              opacity={0.15}
              emissive="#ccff00"
              emissiveIntensity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* Neon Tag/Spray Marker - Urban Style */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoverEvent(event);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoverEvent(null);
        }}
      >
        {/* Main marker - spray paint dot style */}
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={isUpcoming ? "#ccff00" : isSelected ? "#ccff00" : "#888888"}
          emissive={isSelected ? "#ccff00" : isHovered ? "#ccff00" : isUpcoming ? "#ccff00" : "#000000"}
          emissiveIntensity={isSelected ? 1.5 : isHovered ? 1 : isUpcoming ? 0.8 : 0}
        />
      </mesh>

      {/* Spray paint splatter effect on hover/click */}
      {(isHovered || isSelected) && (
        <group>
          {/* Spray particles */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 0.08 + Math.random() * 0.04;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * distance,
                  Math.sin(angle) * distance * 0.5,
                  Math.sin(angle * 2) * distance * 0.3,
                ]}
              >
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshStandardMaterial
                  color="#ccff00"
                  emissive="#ccff00"
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            );
          })}
        </group>
      )}
      {/* Glow effect for selected/hovered */}
      {(isSelected || isHovered) && (
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color={isUpcoming ? "#ccff00" : "#888888"}
            transparent
            opacity={0.3}
            emissive="#ccff00"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
      {/* HTML label for hover/selected */}
      {(isHovered || isSelected) && (
        <Html distanceFactor={10} center>
          <div className="bg-concrete border-2 border-toxic-lime p-2 shadow-hard pointer-events-none">
            <div className="font-header text-sm text-white leading-none mb-1">{event.title}</div>
            <div className="font-industrial font-bold text-toxic-lime text-xs uppercase">
              {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="font-industrial text-gray-400 text-xs">{event.location}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Earth Sphere Component
function Earth({ events }: { events: Event[] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const noiseTextureRef = useRef<THREE.Texture | null>(null);
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const isFlying = useEventStore((state) => state.isFlying);
  const [hoverIntensity, setHoverIntensity] = useState(0);

  // Load Earth texture and create noise texture for glitch effect
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      "//unpkg.com/three-globe/example/img/earth-dark.jpg",
      (texture) => {
        textureRef.current = texture;
        if (meshRef.current) {
          (meshRef.current.material as THREE.MeshStandardMaterial).map = texture;
          (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.warn("Failed to load Earth texture:", error);
      }
    );

    // Create procedural noise texture for glitch effect
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imageData = ctx.createImageData(256, 256);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = Math.random() * 255;
        imageData.data[i] = noise;     // R
        imageData.data[i + 1] = noise; // G
        imageData.data[i + 2] = noise; // B
        imageData.data[i + 3] = 50;    // A (low opacity)
      }
      ctx.putImageData(imageData, 0, 0);
      const noiseTexture = new THREE.CanvasTexture(canvas);
      noiseTexture.wrapS = THREE.RepeatWrapping;
      noiseTexture.wrapT = THREE.RepeatWrapping;
      noiseTextureRef.current = noiseTexture;
    }
  }, []);

  // Handle mouse hover for interactive rotation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (selectedEvent || isFlying) return;
      const container = document.querySelector('[data-globe-container]');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from center (0-1)
      const deltaX = (e.clientX - centerX) / rect.width;
      const deltaY = (e.clientY - centerY) / rect.height;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Set hover intensity based on distance from center
      setHoverIntensity(Math.max(0, 1 - distance * 2));
    };

    const handleMouseLeave = () => {
      setHoverIntensity(0);
    };

    const container = document.querySelector('[data-globe-container]');
    if (container) {
      container.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [selectedEvent, isFlying]);

  // Auto-rotate when no selection, with hover-based adjustment and glitch effect
  useFrame((state, delta) => {
    if (!meshRef.current || selectedEvent || isFlying) return;

    // Base rotation speed with occasional glitch
    const time = state.clock.getElapsedTime();
    const glitchIntensity = Math.sin(time * 0.5) * 0.02; // Subtle glitch variation
    const baseSpeed = 0.1 + glitchIntensity;

    // Adjust rotation based on hover (slower when hovering)
    const adjustedSpeed = baseSpeed * (1 - hoverIntensity * 0.5);
    meshRef.current.rotation.y += delta * adjustedSpeed;

    // Apply noise texture overlay for glitch effect when rotating
    if (meshRef.current.material && noiseTextureRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      // Subtle noise overlay that pulses with rotation
      const noiseOpacity = 0.05 + Math.abs(glitchIntensity) * 0.1;
      if (material.emissiveMap !== noiseTextureRef.current) {
        material.emissiveMap = noiseTextureRef.current;
        material.emissiveIntensity = noiseOpacity;
        material.needsUpdate = true;
      } else {
        material.emissiveIntensity = noiseOpacity;
      }
    }
  });

  // Calculate marker positions
  const markerPositions = useMemo(() => {
    return events.map((event) => latLngToVector3(event.lat, event.lng, 1.01));
  }, [events]);

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial />
      </mesh>
      {/* Event Markers */}
      {events.map((event, index) => (
        <EventMarker key={event.id} event={event} position={markerPositions[index]} />
      ))}
    </group>
  );
}

// Camera Controller for fly-to animation (now uses hook)
function CameraController() {
  const { camera } = useThree();
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const pendingEvent = useEventStore((state) => state.pendingEvent);
  const setSelectedEvent = useEventStore((state) => state.setSelectedEvent);
  const setPendingEvent = useEventStore((state) => state.setPendingEvent);
  const setIsFlying = useEventStore((state) => state.setIsFlying);
  const flyTo = useGlobeCameraFlyTo();
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const isAnimatingRef = useRef(false);

  // Handle pending events (from EventList clicks)
  useEffect(() => {
    if (pendingEvent) {
      setIsFlying(true);
      flyTo(pendingEvent.lat, pendingEvent.lng, 2.5);
      const targetPos = latLngToVector3(pendingEvent.lat, pendingEvent.lng, 2.5);
      targetRef.current = targetPos;
      isAnimatingRef.current = true;

      // Clear pending and set selected after animation
      setTimeout(() => {
        setSelectedEvent(pendingEvent);
        setPendingEvent(null);
        setTimeout(() => setIsFlying(false), 300);
      }, 1200); // Match fly-to duration
    }
  }, [pendingEvent, flyTo, setSelectedEvent, setPendingEvent, setIsFlying]);

  useEffect(() => {
    if (!selectedEvent && !pendingEvent) {
      // Reset to default view
      targetRef.current = null;
      isAnimatingRef.current = true;
      return;
    }

    // If selectedEvent is set directly (from marker click), fly to it
    if (selectedEvent && !pendingEvent) {
      flyTo(selectedEvent.lat, selectedEvent.lng, 2.5);
      const targetPos = latLngToVector3(selectedEvent.lat, selectedEvent.lng, 2.5);
      targetRef.current = targetPos;
      isAnimatingRef.current = true;
    }
  }, [selectedEvent, pendingEvent, flyTo]);

  useFrame((state, delta) => {
    if (!targetRef.current) {
      // Smooth return to default
      const defaultPos = new THREE.Vector3(0, 0, 3);
      camera.position.lerp(defaultPos, delta * 2);
      camera.lookAt(0, 0, 0);
      if (camera.position.distanceTo(defaultPos) < 0.01) {
        isAnimatingRef.current = false;
      }
      return;
    }

    if (isAnimatingRef.current) {
      // Fly to target
      const lookAt = latLngToVector3(selectedEvent!.lat, selectedEvent!.lng, 1.01);
      camera.position.lerp(targetRef.current, delta * 2);
      camera.lookAt(lookAt);

      if (camera.position.distanceTo(targetRef.current) < 0.01) {
        isAnimatingRef.current = false;
      }
    }
  });

  return null;
}

// Ambient Light Controller (adjusts based on timezone)
function AmbientLightController() {
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const lightRef = useRef<THREE.AmbientLight>(null);
  const lightConfig = useEventTimezoneAmbientLight(selectedEvent);

  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.intensity = lightConfig.intensity;
    lightRef.current.color = lightConfig.color;
  });

  return <ambientLight ref={lightRef} intensity={lightConfig.intensity} color={lightConfig.color} />;
}

// Orbit Controls with auto-rotate based on selection and interaction
function AutoRotateOrbitControls() {
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const isFlying = useEventStore((state) => state.isFlying);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Disable auto-rotate when user is interacting
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => setIsInteracting(true);
    const handleEnd = () => {
      // Delay re-enabling auto-rotate slightly after interaction ends
      setTimeout(() => setIsInteracting(false), 2000);
    };

    // Listen to control events
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      minDistance={2}
      maxDistance={5}
      autoRotate={!selectedEvent && !isFlying && !isInteracting}
      autoRotateSpeed={0.5}
    />
  );
}

// Scroll-based camera controller
function ScrollCameraController() {
  const { camera } = useThree();
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const isFlying = useEventStore((state) => state.isFlying);
  const scrollY = useMotionValue(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (selectedEvent || isFlying) return;
      const currentScroll = window.scrollY;
      scrollY.set(currentScroll);
      lastScrollY.current = currentScroll;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedEvent, isFlying, scrollY]);

  useFrame(() => {
    if (selectedEvent || isFlying) return;

    const currentScroll = scrollY.get();
    const scrollProgress = Math.min(currentScroll / 1000, 1); // Normalize to 0-1
    const zoomFactor = 1 + scrollProgress * 0.3; // Zoom in up to 30% on scroll

    // Smoothly adjust camera distance
    const targetDistance = 3 / zoomFactor;
    const currentDistance = camera.position.length();
    const newDistance = currentDistance + (targetDistance - currentDistance) * 0.05;

    if (newDistance > 0) {
      camera.position.normalize().multiplyScalar(newDistance);
    }
  });

  return null;
}

export function EventGlobe({ events }: EventGlobeProps) {
  return (
    <div className="w-full h-full" data-globe-container>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <CameraController />
        <ScrollCameraController />
        <AmbientLightController />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ccff00" />
        <Earth events={events} />
        <AutoRotateOrbitControls />
      </Canvas>
    </div>
  );
}

