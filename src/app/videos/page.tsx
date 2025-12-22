"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { VideoGrid } from "@/components/VideoGrid";
import { SectionHeader } from "@/components/SectionHeader";

// Sample YouTube video IDs - no API needed
const videos = [
  {
    id: "dQw4w9WgXcQ",
    title: "Performance at Central Park",
  },
  {
    id: "9bZkp7q19f0",
    title: "Studio Session - Behind the Scenes",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Live Concert Highlights",
  },
  {
    id: "JGwWNGJdvx8",
    title: "Music Video - Latest Single",
  },
  {
    id: "60ItHLz5WEA",
    title: "Acoustic Set at Sunset",
  },
  {
    id: "2Vv-BfVoq4g",
    title: "Collaboration Special",
  },
];

export default function VideosPage() {
  return (
    <div className="min-h-screen py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            ← Back to Home
          </Link>
          
          <SectionHeader 
            title="Video Gallery" 
            subtitle="Watch performances, behind-the-scenes content, and music videos"
          />

          <VideoGrid videos={videos} />
        </motion.div>
      </div>
    </div>
  );
}
