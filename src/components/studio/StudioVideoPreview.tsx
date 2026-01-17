"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";

export function StudioVideoPreview({ isHovered }: { isHovered: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax effect
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [2, -2]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-2, 2]);

  // Auto-play on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    }
  }, []);

  // Update progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, []);

  // Mouse tracking for parallax
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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full"
      style={{
        perspective: "1000px",
      }}
    >
      {/* 3D Tilting Container */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Video Container with Glitch Effect Border */}
        <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-[#FFD700]/30 bg-black/80 backdrop-blur-sm">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            muted
            autoPlay
            playsInline
            preload="auto"
          >
            <source src="/video/131411-750559777_small.mp4" type="video/mp4" />
          </video>

          {/* Scanline Overlay Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 215, 0, 0.03) 2px, rgba(255, 215, 0, 0.03) 4px)",
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* VHS Noise Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
            }}
            animate={{
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 0.1,
              repeat: Infinity,
            }}
          />

          {/* Corner Labels - CCTV Style */}
          <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm px-3 py-1 border border-[#FFD700]/50 font-mono">
            <motion.span
              className="text-[10px] text-[#FFD700] uppercase tracking-wider"
              animate={{
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            >
              ● REC
            </motion.span>
          </div>

          <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm px-3 py-1 border border-[#FFD700]/50">
            <span className="text-[10px] font-mono text-[#FFD700] uppercase tracking-wider">
              LIVE_STUDIO
            </span>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
            <motion.div
              className="h-full bg-[#FFD700]"
              style={{ width: `${progress}%` }}
              initial={{ width: 0 }}
            />
          </div>

          {/* Volume Control Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute bottom-20 right-4 z-20"
          >
            {/* Mute Button */}
            <motion.button
              onClick={toggleMute}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-full bg-black/90 text-[#FFD700] flex items-center justify-center border-2 border-[#FFD700]/50 backdrop-blur-sm"
              style={{
                boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)",
              }}
            >
              {isMuted ? (
                <VolumeX className="w-7 h-7" />
              ) : (
                <Volume2 className="w-7 h-7" />
              )}
            </motion.button>
          </motion.div>

          {/* Instruction Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="bg-black/90 backdrop-blur-md px-6 py-3 border-2 border-[#FFD700]">
              <p className="text-[#FFD700] font-mono text-sm uppercase tracking-wider text-center">
                Live Studio Preview • Click Volume to Hear
              </p>
            </div>
          </motion.div>
        </div>

        {/* CTA Button */}
        <Link href="/studio">
          <motion.div
            whileHover={{ scale: 1.05, boxShadow: "6px 6px 0px #000" }}
            whileTap={{ scale: 0.95 }}
            className="absolute -bottom-6 -right-6 bg-[#FFD700] text-black px-6 py-3 font-black italic uppercase text-base border-2 border-black cursor-pointer z-10"
            style={{
              fontFamily: "var(--font-lexend), system-ui, sans-serif",
              transform: "skewX(-12deg)",
              boxShadow: "4px 4px 0px #000",
            }}
          >
            <span
              style={{ transform: "skewX(12deg)", display: "inline-block" }}
            >
              ENTER BOOTH →
            </span>
          </motion.div>
        </Link>
      </motion.div>

      {/* Animated Glow Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-lg -z-10"
        animate={{
          boxShadow: [
            "0 0 20px rgba(255, 215, 0, 0.2)",
            "0 0 40px rgba(255, 215, 0, 0.4)",
            "0 0 20px rgba(255, 215, 0, 0.2)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Corner Accent Lines */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FFD700]/50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FFD700]/50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FFD700]/50 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FFD700]/50 pointer-events-none" />
    </motion.div>
  );
}
