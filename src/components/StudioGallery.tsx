"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const studioImages = [
  {
    src: "/images/artist/studio-mic.jpg",
    alt: "En la cabina",
    caption: "En la cabina",
  },
  {
    src: "/images/artist/portrait-close.jpg",
    alt: "Focus",
    caption: "Focus",
  },
  {
    src: "/images/hero/hero-white.jpg",
    alt: "Vision",
    caption: "Vision",
  },
];

export function StudioGallery() {
  return (
    <div className="relative py-12 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-graffiti mb-8 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
          Studio Life
        </h2>

        {/* Masonry/Polaroid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {studioImages.map((image, index) => {
            // Random rotation between -5deg and 5deg for each image
            const rotation = (index * 3.5 - 5) % 11 - 5;

            return (
              <motion.div
                key={image.src}
                initial={{ opacity: 0, y: 30, rotate: rotation }}
                whileInView={{ opacity: 1, y: 0, rotate: rotation }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                whileHover={{
                  rotate: rotation + (Math.random() * 10 - 5),
                  scale: 1.05,
                  zIndex: 10
                }}
                className="relative group cursor-pointer"
              >
                {/* Polaroid-style photo with white border and shadow */}
                <div className="relative bg-white p-4 md:p-6 shadow-lg md:shadow-xl">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  {/* Caption below image (Polaroid style) */}
                  <div className="mt-4 text-center">
                    <p className="font-tag text-lg md:text-xl text-gray-800">
                      {image.caption}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

