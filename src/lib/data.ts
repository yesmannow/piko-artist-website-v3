export interface Track {
  id: number;
  title: string;
  artist: string;
  src: string; // URL to the audio file
  coverArt: string; // Color placeholder for now, image URL later
  vibe: 'chill' | 'hype' | 'classic' | 'freestyle';
}

export const tracks: Track[] = [
  {
    id: 1,
    title: "Midnight City Flow",
    artist: "Piko",
    src: "/audio/track1.mp3",
    coverArt: "from-purple-500 to-blue-500",
    vibe: "chill"
  },
  {
    id: 2,
    title: "Concrete Jungle",
    artist: "Piko ft. Guest",
    src: "/audio/track2.mp3",
    coverArt: "from-yellow-500 to-red-500",
    vibe: "hype"
  },
  {
    id: 3,
    title: "Neon Nights",
    artist: "Piko",
    src: "/audio/track3.mp3",
    coverArt: "from-green-400 to-cyan-500",
    vibe: "freestyle"
  },
  {
    id: 4,
    title: "Underground King",
    artist: "Piko",
    src: "/audio/track4.mp3",
    coverArt: "from-stone-700 to-stone-900",
    vibe: "classic"
  },
  {
    id: 5,
    title: "Spray Paint Soul",
    artist: "Piko",
    src: "/audio/track5.mp3",
    coverArt: "from-pink-500 to-rose-500",
    vibe: "chill"
  },
  {
    id: 6,
    title: "Dice Roll Freestyle",
    artist: "Piko",
    src: "/audio/track6.mp3",
    coverArt: "from-indigo-500 to-purple-600",
    vibe: "hype"
  }
];
