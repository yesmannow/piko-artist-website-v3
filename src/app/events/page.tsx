"use client";

import { motion } from "framer-motion";
import { EventGlobe } from "@/components/EventGlobe";
import { EventList } from "@/components/EventList";
import { BookingForm } from "@/components/BookingForm";
import { GlitchText } from "@/components/GlitchText";
import { events } from "@/lib/events";

export default function EventsPage() {
  return (
    <div className="min-h-screen py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-header mb-4 text-foreground">
            <GlitchText text="WORLD TOUR" />
          </h1>
          <p className="text-lg md:text-xl font-tag text-foreground/70">
            Live performances across the globe
          </p>
        </motion.div>

        {/* 3D Globe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 md:mb-16 relative"
        >
          <div
            className="bg-zinc-900 border-2 border-black shadow-hard relative h-[350px] md:h-[500px]"
            style={{
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-20 z-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
                mixBlendMode: "overlay",
              }}
            />
            <div className="relative z-0">
              <EventGlobe events={events} />
            </div>
          </div>
        </motion.div>

        {/* Event List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12 md:mb-16"
        >
          <EventList />
        </motion.div>

        {/* Booking Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <BookingForm />
        </motion.div>
      </div>
    </div>
  );
}

