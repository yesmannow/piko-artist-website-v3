"use client";

import { motion } from "framer-motion";

interface Video {
  id: string;
  title: string;
}

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video, index) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="group"
        >
          <div className="aspect-video bg-muted rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${video.id}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <h3 className="mt-3 font-semibold text-lg group-hover:text-primary transition-colors">
            {video.title}
          </h3>
        </motion.div>
      ))}
    </div>
  );
}
