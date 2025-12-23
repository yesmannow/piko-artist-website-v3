"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { Event } from "@/lib/events";
import { Move3D, Lock } from "lucide-react";

// Helper: Convert Lat/Lon to 3D Position
function latLonToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Component: Individual Event Marker
function EventMarker({
  event,
  radius,
  isSelected,
  onSelect,
}: {
  event: Event;
  radius: number;
  isSelected: boolean;
  onSelect: (e: Event) => void;
}) {
  const position = useMemo(() => {
    return latLonToVector3(event.coordinates[0], event.coordinates[1], radius);
  }, [event, radius]);

  const color = event.status === "upcoming" ? "#ccff00" : "#888888"; // toxic-lime vs tape-gray
  const dateStr = event.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* The Pin Mesh */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(event);
        }}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 2 : 0.5}
          toneMapped={false}
        />
      </mesh>

      {/* Pulse Effect for Upcoming */}
      {event.status === "upcoming" && (
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>
      )}

      {/* The Pop-up Card (HTML Overlay) */}
      {isSelected && (
        <Html distanceFactor={10} zIndexRange={[100, 0]}>
          <div className="w-48 bg-concrete border-2 border-toxic-lime p-3 shadow-hard transform -translate-x-1/2 -translate-y-full mt-[-10px] relative">
            <h3 className="font-header text-lg text-white leading-none mb-1">
              {event.title}
            </h3>
            <p className="font-industrial font-bold text-toxic-lime text-xs uppercase mb-1">
              {dateStr}
            </p>
            <p className="font-industrial text-gray-400 text-xs">
              {event.location}
            </p>
            {/* Little Triangle Pointer */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-toxic-lime rotate-45 border-b-2 border-r-2 border-black" />
          </div>
        </Html>
      )}
    </group>
  );
}

// Component: The Main Globe Scene
function GlobeScene({ events }: { events: Event[] }) {
  const globeRef = useRef<THREE.Group>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const GLOBE_RADIUS = 2.5;

  // Auto-rotation logic
  useFrame(() => {
    if (globeRef.current && !selectedId) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  return (
    <>
      <group ref={globeRef} onClick={() => setSelectedId(null)}>
        {/* Base Sphere (The Earth) - Solid Dark */}
        <Sphere args={[GLOBE_RADIUS, 64, 64]}>
          <meshStandardMaterial
            color="#2a2a2a"
            roughness={0.8}
            metalness={0.2}
          />
        </Sphere>

        {/* Atmosphere Glow */}
        <Sphere args={[GLOBE_RADIUS + 0.05, 64, 64]}>
          <meshBasicMaterial
            color="#ccff00"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* Wireframe Grid Overlay (Tactile Feel) */}
        <Sphere args={[GLOBE_RADIUS + 0.01, 32, 32]}>
          <meshBasicMaterial
            color="#333"
            wireframe
            transparent
            opacity={0.1}
          />
        </Sphere>

        {/* Render Markers */}
        {events.map((event) => (
          <EventMarker
            key={event.id}
            event={event}
            radius={GLOBE_RADIUS}
            isSelected={selectedId === event.id}
            onSelect={() => setSelectedId(event.id)}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
        rotateSpeed={0.5}
      />

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#ccff00" />
    </>
  );
}

interface EventGlobeProps {
  events: Event[];
}

export function EventGlobe({ events }: EventGlobeProps) {
  const [interactionEnabled, setInteractionEnabled] = useState(false);

  const toggleInteraction = () => {
    setInteractionEnabled((prev) => !prev);
  };

  return (
    <div className="w-full h-full relative">
      {/* Mobile interaction toggle button */}
      <button
        type="button"
        onClick={toggleInteraction}
        className={`
          absolute top-4 right-4 z-10
          px-3 py-2 rounded-lg
          border-2 border-black
          font-industrial font-bold text-xs
          flex items-center gap-2
          transition-all
          md:hidden
        `}
        style={{
          backgroundColor: interactionEnabled ? "#ccff00" : "#2a2a2a",
          color: interactionEnabled ? "#000" : "#ccff00",
          boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {interactionEnabled ? (
          <>
            <Move3D className="w-4 h-4" />
            DRAG TO SPIN
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            TAP TO UNLOCK
          </>
        )}
      </button>

      {/* Instruction Overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-10">
        <p className="font-industrial font-bold text-xs text-foreground/50 bg-black/50 px-2 py-1 rounded">
          DRAG TO ROTATE • TAP PINS FOR INFO
        </p>
      </div>

      <div
        className="w-full h-full"
        style={{
          // Block touch events on mobile unless explicitly enabled
          pointerEvents: interactionEnabled ? "auto" : "none",
        }}
      >
        {/* Re-enable on desktop */}
        <div className="w-full h-full hidden md:block" style={{ pointerEvents: "auto" }}>
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            style={{ width: "100%", height: "100%" }}
          >
            <GlobeScene events={events} />
          </Canvas>
        </div>

        {/* Mobile version - conditionally interactive */}
        <div className="w-full h-full md:hidden">
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            style={{ width: "100%", height: "100%", pointerEvents: interactionEnabled ? "auto" : "none" }}
          >
            <GlobeScene events={events} />
          </Canvas>
        </div>
      </div>
    </div>
  );
}
