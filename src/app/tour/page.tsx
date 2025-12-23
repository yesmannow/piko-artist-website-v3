"use client";

import { TourGlobe } from "@/components/tour/TourGlobe";
import { tourDates } from "@/lib/data";
import { motion } from "framer-motion";
import { MapPin, Ticket } from "lucide-react";

export default function TourPage() {
  return (
    <div className="min-h-screen bg-[#121212]">
      {/* SECTION 1: HERO GLOBE (Fixed Height = No Glitch) */}
      <div className="relative w-full h-[60vh] md:h-[70vh] border-b border-zinc-800 bg-black overflow-hidden group">

        {/* The 3D Canvas */}
        <div className="absolute inset-0 z-0">
          <TourGlobe />
        </div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent pointer-events-none z-10" />

        {/* Title Overlay */}
        <div className="absolute top-8 left-4 md:top-12 md:left-12 pointer-events-none z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter opacity-90 drop-shadow-2xl">
              WORLD <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-500">TOUR</span>
            </h1>
            <p className="text-zinc-400 font-mono mt-2 text-sm md:text-base bg-black/50 inline-block px-2 py-1 rounded backdrop-blur-sm">
              INTERACTIVE MAP: DRAG TO ROTATE • HOVER PINS FOR INTEL
            </p>
          </motion.div>
        </div>
      </div>

      {/* SECTION 2: EVENT LIST */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
              <span className="w-3 h-3 bg-[#ccff00] rounded-full animate-pulse"/>
              Incoming Transmissions
            </h2>
            <span className="text-zinc-500 font-mono text-sm hidden md:block">{tourDates.length} EVENTS DETECTED</span>
        </div>

        <div className="grid gap-4">
          {tourDates.map((stop, i) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-900/40 border border-zinc-800/50 hover:border-[#ccff00] hover:bg-zinc-900/80 rounded-xl transition-all duration-300"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ccff00]/0 via-[#ccff00]/5 to-[#ccff00]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl" />

              <div className="flex items-center gap-6 w-full md:w-auto relative z-10">
                {/* Date Box */}
                <div className="flex flex-col items-center justify-center w-20 h-20 bg-black rounded-lg border border-zinc-800 group-hover:border-[#ccff00] transition-colors shadow-lg">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stop.date.split(' ')[0]}</span>
                  <span className="text-2xl text-white font-black">{stop.date.split(' ')[1]}</span>
                </div>

                {/* Event Info */}
                <div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-[#ccff00] transition-colors">{stop.city}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {stop.venue}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <a
                href={stop.ticketUrl}
                className="relative z-10 mt-4 md:mt-0 w-full md:w-auto px-8 py-4 bg-[#ccff00] text-black font-black uppercase tracking-widest text-xs rounded-lg hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(204,255,0,0.1)] hover:shadow-[0_0_30px_rgba(204,255,0,0.4)] flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                Get Tickets
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
