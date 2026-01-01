"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";

interface MobileDeckSwiperProps {
  deckA: ReactNode;
  deckB: ReactNode;
  activeDeck: "A" | "B";
  onDeckChange: (deck: "A" | "B") => void;
}

/**
 * MobileDeckSwiper - Heavy industrial snap transition between Console A and B
 *
 * Features:
 * - Gesture-driven swipe left/right to toggle decks
 * - Industrial "snap" transition with framer-motion
 * - Active deck indicator using border-toxic-lime
 * - Touch-optimized with passive event listeners
 * - Client-side only rendering to prevent hydration issues
 */
export function MobileDeckSwiper({
  deckA,
  deckB,
  activeDeck,
  onDeckChange,
}: MobileDeckSwiperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { triggerHaptic } = useHaptic();
  const x = useMotionValue(activeDeck === "A" ? 0 : -100);

  // Map x position to deck (0 = A, -100 = B)
  const deckIndex = useTransform(x, (latest) => (latest < -50 ? "B" : "A"));

  // Handle mount (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync x position with activeDeck prop changes
  useEffect(() => {
    if (isMounted) {
      x.set(activeDeck === "A" ? 0 : -100);
    }
  }, [activeDeck, isMounted, x]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 30; // Minimum drag distance to trigger switch
    const velocity = info.velocity.x;

    // Determine target deck based on drag direction and velocity
    let targetDeck: "A" | "B" = activeDeck;

    if (Math.abs(velocity) > 500) {
      // Fast swipe - switch based on velocity direction
      targetDeck = velocity < 0 ? "B" : "A";
    } else if (Math.abs(info.offset.x) > threshold) {
      // Slow drag - switch based on offset
      targetDeck = info.offset.x < 0 ? "B" : "A";
    } else {
      // Snap back to current deck
      targetDeck = activeDeck;
    }

    // Animate to target position
    x.set(targetDeck === "A" ? 0 : -100);

    // Trigger haptic feedback and update state
    if (targetDeck !== activeDeck) {
      triggerHaptic();
      onDeckChange(targetDeck);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-full h-full">{deckA}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden touch-none" style={{ touchAction: "none" }}>
      {/* Deck Container with Pan Gesture */}
      <motion.div
        className="flex w-[200%] h-full"
        style={{
          x,
        }}
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 0.8,
        }}
      >
        {/* Console A */}
        <div
          className={`w-1/2 h-full flex-shrink-0 border-2 transition-colors duration-200 ${
            activeDeck === "A" ? "border-toxic-lime" : "border-zinc-800"
          }`}
          style={{ borderRadius: 0 }}
        >
          {deckA}
        </div>

        {/* Console B */}
        <div
          className={`w-1/2 h-full flex-shrink-0 border-2 transition-colors duration-200 ${
            activeDeck === "B" ? "border-toxic-lime" : "border-zinc-800"
          }`}
          style={{ borderRadius: 0 }}
        >
          {deckB}
        </div>
      </motion.div>

      {/* Deck Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 pointer-events-none">
        <div
          className={`w-2 h-2 transition-all duration-200 ${
            activeDeck === "A" ? "bg-toxic-lime scale-125" : "bg-zinc-600"
          }`}
          style={{ borderRadius: 0 }}
        />
        <div
          className={`w-2 h-2 transition-all duration-200 ${
            activeDeck === "B" ? "bg-toxic-lime scale-125" : "bg-zinc-600"
          }`}
          style={{ borderRadius: 0 }}
        />
      </div>
    </div>
  );
}
