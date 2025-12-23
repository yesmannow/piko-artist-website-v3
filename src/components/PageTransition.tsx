"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: {
            opacity: 0,
            x: 0,
          },
          animate: {
            opacity: 1,
            x: 0,
            transition: {
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            },
          },
          exit: {
            opacity: 0,
            x: -100,
            transition: {
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
        className="relative w-full"
      >
        {/* RGB Split Effect on Exit */}
        <motion.div
          className="absolute inset-0 z-50 pointer-events-none"
          variants={{
            initial: { opacity: 0 },
            exit: {
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeInOut",
              },
            },
          }}
        >
          {/* Red Channel */}
          <motion.div
            className="absolute inset-0 bg-red-600 mix-blend-screen"
            variants={{
              exit: {
                x: [-20, 0],
                opacity: [0.8, 0],
                transition: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
              },
            }}
          />
          {/* Green Channel */}
          <motion.div
            className="absolute inset-0 bg-green-600 mix-blend-screen"
            variants={{
              exit: {
                x: [0, 0],
                opacity: [0.8, 0],
                transition: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
              },
            }}
          />
          {/* Blue Channel */}
          <motion.div
            className="absolute inset-0 bg-blue-600 mix-blend-screen"
            variants={{
              exit: {
                x: [20, 0],
                opacity: [0.8, 0],
                transition: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
              },
            }}
          />
        </motion.div>

        {/* Static Noise Overlay */}
        <motion.div
          className="absolute inset-0 z-50 pointer-events-none"
          variants={{
            initial: { opacity: 0 },
            exit: {
              opacity: [0, 0.3, 0],
              transition: {
                duration: 0.3,
                times: [0, 0.5, 1],
              },
            },
          }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            mixBlendMode: "screen",
          }}
        />

        {/* Content */}
        <motion.div
          variants={{
            initial: {
              opacity: 0,
              filter: "blur(10px)",
            },
            animate: {
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                duration: 0.4,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

