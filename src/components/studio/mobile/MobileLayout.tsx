"use client";

import { ReactNode, useEffect, useState } from "react";
import { MobileDeckSwiper } from "./MobileDeckSwiper";

interface MobileLayoutProps {
  children: ReactNode;
  vizComponent: ReactNode; // Holographic Viz + Transport
  deckA: ReactNode; // Console A (Cyan)
  deckB: ReactNode; // Console B (Magenta)
  controlSurface: ReactNode; // Crossfader + Filter Knobs
}

/**
 * MobileLayout - Vertical Scroll Snap layout for mobile (< 768px)
 *
 * Layout Stack:
 * - Top (Sticky): Holographic Viz + Transport (Always visible)
 * - Middle (The "Deck Swiper"): Gesture-controlled container
 * - Bottom (Sticky Control Surface): Crossfader + Filter Knobs
 */
export function MobileLayout({
  children,
  vizComponent,
  deckA,
  deckB,
  controlSurface,
}: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeDeck, setActiveDeck] = useState<"A" | "B">("A");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) {
    // Desktop: render children as-is
    return <>{children}</>;
  }

  return (
    <div
      className="h-screen overflow-y-scroll snap-y snap-mandatory overscroll-none"
      style={{
        scrollSnapType: "y mandatory",
        overscrollBehavior: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Top Section: Sticky Viz + Transport */}
      <section
        className="sticky top-0 z-20 h-screen snap-start flex-shrink-0"
        style={{ scrollSnapAlign: "start" }}
      >
        {vizComponent}
      </section>

      {/* Middle Section: Deck Swiper */}
      <section
        className="relative h-screen snap-start flex-shrink-0 flex items-center justify-center"
        style={{
          scrollSnapAlign: "start",
          touchAction: "none", // Prevent scroll interference during scratching
        }}
      >
        <MobileDeckSwiper
          deckA={deckA}
          deckB={deckB}
          activeDeck={activeDeck}
          onDeckChange={setActiveDeck}
        />
      </section>

      {/* Bottom Section: Sticky Control Surface */}
      <section
        className="sticky bottom-0 z-20 h-screen snap-start flex-shrink-0"
        style={{ scrollSnapAlign: "start" }}
      >
        {controlSurface}
      </section>
    </div>
  );
}

