"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { VaultVisuals } from "@/components/VaultVisuals";
import { TrackList } from "@/components/TrackList";
import { FluidVaporBackground } from "@/components/FluidVaporBackground";
import { HomeBookingTerminal } from "@/components/HomeBookingTerminal";

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
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="cursor-pointer"
          >
            <Image
              src="/images/branding/piko-logo.png"
              alt="Piko FG logo"
              width={320}
              height={128}
              priority
              className="w-56 sm:w-64 md:w-72 lg:w-80 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
              style={{
                filter: "grayscale(1) brightness(1.5)",
              }}
            />
          </motion.div>

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
      <section
        id="latest-drops"
        className="relative py-12 md:py-20 px-4 md:px-8 bg-[#050505] border-t-2 border-[#E0E0E0]/10"
      >
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
                <span className="text-xs font-mono text-[#E0E0E0]/60 uppercase">
                  LATEST_RELEASES
                </span>
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

      {/* Section 2: VAULT VISUALS (CCTV Monitor Wall) */}
      <VaultVisuals />

      {/* Booking Terminal Teaser (links to /contact hub) */}
      <HomeBookingTerminal />
    </div>
  );
}

