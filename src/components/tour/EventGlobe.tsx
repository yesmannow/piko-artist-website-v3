"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Event } from "@/lib/events";
import { useEventStore } from "@/stores/useEventStore";
import { useGlobeCameraFlyTo, latLngToVector3 } from "@/hooks/useGlobeCameraFlyTo";
import { useEventTimezoneAmbientLight } from "@/hooks/useEventTimezoneAmbientLight";

interface EventGlobeProps {
  events: Event[];
}

// Re-export latLngToVector3 from hook (for backward compatibility)
export { latLngToVector3 };

// Event Marker Component
function EventMarker({ event, position }: { event: Event; position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const flyTo = useGlobeCameraFlyTo();
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const hoverEvent = useEventStore((state) => state.hoverEvent);
  const setSelectedEvent = useEventStore((state) => state.setSelectedEvent);
  const setHoverEvent = useEventStore((state) => state.setHoverEvent);
  const isSelected = selectedEvent?.id === event.id;
  const isHovered = hoverEvent?.id === event.id;
  const isUpcoming = event.status === "upcoming";

  // Pulse animation for upcoming events
  useFrame((state) => {
    if (!meshRef.current) return;
    if (isUpcoming && !isSelected) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.2;
      meshRef.current.scale.setScalar(scale);
    } else {
      meshRef.current.scale.setScalar(isSelected ? 1.5 : isHovered ? 1.2 : 1);
    }

    // Ring pulse animation for upcoming events
    if (ringRef.current && isUpcoming && !isSelected) {
      const time = state.clock.getElapsedTime();
      const pulseScale = 1 + Math.sin(time * 2) * 0.3;
      const pulseOpacity = 0.3 + Math.sin(time * 2) * 0.2;
      ringRef.current.scale.setScalar(pulseScale);
      if (ringRef.current.material) {
        (ringRef.current.material as THREE.MeshStandardMaterial).opacity = pulseOpacity;
      }
    }
  });

  const handleClick = () => {
    // First fly to location, then set selected event
    flyTo(event.lat, event.lng, 2.5);
    setTimeout(() => {
      setSelectedEvent(isSelected ? null : event);
    }, 500); // Small delay to let camera start moving
  };

  return (
    <group position={position}>
      {/* Marker Ring for upcoming events */}
      {isUpcoming && (
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
      )}

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
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={isUpcoming ? "#ccff00" : "#888888"}
          emissive={isSelected ? "#ccff00" : isHovered ? "#ccff00" : "#000000"}
          emissiveIntensity={isSelected ? 1 : isHovered ? 0.5 : 0}
        />
      </mesh>
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
  const selectedEvent = useEventStore((state) => state.selectedEvent);

  // Load Earth texture
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
  }, []);

  // Auto-rotate when no selection
  useFrame((state, delta) => {
    if (!meshRef.current || selectedEvent) return;
    meshRef.current.rotation.y += delta * 0.1;
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
  const flyTo = useGlobeCameraFlyTo();
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (!selectedEvent) {
      // Reset to default view
      targetRef.current = null;
      isAnimatingRef.current = true;
      return;
    }

    // Use hook for smooth fly-to
    flyTo(selectedEvent.lat, selectedEvent.lng, 2.5);
    const targetPos = latLngToVector3(selectedEvent.lat, selectedEvent.lng, 2.5);
    targetRef.current = targetPos;
    isAnimatingRef.current = true;
  }, [selectedEvent, flyTo]);

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

// Orbit Controls with auto-rotate based on selection
function AutoRotateOrbitControls() {
  const selectedEvent = useEventStore((state) => state.selectedEvent);

  return (
    <OrbitControls
      enableZoom={true}
      enablePan={false}
      minDistance={2}
      maxDistance={5}
      autoRotate={!selectedEvent}
      autoRotateSpeed={0.5}
    />
  );
}

export function EventGlobe({ events }: EventGlobeProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <CameraController />
        <AmbientLightController />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ccff00" />
        <Earth events={events} />
        <AutoRotateOrbitControls />
      </Canvas>
    </div>
  );
}

