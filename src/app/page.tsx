"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { VaultVisuals } from "@/components/VaultVisuals";
import { Contact } from "@/components/Contact";
import { TrackList } from "@/components/TrackList";
import { StudioEngineSection } from "@/components/studio/StudioEngineSection";
import { FluidVaporBackground } from "@/components/FluidVaporBackground";

export default function Home() {
  const scrollToMusic = () => {
    if (typeof window === "undefined") return;
    const musicSection = document.getElementById("latest-drops");
    if (musicSection) {
      musicSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - V3 SYNDICATE */}
      <section
        id="home"
        className="relative h-screen flex items-center justify-center overflow-hidden bg-[#050505]"
      >
        {/* Fluid Vapor Background */}
        <FluidVaporBackground />

        {/* Background Image with Urban Filter */}
        <Image
          src="/images/hero/hero-white.jpg"
          alt="Piko hero background"
          fill
          className="object-cover"
          priority
          style={{
            filter: "grayscale(1) contrast(1.2) brightness(0.8)",
          }}
        />
        <div className="absolute inset-0 bg-[#050505]/80 z-10" />

        {/* Ghosted Stencil "V3 SYNDICATE" Backdrop */}
        <h1
          className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none"
          style={{
            fontFamily: "var(--font-lexend), system-ui, sans-serif",
            fontSize: "clamp(12rem, 20vw, 24rem)",
            fontWeight: 900,
            fontStyle: "italic",
            color: "rgba(224, 224, 224, 0.05)", // 5% opacity
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          V3 SYNDICATE
        </h1>

        <div className="relative z-20 flex flex-col items-center gap-6 md:gap-8 text-center px-4 md:px-6">
          <motion.img
            src="/images/branding/piko-logo.png"
            alt="Piko FG logo"
            className="w-56 sm:w-64 md:w-72 lg:w-80 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-pointer"
            style={{
              filter: "grayscale(1) brightness(1.5)",
            }}
            initial={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px) grayscale(1) brightness(1.5)",
              y: [0, -10, 0],
            }}
            whileHover={{
              scale: 1.05,
              filter: "blur(0px) grayscale(0.8) brightness(1.6)",
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
            className="px-12 py-6 bg-[#E0E0E0] text-black font-black italic uppercase text-xl md:text-2xl md:skew-x-[-12deg] skew-x-[-6deg] hover:bg-[#FFD700] transition-all"
            style={{
              fontFamily: "var(--font-lexend), system-ui, sans-serif",
              boxShadow: "8px 8px 0px #000",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            LISTEN NOW
          </motion.button>
        </div>
      </section>

      {/* Section 1: LATEST DROPS - Warehouse Shipping Manifest */}
      <section id="latest-drops" className="relative py-12 md:py-20 px-4 md:px-8 bg-[#050505] border-t-2 border-[#E0E0E0]/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Warehouse Manifest Header */}
            <div className="mb-8 border-l-8 border-[#FFD700] pl-6">
              <h2
                className="text-4xl md:text-6xl font-black italic uppercase mb-2 text-[#E0E0E0]"
                style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
              >
                STUDIO_<span className="text-[#FFD700]">MANIFEST</span>
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-[#FFD700] text-black text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-black">
                  CAUTION
                </span>
                <span className="text-xs font-mono text-[#E0E0E0]/60 uppercase">LATEST_RELEASES</span>
              </div>
            </div>

            {/* Track List with CCTV Scan-line Effect */}
            <div className="relative">
              <TrackList featuredOnly={true} />
              {/* Scan-line overlay on hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-[linear-gradient(transparent_50%,rgba(255,215,0,0.1)_50%)] bg-[length:100%_4px]" />
            </div>

          </motion.div>
        </div>
      </section>

      {/* Studio Engine Section */}
      <StudioEngineSection />

      {/* Section 2: VAULT VISUALS (CCTV Monitor Wall) */}
      <VaultVisuals />

      {/* Section 3: RAP SHEET (Bio) - Paper Texture with Spray Paint */}
      <section
        id="rap-sheet"
        className="relative py-12 md:py-20 px-4 md:px-8 bg-[#0a0a0a]"
        style={{
          backgroundImage: `
            /* Paper Texture */
            url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E"),
            /* Spray Paint Streaks */
            linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.08) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 30%, rgba(255, 215, 0, 0.06) 50%, transparent 70%)
          `,
          backgroundBlendMode: "overlay, normal, normal",
        }}
      >
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
              <h2
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black italic uppercase mb-4 md:mb-6 text-[#E0E0E0] border-l-8 border-[#FFD700] pl-6"
                style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
              >
                RAP_<span className="text-[#FFD700]">SHEET</span>
              </h2>

              {/* Subheadline */}
              <p className="text-2xl md:text-3xl font-mono font-bold uppercase tracking-wider text-[#E0E0E0]/70 mb-6">
                Versos Reales. Ritmo Urbano. Una Mas Music.
              </p>

              {/* Narrative - "Rap Sheet" Case File Style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative p-6 md:p-8 mb-8 bg-[#0a0a0a] border-2 border-[#E0E0E0]/20"
                style={{
                  boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
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

                {/* Text with Spray Paint Highlights */}
                <p className="text-base md:text-lg font-mono leading-relaxed text-[#E0E0E0]">
                  Representing the{" "}
                  <span className="relative inline-block px-2 py-0.5 bg-[#FFD700] text-black font-black italic uppercase" style={{ transform: "skewX(-12deg)" }}>
                    Una Mas Music
                  </span>{" "}
                  movement,{" "}
                  <span className="relative inline-block px-2 py-0.5 bg-[#FFD700] text-black font-black italic uppercase" style={{ transform: "skewX(-12deg)" }}>
                    Piko
                  </span>{" "}
                  blends the raw energy of the underground with the emotional complexity of real relationships. From the smoke-filled vibes of &apos;Entre Humos&apos; to the heartfelt promises of &apos;Te Prometo,&apos; his music is a mirror of the streets—beautiful, chaotic, and real. As a{" "}
                  <span className="relative inline-block px-2 py-0.5 bg-[#FFD700] text-black font-black italic uppercase" style={{ transform: "skewX(-12deg)" }}>
                    Producer
                  </span>{" "}
                  and{" "}
                  <span className="relative inline-block px-2 py-0.5 bg-[#FFD700] text-black font-black italic uppercase" style={{ transform: "skewX(-12deg)" }}>
                    Artist
                  </span>
                  , he continues to push boundaries.
                </p>
              </motion.div>

              {/* Featured Quote - Brutalist Chrome Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative p-6 bg-[#E0E0E0] border-2 border-black"
                style={{
                  transform: "skewX(-12deg)",
                  boxShadow: "12px 12px 0px #FFD700",
                }}
              >
                <div style={{ transform: "skewX(12deg)" }}>
                  <p className="text-xl md:text-2xl font-mono font-medium text-black italic leading-relaxed">
                    &quot;Ella se quedó porque lo amaba, él cambió para que no se fuera. Ella aprendió a amarlo otra vez, y él a mejorar por ella.&quot;
                  </p>
                </div>
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
                <div className="relative">
                  <Image
                    src="/images/artist/portrait-close.jpg"
                    alt="Piko Portrait"
                    width={600}
                    height={800}
                    priority
                    quality={100}
                    className="w-full h-auto border-2 border-[#E0E0E0]/20 object-cover transition-all duration-300 group-hover:scale-105"
                    style={{
                      filter: "grayscale(1) contrast(1.1) brightness(0.9)",
                      boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
                    }}
                  />
                  {/* Subtle Noise Texture Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                      mixBlendMode: "overlay",
                    }}
                  />
                </div>
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
