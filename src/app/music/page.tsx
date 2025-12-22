"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Player } from "@/components/Player";
import { SectionHeader } from "@/components/SectionHeader";

export default function MusicPage() {
  return (
    <div className="min-h-screen py-12 px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            ← Back to Home
          </Link>
          
          <SectionHeader 
            title="My Music" 
            subtitle="Roll the dice to discover random tracks from my collection"
          />

          <div className="max-w-3xl mx-auto">
            <Player />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
