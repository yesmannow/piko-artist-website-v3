"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EventGlobe } from "@/components/tour/EventGlobe";
import { EventList } from "@/components/tour/EventList";
import { EventModalWrapper } from "@/components/tour/EventModal";
import { TimelineCarousel } from "@/components/tour/TimelineCarousel";
import { GlitchText } from "@/components/GlitchText";
import { events } from "@/lib/events";

export default function TourPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax transforms
  const globeY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const headerY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const tapeOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-x-hidden scroll-snap-y snap-y snap-mandatory">
      {/* SECTION 1: HERO GLOBE */}
      <section className="relative w-full h-[60vh] md:h-[70vh] border-b border-zinc-800 bg-black overflow-hidden snap-start scroll-snap-align-start">
        {/* Parallax Globe Container */}
        <motion.div
          style={{ y: globeY }}
          className="absolute inset-0 z-0"
        >
          <EventGlobe events={events} />
        </motion.div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none z-10" />

        {/* Title Overlay with Glitch */}
        <motion.div
          style={{ y: headerY }}
          className="absolute top-8 left-4 md:top-12 md:left-12 pointer-events-none z-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-header mb-4 text-foreground tracking-tighter">
              <GlitchText text="WORLD TOUR" delay={0.2} />
            </h1>
            <p className="text-zinc-400 font-mono mt-2 text-sm md:text-base bg-black/50 inline-block px-2 py-1 rounded backdrop-blur-sm">
              INTERACTIVE MAP: DRAG TO ROTATE • HOVER PINS FOR INTEL
            </p>
          </motion.div>
        </motion.div>

        {/* Duct Tape Texture - Parallax */}
        <motion.div
          style={{ opacity: tapeOpacity }}
          className="absolute top-20 right-8 md:top-32 md:right-16 w-24 h-6 md:w-32 md:h-8 bg-tape-gray opacity-80 pointer-events-none z-15"
        >
          <div className="w-full h-full bg-tape-gray border border-black/20" />
        </motion.div>
      </section>

      {/* SECTION 2: TIMELINE CAROUSEL */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-background relative snap-start scroll-snap-align-start">
        <div className="max-w-7xl mx-auto">
          {/* Section Header with Glitch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 md:mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-header text-foreground mb-4">
              <GlitchText text="CHRONOLOGICAL TIMELINE" delay={0.1} />
            </h2>
            <p className="text-foreground/70 font-industrial text-sm md:text-base uppercase tracking-wider">
              Navigate through events by year and month
            </p>
          </motion.div>

          {/* Timeline Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TimelineCarousel events={events} />
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: EVENT LIST */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-background relative snap-start scroll-snap-align-start">
        <div className="max-w-7xl mx-auto">
          {/* Section Header with Glitch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 md:mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-header text-foreground mb-4">
              <GlitchText text="INCOMING TRANSMISSIONS" delay={0.1} />
            </h2>
            <p className="text-foreground/70 font-industrial text-sm md:text-base uppercase tracking-wider">
              {events.filter((e) => e.status === "upcoming").length} EVENTS DETECTED
            </p>
          </motion.div>

          {/* Event List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EventList
              onEventClick={(event) => {
                // Globe fly-to is handled by Zustand store
                // The EventGlobe component listens to selectedEvent changes
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: ARCHIVED FOOTAGE */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-background relative scroll-mt-20 scroll-snap-start">
        <div className="max-w-7xl mx-auto">
          {/* Section Header with Glitch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 md:mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-header text-foreground mb-4">
              <GlitchText text="ARCHIVED FOOTAGE" delay={0.1} />
            </h2>
            <p className="text-foreground/70 font-industrial text-sm md:text-base uppercase tracking-wider">
              Past performances and events
            </p>
          </motion.div>
        </div>
      </section>

      {/* Event Modal */}
      <EventModalWrapper events={events} />

      {/* Custom Scrollbar Effect */}
      <style jsx global>{`
        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: hsl(var(--background));
        }
        ::-webkit-scrollbar-thumb {
          background: hsl(var(--toxic-lime));
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--spray-magenta));
        }

        /* Overscroll fade effect */
        body {
          overscroll-behavior-y: contain;
        }
      `}</style>
    </div>
  );
}
