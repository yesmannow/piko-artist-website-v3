"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { VideoGallery } from "@/components/VideoGallery";
import { Contact } from "@/components/Contact";
import { TrackList } from "@/components/TrackList";
import { GlitchText } from "@/components/GlitchText";
import { MpcPad } from "@/components/MpcPad";

export default function Home() {
  const scrollToMusic = () => {
    const musicSection = document.getElementById("music");
    if (musicSection) {
      musicSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/hero-bw.jpg"
            alt="Hero Background"
            fill
            className="object-cover"
            priority
          />
          {/* Black Overlay */}
          <div className="absolute inset-0 bg-black/50 z-10" />
        </div>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 text-center max-w-4xl"
        >
          {/* Logo with Breathing Animation */}
          <motion.div
            className="relative inline-block mb-8"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/images/branding/piko-logo.png"
              alt="Piko Logo"
              width={400}
              height={160}
              className="relative z-10"
              style={{
                filter: "drop-shadow(0 0 20px hsl(var(--neon-pink))) drop-shadow(0 0 40px hsl(var(--neon-pink))) drop-shadow(0 0 60px hsl(var(--neon-pink)))",
              }}
              priority
            />
          </motion.div>

          {/* Listen Now Button with Torn Tape Edge */}
          <motion.button
            onClick={scrollToMusic}
            className="relative px-8 py-4 bg-gradient-to-r from-neon-pink to-neon-green text-background font-tag text-xl font-bold hover:shadow-lg hover:shadow-neon-pink/50 transition-all"
            style={{
              clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Listen Now
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-neon-pink/30 to-neon-green/30 blur-md -z-10"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.button>
        </motion.div>
      </section>

      {/* Bio Section */}
      <section id="bio" className="relative py-20 px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-12 items-center">
            {/* Text Content - Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              {/* Headline */}
              <h2 className="text-6xl md:text-8xl font-graffiti mb-4 bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
                <GlitchText text="PIKO FG" />
              </h2>

              {/* Subheadline */}
              <p className="text-2xl md:text-3xl font-tag text-muted-foreground mb-6">
                Versos Reales. Ritmo Urbano. Una Mas Music.
              </p>

              {/* Narrative */}
              <p className="text-lg md:text-xl text-foreground/90 mb-8 leading-relaxed">
                Representing the Una Mas Music movement, Piko blends the raw energy of the underground with the emotional complexity of real relationships. From the smoke-filled vibes of &apos;Entre Humos&apos; to the heartfelt promises of &apos;Te Prometo,&apos; his music is a mirror of the streets—beautiful, chaotic, and real.
              </p>

              {/* Featured Quote */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative p-6 bg-gradient-to-br from-neon-pink/10 to-neon-green/10 border-2 border-neon-pink/30 rounded-lg"
              >
                <p className="text-xl md:text-2xl font-tag text-foreground italic leading-relaxed">
                  &quot;Ella se quedó porque lo amaba, él cambió para que no se fuera. Ella aprendió a amarlo otra vez, y él a mejorar por ella.&quot;
                </p>
              </motion.div>
            </motion.div>

            {/* Image - Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative group">
                <Image
                  src="/images/artist/portrait-close.jpg"
                  alt="Piko Portrait"
                  width={600}
                  height={800}
                  priority
                  quality={100}
                  className="w-full h-auto rounded-2xl border-2 border-neon-pink/50 object-cover transition-all duration-300 group-hover:scale-105 shadow-[0_0_30px_rgba(255,0,255,0.3)] group-hover:shadow-[0_0_50px_rgba(255,0,255,0.5)]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MPC Beat Maker Section */}
      <section id="beat-maker" className="relative py-20 px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-graffiti mb-8 md:mb-12 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
              <GlitchText text="MAKE A BEAT" />
            </h2>
            <MpcPad />
          </motion.div>
        </div>
      </section>

      {/* Discography Section */}
      <section id="music" className="relative py-20 px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-graffiti mb-8 md:mb-12 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
              <GlitchText text="DISCOGRAPHY" />
            </h2>
            <TrackList featuredOnly={true} />
          </motion.div>
        </div>
      </section>

      {/* Video Gallery Section */}
      <section id="videos" className="relative py-20 px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Flickering Neon Header */}
            <motion.h2
              className="text-4xl md:text-5xl font-graffiti mb-8 md:mb-12 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent"
              animate={{
                opacity: [1, 0.7, 1, 0.8, 1],
                filter: [
                  "brightness(1)",
                  "brightness(1.2)",
                  "brightness(0.8)",
                  "brightness(1.1)",
                  "brightness(1)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                textShadow: "0 0 20px hsl(var(--neon-pink)), 0 0 40px hsl(var(--neon-green))",
              }}
            >
              <GlitchText text="VISUALS" />
            </motion.h2>
            <VideoGallery featuredOnly={true} />
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <Contact />
    </div>
  );
}
