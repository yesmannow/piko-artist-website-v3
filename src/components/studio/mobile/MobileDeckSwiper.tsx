"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MobileDeckSwiperProps {
  deckA: React.ReactNode;
  deckB: React.ReactNode;
  activeDeck: "A" | "B";
  onDeckChange: (deck: "A" | "B") => void;
}

/**
 * MobileDeckSwiper - Expert-level "Swiper/Stack" Hybrid Interface
 *
 * Replaces the grid layout on mobile with a heavy, industrial gesture container
 * that snaps between Console A and Console B with blur effects and haptic feedback.
 */
export function MobileDeckSwiper({
  deckA,
  deckB,
  activeDeck,
  onDeckChange,
}: MobileDeckSwiperProps) {
  const [direction, setDirection] = useState(0);

  // Swipe threshold needed to trigger a change
  const swipeConfidenceThreshold = 10000;

  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      // Swiped Left -> Go to B
      if (activeDeck === "A") {
        setDirection(1);
        onDeckChange("B");
      }
    } else if (swipe > swipeConfidenceThreshold) {
      // Swiped Right -> Go to A
      if (activeDeck === "B") {
        setDirection(-1);
        onDeckChange("A");
      }
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
    }),
  };

  return (
    <div className="relative w-full overflow-hidden flex flex-col gap-2">
      {/* Console Indicator Tabs */}
      <div className="flex justify-center items-center gap-4 mb-2">
        <button
          onClick={() => {
            setDirection(-1);
            onDeckChange("A");
          }}
          className={`text-xs font-black italic uppercase tracking-wider px-4 py-2 border-b-2 transition-all min-h-[44px] min-w-[44px] ${
            activeDeck === "A"
              ? "text-[#00d9ff] border-[#00d9ff]"
              : "text-zinc-600 border-transparent"
          }`}
        >
          CONSOLE_A
        </button>

        {/* Swipe Hint Arrow */}
        <div className="text-zinc-700">
          {activeDeck === "A" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </div>

        <button
          onClick={() => {
            setDirection(1);
            onDeckChange("B");
          }}
          className={`text-xs font-black italic uppercase tracking-wider px-4 py-2 border-b-2 transition-all min-h-[44px] min-w-[44px] ${
            activeDeck === "B"
              ? "text-[#ff00d9] border-[#ff00d9]"
              : "text-zinc-600 border-transparent"
          }`}
        >
          CONSOLE_B
        </button>
      </div>

      {/* The Swiper Container */}
      <div className="relative w-full aspect-square md:aspect-[4/3] bg-[#050505] border-y-2 border-zinc-900">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeDeck}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full touch-pan-y"
            style={{ touchAction: "none" }}
          >
            {/* Render the Active Deck
              We wrap it in a container that prevents vertical scroll propagation
              if the user is actively scratching
            */}
            <div className="w-full h-full p-4 flex items-center justify-center">
              {activeDeck === "A" ? deckA : deckB}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Haptic "Underglow" Feedback */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 transition-colors duration-300"
        style={{
          background: activeDeck === "A" ? "#00d9ff" : "#ff00d9",
          boxShadow: `0 0 20px ${activeDeck === "A" ? "#00d9ff" : "#ff00d9"}`,
        }}
      />
    </div>
  );
}

