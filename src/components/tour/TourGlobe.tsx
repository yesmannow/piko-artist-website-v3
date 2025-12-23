"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { TourDate, tourDates } from "@/lib/data";

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export function TourGlobe({ onCityClick }: { onCityClick?: (city: string) => void }) {
  const globeEl = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth > 768 ? window.innerWidth / 2 : window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ altitude: 2.5 });
    }
  }, []);

  // Generate arcs (flight paths)
  const arcsData = useMemo(() => {
    return tourDates.slice(0, -1).map((stop, i) => ({
      startLat: stop.lat,
      startLng: stop.lng,
      endLat: tourDates[i + 1].lat,
      endLng: tourDates[i + 1].lng,
      color: "#ccff00",
    }));
  }, []);

  return (
    <div className="w-full h-full">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="rgba(0,0,0,0)"
        // Atmosphere
        atmosphereColor="#ccff00"
        atmosphereAltitude={0.15}
        // Points (Cities)
        pointsData={tourDates}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => "#ccff00"}
        pointAltitude={0.02}
        pointRadius={0.5}
        pointsMerge={true}
        // Labels (City Names on Hover)
        labelsData={tourDates}
        labelLat="lat"
        labelLng="lng"
        labelText="city"
        labelSize={1.5}
        labelDotRadius={0.5}
        labelColor={() => "#ffffff"}
        labelResolution={2}
        // Arcs (Flight Paths)
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.5}
        // Auto-rotate
        autoRotate={true}
        autoRotateSpeed={0.5}
        // Interaction
        onPointClick={(point: any) => {
          const p = point as TourDate;
          if (globeEl.current) {
            globeEl.current.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.5 }, 1000);
          }
          if (onCityClick) onCityClick(p.city);
        }}
      />
    </div>
  );
}
