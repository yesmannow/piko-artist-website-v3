"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Event } from "@/lib/events";
import { Move3D, Lock } from "lucide-react";

// Use dynamic import with ssr: false to prevent server-side crash
// react-globe.gl relies on browser APIs (window object) that don't exist during SSR
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// Home Base coordinates (Memphis, TN)
const HOME_BASE: [number, number] = [35.14, -90.04];

interface EventGlobeProps {
  events: Event[];
}

// Type definitions for react-globe.gl callbacks
interface PointData {
  lat: number;
  lng: number;
  event: Event;
}

export function EventGlobe({ events }: EventGlobeProps) {
  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Prepare points data for the globe
  const pointsData = useMemo(() => {
    return events.map((event) => ({
      lat: event.coordinates[0],
      lng: event.coordinates[1],
      event,
    }));
  }, [events]);

  // Prepare arcs data (from home base to each event)
  const arcsData = useMemo(() => {
    return events
      .filter((event) => event.status === "upcoming") // Only show arcs for upcoming events
      .map((event) => ({
        startLat: HOME_BASE[0],
        startLng: HOME_BASE[1],
        endLat: event.coordinates[0],
        endLng: event.coordinates[1],
        event,
      }));
  }, [events]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full h-full relative">
      {/* Mobile interaction toggle button */}
      <button
        type="button"
        onClick={() => setInteractionEnabled((prev) => !prev)}
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

      {/* Tooltip */}
      {(hoveredEvent || selectedEvent) && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ display: hoveredEvent || selectedEvent ? "block" : "none" }}
        >
          <div className="bg-concrete border-2 border-toxic-lime p-3 shadow-hard">
            <h3 className="font-header text-lg text-white leading-none mb-1">
              {(hoveredEvent || selectedEvent)?.title}
            </h3>
            <p className="font-industrial font-bold text-toxic-lime text-xs uppercase mb-1">
              {formatDate((hoveredEvent || selectedEvent)!.date)}
            </p>
            <p className="font-industrial text-gray-400 text-xs">
              {(hoveredEvent || selectedEvent)?.location}
            </p>
            {/* Little Triangle Pointer */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-toxic-lime rotate-45 border-b-2 border-r-2 border-black" />
          </div>
        </div>
      )}

      <div
        className="w-full h-full"
        style={{
          pointerEvents: interactionEnabled ? "auto" : "none",
        }}
      >
        {/* Desktop version - always interactive */}
        <div className="w-full h-full hidden md:block">
          <Globe
            // TODO: Replace with local texture at /images/textures/earth-dark.jpg for better stability
            // Currently using unpkg CDN - download earth-dark.jpg and place in public/images/textures/
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            backgroundColor="rgba(0,0,0,0)"
            atmosphereColor="#ccff00"
            atmosphereAltitude={0.15}
            pointsData={pointsData}
            pointColor={() => "#ccff00"}
            pointRadius={0.5}
            pointResolution={8}
            pointLabel={(d: object) => {
              const pointData = d as PointData;
              const event = pointData.event;
              return `${event.title}\n${formatDate(event.date)}`;
            }}
            onPointHover={(point: object | null) => {
              if (point) {
                const pointData = point as PointData;
                setHoveredEvent(pointData.event);
              } else {
                setHoveredEvent(null);
              }
            }}
            onPointClick={(point: object | null) => {
              if (point) {
                const pointData = point as PointData;
                setSelectedEvent(pointData.event);
                setHoveredEvent(null);
              } else {
                setSelectedEvent(null);
              }
            }}
            htmlElementsData={pointsData}
            htmlElement={(d: object) => {
              const pointData = d as PointData;
              const event = pointData.event;
              const isUpcoming = event.status === "upcoming";
              const isSelected = selectedEvent?.id === event.id;
              const isHovered = hoveredEvent?.id === event.id;

              const div = document.createElement("div");
              div.style.width = isSelected || isHovered ? "16px" : "12px";
              div.style.height = isSelected || isHovered ? "16px" : "12px";
              div.style.borderRadius = "50%";
              div.style.backgroundColor = isUpcoming ? "#ccff00" : "#888888";
              div.style.border = "2px solid #000";
              div.style.boxShadow = isSelected
                ? "0 0 12px #ccff00, 0 0 20px #ccff00"
                : isHovered
                ? "0 0 8px #ccff00"
                : "none";
              div.style.transition = "all 0.2s ease";
              div.style.cursor = "pointer";
              div.style.zIndex = isSelected ? "10" : "1";

              // Pulse animation for upcoming events
              if (isUpcoming && !isSelected) {
                div.style.animation = "pulse 2s ease-in-out infinite";
              }

              return div;
            }}
            arcsData={arcsData}
            arcColor={() => "#ccff00"}
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={2000}
            arcStroke={0.5}
            enablePointerInteraction={true}
            {...({ autoRotate: !selectedEvent, autoRotateSpeed: 0.5 } as Record<string, unknown>)}
          />
        </div>

        {/* Mobile version - conditionally interactive */}
        <div className="w-full h-full md:hidden">
          <Globe
            // TODO: Replace with local texture at /images/textures/earth-dark.jpg for better stability
            // Currently using unpkg CDN - download earth-dark.jpg and place in public/images/textures/
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            backgroundColor="rgba(0,0,0,0)"
            atmosphereColor="#ccff00"
            atmosphereAltitude={0.15}
            pointsData={pointsData}
            pointColor={() => "#ccff00"}
            pointRadius={0.5}
            pointResolution={8}
            pointLabel={(d: object) => {
              const pointData = d as PointData;
              const event = pointData.event;
              return `${event.title}\n${formatDate(event.date)}`;
            }}
            onPointHover={(point: object | null) => {
              if (interactionEnabled && point) {
                const pointData = point as PointData;
                setHoveredEvent(pointData.event);
              } else {
                setHoveredEvent(null);
              }
            }}
            onPointClick={(point: object | null) => {
              if (interactionEnabled && point) {
                const pointData = point as PointData;
                setSelectedEvent(pointData.event);
                setHoveredEvent(null);
              } else {
                setSelectedEvent(null);
              }
            }}
            htmlElementsData={pointsData}
            htmlElement={(d: object) => {
              const pointData = d as PointData;
              const event = pointData.event;
              const isUpcoming = event.status === "upcoming";
              const isSelected = selectedEvent?.id === event.id;
              const isHovered = hoveredEvent?.id === event.id;

              const div = document.createElement("div");
              div.style.width = isSelected || isHovered ? "16px" : "12px";
              div.style.height = isSelected || isHovered ? "16px" : "12px";
              div.style.borderRadius = "50%";
              div.style.backgroundColor = isUpcoming ? "#ccff00" : "#888888";
              div.style.border = "2px solid #000";
              div.style.boxShadow = isSelected
                ? "0 0 12px #ccff00, 0 0 20px #ccff00"
                : isHovered
                ? "0 0 8px #ccff00"
                : "none";
              div.style.transition = "all 0.2s ease";
              div.style.cursor = "pointer";
              div.style.zIndex = isSelected ? "10" : "1";

              // Pulse animation for upcoming events
              if (isUpcoming && !isSelected) {
                div.style.animation = "pulse 2s ease-in-out infinite";
              }

              return div;
            }}
            arcsData={arcsData}
            arcColor={() => "#ccff00"}
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={2000}
            arcStroke={0.5}
            enablePointerInteraction={interactionEnabled}
            {...({ autoRotate: !selectedEvent && interactionEnabled, autoRotateSpeed: 0.5 } as Record<string, unknown>)}
          />
        </div>
      </div>
    </div>
  );
}
