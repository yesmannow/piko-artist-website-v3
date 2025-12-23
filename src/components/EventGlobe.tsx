"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Event } from "@/lib/events";

// Convert lat/lng to 3D coordinates on a sphere
function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}

interface EventMarkerProps {
  event: Event;
  position: [number, number, number];
}

function EventMarker({ event, position }: EventMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Pulsing animation
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  const color = event.status === "upcoming" ? "#ff6600" : "#888888"; // safety-orange or tape-gray
  const dateStr = event.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <group position={position}>
      {/* Marker Sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Hover Tooltip */}
      {hovered && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.12}
          color="#ccff00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000"
        >
          {event.title}
          {"\n"}
          {dateStr}
        </Text>
      )}
    </group>
  );
}

function GlobeScene({ events }: { events: Event[] }) {
  const globeRef = useRef<THREE.Mesh>(null);

  // Auto-rotate
  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.005;
    }
  });

  // Convert events to 3D positions
  const eventPositions = useMemo(() => {
    return events.map((event) => ({
      event,
      position: latLngToVector3(event.coordinates[0], event.coordinates[1], 2.5),
    }));
  }, [events]);

  return (
    <>
      {/* Wireframe Globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial
          color="#ccff00"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Event Markers */}
      {eventPositions.map(({ event, position }) => (
        <EventMarker key={event.id} event={event} position={position} />
      ))}

      {/* Orbit Controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={4}
        maxDistance={8}
        autoRotate={false}
      />
    </>
  );
}

interface EventGlobeProps {
  events: Event[];
}

export function EventGlobe({ events }: EventGlobeProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <GlobeScene events={events} />
      </Canvas>
    </div>
  );
}

