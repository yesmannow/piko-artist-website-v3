"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import Link from "next/link";
import { Zap, Disc3, Headphones } from "lucide-react";
import { StudioVideoPreview } from "./StudioVideoPreview";

export function StudioEngineSection() {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Mouse tracking for background effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      return () => container.removeEventListener("mousemove", handleMouseMove);
    }
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-[#050505] border-t-2 border-[#E0E0E0]/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
          linear-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 215, 0, 0.1) 1px, transparent 1px)
        `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${50 + mouseX.get() * 20}% ${50 + mouseY.get() * 20}%, rgba(255, 215, 0, 0.05) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Heading */}
            <motion.h2
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black italic uppercase leading-tight text-white"
              style={{
                fontFamily: "var(--font-lexend), system-ui, sans-serif",
                transform: "skewX(-12deg)",
                textShadow: "4px 4px 0px rgba(0,0,0,0.5)",
              }}
              animate={{
                textShadow: isHovered
                  ? [
                      "4px 4px 0px rgba(0,0,0,0.5)",
                      "6px 6px 20px rgba(255, 215, 0, 0.3)",
                      "4px 4px 0px rgba(0,0,0,0.5)",
                    ]
                  : "4px 4px 0px rgba(0,0,0,0.5)",
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
            >
              COMMAND THE
              <br />
              <span className="text-[#FFD700]">DECKS</span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg md:text-xl text-[#E0E0E0] leading-relaxed max-w-xl"
            >
              Step into Piko&apos;s virtual booth. Scratch, mix, and remix with
              professional DJ tools. Isolate stems, drop hot cues, and create
              your own versions of the hottest tracks. This ain&apos;t just a
              player—it&apos;s a full studio experience.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-wrap gap-3"
            >
              {[
                { icon: Disc3, label: "Dual Turntables" },
                { icon: Zap, label: "Stem Isolation" },
                { icon: Headphones, label: "Live Scratching" },
              ].map((feature, idx) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#E0E0E0]/20 text-[#E0E0E0] text-sm font-mono uppercase tracking-wider"
                  whileHover={{
                    borderColor: "#FFD700",
                    backgroundColor: "rgba(255, 215, 0, 0.1)",
                  }}
                >
                  <feature.icon className="w-4 h-4 text-[#FFD700]" />
                  <span>{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Link href="/studio">
                <motion.button
                  className="relative px-8 py-4 bg-[#FFD700] text-black font-black italic uppercase text-lg md:text-xl tracking-wider border-2 border-black group overflow-hidden"
                  style={{
                    fontFamily: "var(--font-lexend), system-ui, sans-serif",
                    transform: "skewX(-12deg)",
                    boxShadow: "8px 8px 0px #000",
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "12px 12px 0px #000",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span
                    style={{
                      transform: "skewX(12deg)",
                      display: "inline-block",
                    }}
                  >
                    HIT THE BOOTH
                  </span>
                  <motion.span
                    style={{
                      transform: "skewX(12deg)",
                      display: "inline-block",
                      marginLeft: "8px",
                    }}
                    animate={{ x: [0, 4, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    →
                  </motion.span>

                  {/* Hover shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              </Link>
            </motion.div>

            {/* Status Text */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-sm font-mono text-[#FFD700]/80 uppercase tracking-wider"
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block w-2 h-2 bg-[#FFD700] rounded-full"
              />
              DJ_BOOTH: DECKS_READY • SCRATCH_MODE_ACTIVE
            </motion.div>
          </motion.div>

          {/* Right: Interactive Video Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative h-[400px] md:h-[500px] lg:h-[600px]"
          >
            <StudioVideoPreview isHovered={isHovered} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
