"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Music, Video, User } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-secondary/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-7xl md:text-9xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Piko
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-12">
            Music Artist & Producer
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link
              href="/music"
              className="group flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all hover:scale-105"
            >
              <Music className="w-5 h-5" />
              Listen to Music
            </Link>
            <Link
              href="/videos"
              className="group flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-all hover:scale-105"
            >
              <Video className="w-5 h-5" />
              Watch Videos
            </Link>
            <Link
              href="/about"
              className="group flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
            >
              <User className="w-5 h-5" />
              About Me
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Featured Audio Section */}
      <section className="py-20 px-8 bg-card">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-8 text-center">Featured Track</h2>
            <div className="bg-background p-8 rounded-lg border shadow-lg">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <Play className="w-16 h-16 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Latest Release</h3>
              <p className="text-muted-foreground">
                Experience the newest sounds from Piko. High-quality audio streamed from Cloudflare R2.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Video Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-8 text-center">Featured Video</h2>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden shadow-xl">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Featured Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
