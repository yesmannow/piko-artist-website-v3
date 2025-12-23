"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
}

export function SprayCursor() {
  const [particles, setParticles] = useState<Particle[]>();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);

  const colors = [
    "hsl(var(--neon-pink))",
    "hsl(var(--neon-green))",
    "hsl(var(--neon-cyan))",
  ];

  useEffect(() => {
    let moveTimeout: NodeJS.Timeout;
    let sprayInterval: NodeJS.Timeout;
    let particleId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      // Clear existing timeout
      clearTimeout(moveTimeout);

      // Set timeout to stop spawning particles
      moveTimeout = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    const spawnParticles = () => {
      if (!isMoving) return;

      const particleCount = Math.random() > 0.5 ? 2 : 3; // Random 2-3 particles per spawn
      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        // Random spread around cursor
        const spread = 15;
        const offsetX = (Math.random() - 0.5) * spread;
        const offsetY = (Math.random() - 0.5) * spread;

        newParticles.push({
          id: particleId++,
          x: mousePosition.x + offsetX,
          y: mousePosition.y + offsetY,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2, // Random size 2-6px
          velocityX: (Math.random() - 0.5) * 2, // Random horizontal drift
          velocityY: Math.random() * 2 + 1, // Downward gravity
        });
      }

      setParticles((prev) => {
        const updated = [...(prev || []), ...newParticles];
        // Keep only the last 100 particles for performance
        return updated.slice(-100);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Spawn particles at interval when moving
    sprayInterval = setInterval(spawnParticles, 30);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(moveTimeout);
      clearInterval(sprayInterval);
    };
  }, [isMoving, mousePosition]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {particles?.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: particle.x + particle.velocityX * 10,
              y: particle.y + particle.velocityY * 30, // Drip effect
              opacity: 0,
              scale: 0.5,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

