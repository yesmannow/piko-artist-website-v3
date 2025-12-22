"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const stickers = [
  {
    src: "/images/stickers/hello-tag.jpg",
    alt: "Hello Tag Sticker",
    width: 200,
    height: 200,
  },
  {
    src: "/images/stickers/street-1.jpg",
    alt: "Street Art Sticker 1",
    width: 180,
    height: 180,
  },
  {
    src: "/images/stickers/street-2.jpg",
    alt: "Street Art Sticker 2",
    width: 160,
    height: 160,
  },
];

interface StickerWallProps {
  fixed?: boolean;
}

/**
 * StickerWall component that scatters stickers randomly on the background
 * with slight rotation and low z-index to sit behind text but above noise texture
 */
export function StickerWall({ fixed = false }: StickerWallProps) {
  return (
    <div className={`${fixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none z-0 overflow-hidden`}>
      {stickers.map((sticker, index) => {
        // Generate random positions (avoiding center where text typically is)
        const positions = [
          { x: "10%", y: "15%" },
          { x: "75%", y: "20%" },
          { x: "15%", y: "70%" },
          { x: "80%", y: "65%" },
          { x: "5%", y: "45%" },
          { x: "90%", y: "50%" },
        ];

        const position = positions[index % positions.length];
        // Random rotation between -10deg and 10deg
        const rotation = (Math.random() * 20 - 10).toFixed(1);

        return (
          <motion.div
            key={sticker.src}
            className="absolute opacity-40 hover:opacity-60 transition-opacity"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: index * 0.2,
              ease: "easeOut",
            }}
            style={{
              left: position.x,
              top: position.y,
              transform: `rotate(${rotation}deg)`,
              zIndex: 1,
            }}
          >
            <Image
              src={sticker.src}
              alt={sticker.alt}
              width={sticker.width}
              height={sticker.height}
              className="object-contain"
              style={{
                filter: "grayscale(20%) contrast(1.1)",
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

