"use client";

import { motion } from "framer-motion";
import { ProSequencer } from "@/components/ProSequencer";
import { GlitchText } from "@/components/GlitchText";

export default function BeatMakerPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 px-8">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </section>
    </div>
  );
}

