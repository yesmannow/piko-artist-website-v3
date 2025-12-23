"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { ProSequencer } from "@/components/ProSequencer";
import { GraffitiCanvas } from "@/components/GraffitiCanvas";
import { GlitchText } from "@/components/GlitchText";

function BeatMakerContent() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
          {/* PRO STUDIO Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-graffiti mb-4 md:mb-8 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
              <GlitchText text="PRO STUDIO" />
            </h1>
            <p className="text-center text-white/60 font-tag text-lg md:text-xl mb-12">
              Professional Beat Making Environment
            </p>
            <ProSequencer />
          </motion.div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neon-green/30"></div>
            </div>
            <div className="relative flex justify-center">
              <h2 className="text-2xl md:text-3xl font-graffiti bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent px-4 bg-background">
                <GlitchText text="MAKE YOUR MARK" />
              </h2>
            </div>
          </div>

          {/* TAG THE WALL Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl font-graffiti mb-4 md:mb-8 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
              <GlitchText text="TAG THE WALL" />
            </h1>
            <p className="text-center text-white/60 font-tag text-lg md:text-xl mb-12">
              Leave your mark • Spray paint the canvas
            </p>
            <GraffitiCanvas />
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default function BeatMakerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BeatMakerContent />
    </Suspense>
  );
}

