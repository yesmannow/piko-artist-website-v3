"use client";

import { TourGlobe } from "@/components/tour/TourGlobe";
import { tourDates } from "@/lib/data";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function TourPage() {
  return (
    <div className="min-h-screen bg-[#121212]">

      {/* HERO: Interactive Globe */}
      <div className="relative w-full h-[60vh] md:h-[70vh] border-b border-zinc-800">
        <div className="absolute inset-0 bg-black">
          <TourGlobe />
        </div>

        {/* Title Overlay */}
        <div className="absolute top-0 left-0 p-8 md:p-12 pointer-events-none">
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter opacity-80">
            WORLD <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-500">TOUR</span>
          </h1>
          <p className="text-zinc-400 font-mono mt-2">Spin the globe to explore locations.</p>
        </div>
      </div>

      {/* LIST: Incoming Transmissions */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-[#ccff00] pl-4 uppercase">
          Incoming Transmissions
        </h2>
        <div className="grid gap-4">
          {tourDates.map((stop, i) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-900/50 border border-zinc-800 hover:border-[#ccff00] rounded-xl transition-all"
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex flex-col items-center justify-center w-20 h-20 bg-black rounded-lg border border-zinc-800 group-hover:border-[#ccff00] transition-colors">
                  <span className="text-xs text-zinc-500 font-bold uppercase">{stop.date.split(' ')[0]}</span>
                  <span className="text-2xl text-white font-black">{stop.date.split(' ')[1]}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-[#ccff00] transition-colors">{stop.city}</h3>
                  <p className="text-zinc-400 flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" /> {stop.venue}
                  </p>
                </div>
              </div>

              <a href={stop.ticketUrl} className="mt-4 md:mt-0 w-full md:w-auto px-8 py-4 bg-[#ccff00] text-black font-bold uppercase tracking-wider rounded-lg hover:bg-white transition-colors text-center">
                Get Tickets
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
