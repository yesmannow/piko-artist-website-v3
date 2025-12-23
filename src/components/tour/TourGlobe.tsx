"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { TourDate, tourDates } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export function TourGlobe({ onCityClick }: { onCityClick?: (city: string) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl = useRef<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TourDate | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); // Init to 0 to prevent mismatch

  useEffect(() => {
    // Force client-side dimension calculation
    const updateSize = () => {
      const container = document.getElementById("globe-container");
      if (container) {
        setDimensions({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5 });
    }

    return () => {
      // CLEANUP: Kill the renderer to free GPU memory
      setDimensions({ width: 0, height: 0 }); // Force unmount
      setHoveredPoint(null); // Clear hover state
      // If the library exposes a destroy method, call it here
      if (globeEl.current) {
        try {
          // Try to dispose of the renderer if available
          const renderer = globeEl.current.renderer?.();
          if (renderer && typeof renderer.dispose === 'function') {
            renderer.dispose();
          }
        } catch {
          // Ignore errors if dispose is not available
        }
      }
    };
  }, []);

  const arcsData = useMemo(() => {
    return tourDates.slice(0, -1).map((stop, i) => ({
      startLat: stop.lat, startLng: stop.lng,
      endLat: tourDates[i + 1].lat, endLng: tourDates[i + 1].lng,
      color: "#ccff00"
    }));
  }, []);

  // Wrapper functions to handle type conversion from object to TourDate
  const handlePointHover = (point: object | null) => {
    setHoveredPoint(point as TourDate | null);
  };

  const handlePointClick = (point: object) => {
    const tourDate = point as TourDate;
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: tourDate.lat, lng: tourDate.lng, altitude: 1.5 }, 1000);
    }
    if (onCityClick) {
      onCityClick(tourDate.city);
    }
  };

  return (
    <div
      id="globe-container"
      className="w-full h-full relative cursor-move touch-pan-y"
    >
      {dimensions.width > 0 && (
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="#ccff00"
          atmosphereAltitude={0.15}
          pointsData={tourDates}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => "#ccff00"}
          pointAltitude={0.1} // Make pins taller
          pointRadius={0.5}
          pointsMerge={true}
          arcsData={arcsData}
          arcColor="color"
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={1500}
          onPointHover={handlePointHover}
          onPointClick={handlePointClick}
        />
      )}

      {/* Rich Tooltip Overlay */}
      <AnimatePresence>
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-4 right-4 md:top-8 md:right-8 w-72 bg-black/80 backdrop-blur-md border border-[#ccff00] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(204,255,0,0.2)] pointer-events-none z-10"
          >
            {hoveredPoint.image && (
              <div className="h-32 w-full relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hoveredPoint.image} alt={hoveredPoint.city} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-xl font-black text-white uppercase">{hoveredPoint.city}</h3>
              <p className="text-[#ccff00] font-mono text-xs mb-2">{hoveredPoint.date} • {hoveredPoint.venue}</p>
              <p className="text-zinc-400 text-sm leading-tight">{hoveredPoint.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
