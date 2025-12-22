"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { ImageGallery } from "@/components/ImageGallery";
import { Music, Mic2, Headphones } from "lucide-react";

// Sample gallery images
const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=800&fit=crop",
    alt: "Studio Recording",
    title: "In the Studio",
  },
  {
    src: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=800&fit=crop",
    alt: "Live Performance",
    title: "Live at the Venue",
  },
  {
    src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop",
    alt: "Equipment Setup",
    title: "The Setup",
  },
];

export default function AboutPage() {
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
            title="About Piko" 
            subtitle="Music artist and producer crafting unique sonic experiences"
          />

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6">My Journey</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to my musical journey. I'm Piko, a music artist and producer passionate about creating
                  unique sounds and experiences that resonate with listeners around the world.
                </p>
                <p>
                  My music blends various genres and influences to create something truly unique.
                  From electronic beats to acoustic melodies, I explore the full spectrum of sound.
                </p>
                <p>
                  Every track is crafted with attention to detail and a commitment to quality,
                  bringing you the best possible listening experience.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6">What I Do</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Music className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Music Production</h3>
                    <p className="text-muted-foreground">
                      Creating original tracks and beats across multiple genres
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Mic2 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Live Performances</h3>
                    <p className="text-muted-foreground">
                      Bringing energy to stages and connecting with audiences
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Headphones className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Sound Design</h3>
                    <p className="text-muted-foreground">
                      Crafting unique sonic textures and atmospheres
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Gallery</h2>
            <ImageGallery images={galleryImages} columns={3} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-16 text-center bg-card p-12 rounded-lg border"
          >
            <h2 className="text-3xl font-bold mb-4">Let's Connect</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Follow me on social media for the latest updates, behind-the-scenes content,
              and announcements about new releases and performances.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                Follow on Instagram
              </button>
              <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity">
                Subscribe on YouTube
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
