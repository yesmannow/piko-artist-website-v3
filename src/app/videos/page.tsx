import { GlitchText } from "@/components/GlitchText";
import { VideoGallery } from "@/components/VideoGallery";

export default function VideosPage() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-graffiti mb-8 md:mb-12 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
            <GlitchText text="ALL VISUALS" />
          </h1>
          <VideoGallery featuredOnly={false} />
        </div>
      </section>
    </div>
  );
}


