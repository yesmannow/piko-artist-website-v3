"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { VideoGallery } from "@/components/VideoGallery";
import { Contact } from "@/components/Contact";
import { TrackList } from "@/components/TrackList";
import { GlitchText } from "@/components/GlitchText";
import { BeatMakerTeaser } from "@/components/BeatMakerTeaser";
import { EventList } from "@/components/EventList";

export default function Home() {
  const scrollToMusic = () => {
    const musicSection = document.getElementById("latest-drops");
    if (musicSection) {
      musicSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        id="home"
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        <Image
          src="/images/hero/hero-white.jpg"
          alt="Piko hero background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40 z-10" />

        <div className="relative z-20 flex flex-col items-center gap-6 md:gap-8 text-center px-4 md:px-6">
          <motion.img
            src="/images/branding/piko-logo.png"
            alt="Piko FG logo"
            className="w-56 sm:w-64 md:w-72 lg:w-80 drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              y: [0, -10, 0],
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              opacity: { duration: 0.6 },
              scale: { duration: 0.6 },
              filter: { duration: 0.6 },
              y: {
                duration: 7,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
                delay: 0.6,
              },
            }}
          />

          <motion.button
            onClick={scrollToMusic}
            className="px-8 py-4 bg-white text-black font-header text-xl font-bold transform -rotate-1 hover:rotate-0 transition-transform shadow-hard border-2 border-black"
            style={{
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            LISTEN NOW
          </motion.button>
        </div>
      </section>

      {/* Section 1: LATEST DROPS (Music) */}
      <section id="latest-drops" className="relative py-12 md:py-20 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Backstage Pass Container */}
            <div className="border-l-4 border-toxic-lime bg-concrete/50 p-4 md:p-6 lg:p-8 mb-6 md:mb-8 rounded-r-lg">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-header mb-6 md:mb-8 text-foreground">
                LATEST DROPS
              </h2>
              <TrackList featuredOnly={true} />
              <div className="mt-8 flex justify-center">
                <Link
                  href="/music"
                  className="px-6 py-3 bg-white text-black font-header font-bold transform -rotate-1 hover:rotate-0 transition-transform shadow-hard border-2 border-black"
                  style={{
                    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                  }}
                >
                  VIEW FULL DISCOGRAPHY
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: RECENT SIGHTINGS (Videos) */}
      <section id="recent-sightings" className="relative py-12 md:py-20 px-4 md:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Header with REC dot */}
            <div className="relative mb-6 md:mb-8 lg:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-header text-center text-foreground">
                RECENT SIGHTINGS
              </h2>
              {/* REC Red Dot Animation */}
              <motion.div
                className="absolute top-0 right-0 md:right-8 w-4 h-4 bg-red-600 rounded-full border-2 border-black"
                animate={{
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  boxShadow: "0 0 10px #dc2626",
                }}
              />
            </div>
            <VideoGallery featuredOnly={true} />
            <div className="mt-8 flex justify-center">
              <Link
                href="/videos"
                className="px-6 py-3 bg-white text-black font-header font-bold transform -rotate-1 hover:rotate-0 transition-transform shadow-hard border-2 border-black"
                style={{
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
              >
                WATCH ALL VISUALS
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: LIVE OPERATIONS (Events) */}
      <section id="live-operations" className="relative py-12 md:py-20 px-4 md:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-header mb-6 md:mb-8 lg:mb-12 text-center text-foreground">
              LIVE OPERATIONS
            </h2>
            <EventList limit={2} />
            <div className="mt-8 flex justify-center">
              <Link
                href="/events"
                className="px-6 py-3 bg-white text-black font-header font-bold transform -rotate-1 hover:rotate-0 transition-transform shadow-hard border-2 border-black"
                style={{
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
              >
                VIEW FULL TOUR
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Caution Tape Divider */}
        <div
          className="w-full h-16 mt-20"
          style={{
            background: "repeating-linear-gradient(45deg, #fbbf24 0%, #fbbf24 10%, #000 10%, #000 20%)",
            backgroundSize: "40px 40px",
            borderTop: "2px solid #000",
            borderBottom: "2px solid #000",
          }}
        />
      </section>

      {/* Section 4: THE LAB (Beat Maker) */}
      <section id="the-lab" className="relative py-12 md:py-20 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Desk Mat Background */}
            <div className="bg-zinc-800 p-6 md:p-8 lg:p-12 border-2 border-black shadow-hard rounded-lg">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-header mb-6 md:mb-8 lg:mb-12 text-center text-foreground">
                THE LAB
              </h2>
              <BeatMakerTeaser />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 5: RAP SHEET (Bio) */}
      <section id="rap-sheet" className="relative py-12 md:py-20 px-4 md:px-8 bg-card">
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
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-header mb-4 md:mb-6 text-foreground">
                <GlitchText text="PIKO FG" />
              </h2>

              {/* Subheadline */}
              <p className="text-2xl md:text-3xl font-industrial font-bold uppercase tracking-wider text-foreground/70 mb-6">
                Versos Reales. Ritmo Urbano. Una Mas Music.
              </p>

              {/* Narrative - "Rap Sheet" Case File Style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative p-6 md:p-8 mb-8 bg-[#f0e6d2] text-black shadow-hard"
                style={{
                  transform: "rotate(-1deg)",
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
              >
                {/* Paperclip Element */}
                <div className="absolute -top-2 right-8 z-10">
                  <svg
                    width="24"
                    height="32"
                    viewBox="0 0 24 32"
                    fill="none"
                    className="text-gray-600"
                  >
                    <path
                      d="M8 2C8 1.44772 8.44772 1 9 1H15C15.5523 1 16 1.44772 16 2V8C16 8.55228 15.5523 9 15 9H9C8.44772 9 8 8.55228 8 8V2Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 10C8 9.44772 8.44772 9 9 9H15C15.5523 9 16 9.44772 16 10V16C16 16.5523 15.5523 17 15 17H9C8.44772 17 8 16.5523 8 16V10Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 18C8 17.4477 8.44772 17 9 17H15C15.5523 17 16 17.4477 16 18V24C16 24.5523 15.5523 25 15 25H9C8.44772 25 8 24.5523 8 24V18Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                {/* Typewriter-style text with highlights */}
                <p className="text-base md:text-lg font-industrial font-medium leading-relaxed">
                  Representing the{" "}
                  <span className="relative inline-block px-1 bg-yellow-300" style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}>
                    Una Mas Music
                  </span>{" "}
                  movement,{" "}
                  <span className="relative inline-block px-1 bg-yellow-300" style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}>
                    Piko
                  </span>{" "}
                  blends the raw energy of the underground with the emotional complexity of real relationships. From the smoke-filled vibes of &apos;Entre Humos&apos; to the heartfelt promises of &apos;Te Prometo,&apos; his music is a mirror of the streets—beautiful, chaotic, and real. As a{" "}
                  <span className="relative inline-block px-1 bg-yellow-300" style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}>
                    Producer
                  </span>{" "}
                  and{" "}
                  <span className="relative inline-block px-1 bg-yellow-300" style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}>
                    Artist
                  </span>
                  , he continues to push boundaries.
                </p>
              </motion.div>

              {/* Featured Quote */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative p-6 bg-concrete/50 border-2 border-black"
                style={{
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
              >
                <p className="text-xl md:text-2xl font-industrial font-medium text-foreground italic leading-relaxed">
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
                  className="w-full h-auto border-2 border-black object-cover transition-all duration-300 group-hover:scale-105 shadow-hard"
                  style={{
                    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <Contact />
    </div>
  );
}
