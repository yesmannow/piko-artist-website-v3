"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Zap, Cpu, Radio } from "lucide-react";

function mulberry32(seed: number) {
  // Deterministic PRNG for SSR-safe animations.
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function StudioEngineSection() {
  const [isHovered, setIsHovered] = useState(false);
  const [audioPulse, setAudioPulse] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const waveformBars = useMemo(() => {
    const BASE_SEED = 0xA11CE; // Fixed seed so SSR + client match exactly.
    return Array.from({ length: 40 }, (_, i) => {
      const rand = mulberry32(BASE_SEED ^ (i * 0x9E3779B9));

      const h1 = 10 + rand() * 20;
      const h2 = 30 + rand() * 40;
      const h3 = 10 + rand() * 20;
      const duration = 0.5 + rand() * 0.5;

      return {
        // Use a mutable array for Framer Motion keyframes (avoids readonly tuple type error)
        heights: [`${h1.toFixed(4)}px`, `${h2.toFixed(4)}px`, `${h3.toFixed(4)}px`],
        duration,
      };
    });
  }, []);

  // Smooth spring animations for mouse tracking
  const springConfig = { damping: 50, stiffness: 100 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  // Audio pulse simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioPulse(Math.sin(Date.now() / 800) * 0.15 + 0.15);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Mouse tracking
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
                transition: { duration: 2, repeat: Infinity, repeatType: "reverse" },
              }}
            >
              OWN THE
              <br />
              <span className="text-[#FFD700]">MASTER</span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg md:text-xl text-[#E0E0E0] leading-relaxed max-w-xl"
            >
              The industry&apos;s most powerful remix suite. Isolate stems, command the mix, and reinvent every beat with professional-grade AI deconstruction.
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
                { icon: Zap, label: "AI Stem Isolation" },
                { icon: Cpu, label: "Real-time Processing" },
                { icon: Radio, label: "Professional Mixing" },
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
                  <span style={{ transform: "skewX(12deg)", display: "inline-block" }}>
                    ENTER THE BOOTH
                  </span>
                  <motion.span
                    style={{ transform: "skewX(12deg)", display: "inline-block", marginLeft: "8px" }}
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
              STUDIO_ENGINE: CONSOLE_ONLINE
            </motion.div>
          </motion.div>

          {/* Right: 3D Interactive Element */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative h-[400px] md:h-[500px] lg:h-[600px]"
            style={{
              perspective: "1000px",
            }}
          >
            {/* 3D Container with Parallax */}
            <motion.div
              className="relative w-full h-full"
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
            >
              {/* DJ Monitor - Animated GIF "deck cam" */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="relative w-[260px] h-[260px] md:w-[340px] md:h-[340px] lg:w-[420px] lg:h-[420px]"
                  animate={
                    isHovered
                      ? { y: [-2, 2, -2], rotateZ: [-0.5, 0.5, -0.5] }
                      : { y: [0, -6, 0], rotateZ: [0, 0.6, 0] }
                  }
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Glow bed */}
                  <div
                    className="absolute -inset-10 opacity-60"
                    style={{
                      background: `radial-gradient(circle at center, rgba(255, 215, 0, ${0.14 + audioPulse * 0.22}) 0%, transparent 65%)`,
                      filter: "blur(40px)",
                    }}
                  />

                  {/* Frame */}
                  <motion.div
                    className="relative w-full h-full overflow-hidden border-2 border-[#FFD700]/25 bg-[#050505]/60"
                    style={{
                      transform: "rotateX(14deg) rotateY(-18deg)",
                      boxShadow:
                        "0 30px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(224,224,224,0.08) inset",
                    }}
                    animate={{
                      filter: isHovered
                        ? [
                            "contrast(1.08) saturate(1.05) brightness(0.95)",
                            "contrast(1.2) saturate(1.18) brightness(1.06)",
                            "contrast(1.08) saturate(1.05) brightness(0.95)",
                          ]
                        : [
                            "contrast(1.06) saturate(1.02) brightness(0.92)",
                            "contrast(1.12) saturate(1.12) brightness(0.98)",
                            "contrast(1.06) saturate(1.02) brightness(0.92)",
                          ],
                    }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {/* Deck cam GIF */}
                    <Image
                      src="/images/sudio-mixer/Digital-DJ-Tips-GIF-downsized_large.gif"
                      alt="DJ deck cam"
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 420px, (min-width: 768px) 340px, 260px"
                      className="object-cover"
                      style={{
                        filter: "grayscale(0.05) contrast(1.05) saturate(1.15)",
                        transform: "scale(1.04)",
                        opacity: 0.78,
                      }}
                    />

                    {/* Vignette + grime */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 40%, rgba(255,215,0,0.06) 0%, rgba(5,5,5,0.75) 70%)",
                        mixBlendMode: "overlay",
                      }}
                    />

                    {/* Scanlines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[linear-gradient(transparent_50%,rgba(255,215,0,0.08)_50%)] bg-[length:100%_4px]" />

                    {/* Golden grid */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-35"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(255, 215, 0, 0.08) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 215, 0, 0.08) 1px, transparent 1px)
                        `,
                        backgroundSize: "20px 20px",
                      }}
                    />

                    {/* Subtle particle dotfield */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none opacity-25 mix-blend-screen"
                      style={{
                        backgroundImage: "radial-gradient(rgba(255,215,0,0.35) 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                      }}
                      animate={{ x: [0, -14, 0], y: [0, 10, 0] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Glitch sweep */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none opacity-35"
                      style={{
                        background:
                          "linear-gradient(110deg, transparent 35%, rgba(255,215,0,0.12) 48%, transparent 60%)",
                        mixBlendMode: "screen",
                      }}
                      initial={{ x: "-120%" }}
                      animate={{ x: ["-120%", "120%"] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.4 }}
                    />

                    {/* Micro-noise */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none opacity-14"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
                      mixBlendMode: "overlay",
                    }}
                    animate={{ opacity: [0.10, 0.16, 0.10] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Corner brackets */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute left-3 top-3 w-5 h-5 border-l-2 border-t-2 border-[#FFD700]/60" />
                      <div className="absolute right-3 top-3 w-5 h-5 border-r-2 border-t-2 border-[#FFD700]/60" />
                      <div className="absolute left-3 bottom-3 w-5 h-5 border-l-2 border-b-2 border-[#FFD700]/60" />
                      <div className="absolute right-3 bottom-3 w-5 h-5 border-r-2 border-b-2 border-[#FFD700]/60" />
                    </div>

                    {/* HUD label */}
                    <div className="absolute left-4 bottom-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#E0E0E0]/90">
                      <motion.span
                        className="inline-block w-2 h-2 rounded-full bg-[#FFD700]"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                      DECK_CAM // LIVE
                    </div>

                    {/* Auto-dim when not hovered */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none bg-[#050505]"
                      animate={{ opacity: isHovered ? 0 : 0.45 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  </motion.div>
                </motion.div>

                {/* Floating Elements */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-16 h-16 border border-[#FFD700]/20"
                    style={{
                      background: `rgba(255, 215, 0, ${0.05 + audioPulse * 0.1})`,
                      left: `${30 + i * 20}%`,
                      top: `${20 + i * 25}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.2, 0.4, 0.2],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Audio Waveform Visualization */}
                <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-1 px-8">
                  {waveformBars.map((bar, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-[#FFD700]"
                      animate={{
                        height: bar.heights,
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: bar.duration,
                        repeat: Infinity,
                        delay: i * 0.05,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, rgba(255, 215, 0, ${audioPulse * 0.2}) 0%, transparent 70%)`,
                filter: "blur(40px)",
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

