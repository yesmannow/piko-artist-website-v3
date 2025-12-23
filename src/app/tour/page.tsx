"use client";

import { TourGlobe } from "@/components/tour/TourGlobe";
import { tourDates } from "@/lib/data";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function TourPage() {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#121212]">
      {/* Left Panel: Tour Dates List */}
      <div className="w-full md:w-1/2 h-screen overflow-y-auto p-6 md:p-12 z-10 bg-[#121212]/80 backdrop-blur-sm border-r border-zinc-800">
        <h1 className="text-4xl md:text-6xl font-header text-white mb-8 tracking-tight">
          WORLD <span className="text-toxic-lime">TOUR</span>
        </h1>

        <div className="space-y-4">
          {tourDates.map((stop, i) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-6 border border-zinc-800 hover:border-toxic-lime bg-zinc-900/50 rounded-xl transition-all duration-300 hover:bg-zinc-900/80"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-zinc-950 rounded-lg border border-zinc-800 group-hover:border-toxic-lime/50 transition-colors">
                    <span className="text-xs text-zinc-500 font-bold uppercase">
                      {stop.date.split(" ")[0]}
                    </span>
                    <span className="text-xl text-white font-bold">
                      {stop.date.split(" ")[1]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-toxic-lime transition-colors">
                      {stop.city}
                    </h3>
                    <p className="text-zinc-400 flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" /> {stop.venue}
                    </p>
                  </div>
                </div>

                <a
                  href={stop.ticketUrl}
                  className="px-6 py-3 bg-toxic-lime text-black font-bold uppercase text-sm rounded-lg hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  Tickets
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Panel: 3D Globe */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-screen relative bg-black">
        <div className="absolute inset-0">
          <TourGlobe />
        </div>
        {/* Gradient Overlay for seamless blending */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#121212] via-transparent to-transparent md:bg-gradient-to-l" />
      </div>
    </div>
  );
}
