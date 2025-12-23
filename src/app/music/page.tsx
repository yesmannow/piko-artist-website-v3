import { GlitchText } from "@/components/GlitchText";
import { TrackList } from "@/components/TrackList";

export default function MusicPage() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-graffiti mb-8 md:mb-12 text-center bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
            <GlitchText text="FULL DISCOGRAPHY" />
          </h1>
          <TrackList featuredOnly={false} />
        </div>
      </section>
    </div>
  );
}


