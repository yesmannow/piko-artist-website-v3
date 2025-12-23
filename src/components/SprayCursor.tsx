"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Drip {
  id: number;
  x: number;
  y: number;
  color: string;
  width: number;
  length: number;
  velocityX: number;
  velocityY: number;
}

export function SprayCursor() {
  const [drips, setDrips] = useState<Drip[]>();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const colorIndexRef = useRef(0);

  useEffect(() => {
    let moveTimeout: NodeJS.Timeout;
    // New "Street" palette colors
    const colors = [
      "#ff0099", // spray-magenta
      "#ccff00", // toxic-lime
      "#ff6600", // safety-orange
    ];

    let dripId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      // Clear existing timeout
      clearTimeout(moveTimeout);

      // Set timeout to stop spawning drips
      moveTimeout = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    const spawnDrips = () => {
      if (!isMoving) return;

      const dripCount = Math.random() > 0.6 ? 1 : 2; // Random 1-2 drips per spawn
      const newDrips: Drip[] = [];

      for (let i = 0; i < dripCount; i++) {
        // Random spread around cursor
        const spread = 12;
        const offsetX = (Math.random() - 0.5) * spread;
        const offsetY = (Math.random() - 0.5) * spread * 0.5; // Less vertical spread for drips

        // Cycle through colors
        const color = colors[colorIndexRef.current % colors.length];
        colorIndexRef.current++;

        newDrips.push({
          id: dripId++,
          x: mousePosition.x + offsetX,
          y: mousePosition.y + offsetY,
          color: color,
          width: Math.random() * 3 + 2, // Random width 2-5px
          length: Math.random() * 20 + 15, // Random length 15-35px for drip effect
          velocityX: (Math.random() - 0.5) * 1.5, // Minimal horizontal drift
          velocityY: Math.random() * 3 + 2, // Stronger downward gravity for drip
        });
      }

      setDrips((prev) => {
        const updated = [...(prev || []), ...newDrips];
        // Keep only the last 80 drips for performance
        return updated.slice(-80);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Spawn drips at interval when moving
    const sprayInterval = setInterval(spawnDrips, 40);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(moveTimeout);
      clearInterval(sprayInterval);
    };
  }, [isMoving, mousePosition]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {drips?.map((drip) => (
          <motion.div
            key={drip.id}
            initial={{
              x: drip.x,
              y: drip.y,
              opacity: 1,
              scaleY: 1,
            }}
            animate={{
              x: drip.x + drip.velocityX * 15,
              y: drip.y + drip.velocityY * 40, // Strong downward drip
              opacity: 0,
              scaleY: 1.5, // Stretch as it falls
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.2,
              ease: "easeIn",
            }}
            className="absolute origin-top"
            style={{
              width: `${drip.width}px`,
              height: `${drip.length}px`,
              backgroundColor: drip.color,
              borderRadius: `${drip.width / 2}px`,
              boxShadow: `0 0 ${drip.width * 1.5}px ${drip.color}, 0 0 ${drip.width * 3}px ${drip.color}`,
              // Create drip shape with gradient
              background: `linear-gradient(to bottom, ${drip.color}, ${drip.color}dd, ${drip.color}88)`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

