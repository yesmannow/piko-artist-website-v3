"use client";

/**
 * Phase 3: Visual Infrastructure & Layout
 * "Liquid Obsidian" Aesthetic with Bento Grid 2.0 Architecture
 * Next.js 15 | Tailwind CSS v4
 */

export default function Studio() {
  return (
    <main 
      className="h-dvh w-full overflow-hidden text-white studio-grain"
      style={{
        background: '#050505',
        backgroundImage: 'var(--background-image-liquid-mesh)',
        backgroundSize: '200% 200%',
        animation: 'liquid-move 18s ease-in-out infinite'
      }}
    >
      {/* Bento Grid Container */}
      <div className="h-full w-full p-2 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4">
        
        {/* Header Module - Global State */}
        <header className="col-span-full h-16 glass-panel rounded-lg flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl lg:text-2xl font-black uppercase tracking-tight" style={{ color: '#00F2FF' }}>
              DJ Studio
            </h1>
            <div className="hidden md:flex items-center gap-2 text-sm font-mono">
              <span className="text-white/60">BPM:</span>
              <span className="text-white font-bold">128.00</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm font-mono">
              <span className="text-white/60">Master:</span>
              <span className="text-white font-bold">-6dB</span>
            </div>
          </div>
        </header>

        {/* Timeline Module - Full Width Waveform */}
        <section className="col-span-full h-32 glass-panel rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-mono text-white/40 mb-2">TIMELINE / WAVEFORM</div>
            <div className="h-16 w-full bg-white/5 rounded relative overflow-hidden">
              <div 
                className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white/30"
              >
                Full-width dual waveform visualization
              </div>
            </div>
          </div>
        </section>

        {/* Deck A Module */}
        <section className="col-span-12 lg:col-span-5 h-64 lg:h-auto glass-panel rounded-lg p-4">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: '#00F2FF' }}>
                Deck A
              </h2>
              <div className="text-xs font-mono text-white/60">PLAYING</div>
            </div>
            
            {/* Vinyl Platter Placeholder */}
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 flex items-center justify-center"
                style={{ 
                  borderColor: '#00F2FF',
                  background: 'radial-gradient(circle, rgba(0,242,255,0.1) 0%, transparent 70%)'
                }}
              >
                <div className="text-center">
                  <div className="text-xs font-mono text-white/40">VINYL</div>
                  <div className="text-2xl font-black" style={{ color: '#00F2FF' }}>A</div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs font-mono text-white/60 text-center">
              Track Name • Artist • 128 BPM
            </div>
          </div>
        </section>

        {/* Mixer Module - Center Strip */}
        <section className="col-span-12 lg:col-span-2 h-64 lg:h-auto glass-panel rounded-lg p-4">
          <div className="flex flex-col h-full">
            <h2 className="text-sm font-bold uppercase tracking-wide text-center mb-4 text-white/80">
              Mixer
            </h2>
            
            {/* Crossfader Placeholder */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-xs font-mono text-white/40">EQ / FILTERS</div>
              
              <div className="w-full">
                <div className="text-xs font-mono text-white/40 mb-2 text-center">CROSSFADER</div>
                <div className="h-2 bg-white/10 rounded-full relative">
                  <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-4 rounded-full"
                    style={{ background: '#00F2FF' }}
                  />
                </div>
              </div>

              <div className="text-xs font-mono text-white/40">EFFECTS</div>
            </div>
          </div>
        </section>

        {/* Deck B Module */}
        <section className="col-span-12 lg:col-span-5 h-64 lg:h-auto glass-panel rounded-lg p-4">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: '#9333ea' }}>
                Deck B
              </h2>
              <div className="text-xs font-mono text-white/60">CUED</div>
            </div>
            
            {/* Vinyl Platter Placeholder */}
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 flex items-center justify-center"
                style={{ 
                  borderColor: '#9333ea',
                  background: 'radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 70%)'
                }}
              >
                <div className="text-center">
                  <div className="text-xs font-mono text-white/40">VINYL</div>
                  <div className="text-2xl font-black" style={{ color: '#9333ea' }}>B</div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs font-mono text-white/60 text-center">
              Next Track • Artist • 126 BPM
            </div>
          </div>
        </section>

        {/* Library Module - Bottom Section */}
        <section className="col-span-full h-48 lg:h-auto glass-panel rounded-lg p-4">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white/80">
                Piko&apos;s R2 Music Library
              </h2>
              <div className="text-xs font-mono text-white/40">
                Search & Browse
              </div>
            </div>
            
            <div className="flex-1 overflow-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
                {/* Placeholder tracks */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={i}
                    className="p-3 bg-white/5 rounded border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-white/80 mb-1">Track {i + 1}</div>
                    <div className="text-white/40">Artist Name</div>
                    <div className="text-white/40 mt-1">
                      {120 + (i % 10)} BPM • {["House", "Techno", "Drum & Bass"][i % 3]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
