"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Player } from "@/components/Player";
import { SectionHeader } from "@/components/SectionHeader";
import { Music } from "lucide-react";

// Sample tracks - in production, these would come from R2
const tracks = [
  {
    id: "1",
    title: "Midnight Dreams",
    url: "/audio/track1.mp3", // R2 URL placeholder
  },
  {
    id: "2",
    title: "Urban Sunrise",
    url: "/audio/track2.mp3", // R2 URL placeholder
  },
  {
    id: "3",
    title: "Electric Pulse",
    url: "/audio/track3.mp3", // R2 URL placeholder
  },
];

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
            subtitle="High-quality audio tracks streamed from Cloudflare R2"
          />

          <div className="grid gap-6 mb-12">
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Player audioUrl={track.url} title={track.title} />
              </motion.div>
            ))}
          </div>

          <div className="bg-card p-8 rounded-lg border text-center">
            <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">More Coming Soon</h3>
            <p className="text-muted-foreground">
              Stay tuned for new releases and exclusive tracks.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
