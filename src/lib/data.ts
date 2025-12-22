export interface MediaItem {
  id: string;
  title: string;
  artist: string;
  type: "audio" | "video";
  src: string;
  coverArt: string;
  vibe: "chill" | "hype" | "storytelling" | "classic";
}

export const tracks: MediaItem[] = [
  // AUDIO (Local)
  {
    id: "audio-1",
    title: "Midnight City Flow",
    artist: "Piko",
    type: "audio",
    src: "/audio/tracks/midnight-city.mp3",
    coverArt: "from-purple-500 to-blue-500",
    vibe: "chill",
  },
  {
    id: "audio-2",
    title: "Concrete Jungle",
    artist: "Piko",
    type: "audio",
    src: "/audio/tracks/concrete-jungle.mp3",
    coverArt: "from-yellow-500 to-red-500",
    vibe: "hype",
  },
  // VIDEOS (YouTube)
  {
    id: "LHcO1jwYi7U",
    title: "Hype Track 1",
    artist: "Piko",
    type: "video",
    src: "https://www.youtube.com/embed/LHcO1jwYi7U",
    coverArt: "from-orange-500 to-red-600",
    vibe: "hype",
  },
  {
    id: "Ow1Ae9j8Va4",
    title: "Hype Track 2",
    artist: "Piko",
    type: "video",
    src: "https://www.youtube.com/embed/Ow1Ae9j8Va4",
    coverArt: "from-red-500 to-rose-600",
    vibe: "hype",
  },
  {
    id: "9OMBVY3hB-w",
    title: "Hype Track 3",
    artist: "Piko",
    type: "video",
    src: "https://www.youtube.com/embed/9OMBVY3hB-w",
    coverArt: "from-amber-500 to-orange-600",
    vibe: "hype",
  },
  {
    id: "TdvnheJZrtk",
    title: "Chill Flow 1",
    artist: "Piko",
    type: "video",
    src: "https://www.youtube.com/embed/TdvnheJZrtk",
    coverArt: "from-blue-400 to-cyan-500",
    vibe: "chill",
  },
  {
    id: "qeeePtLecTo",
    title: "Chill Flow 2",
    artist: "Piko",
    type: "video",
    src: "https://www.youtube.com/embed/qeeePtLecTo",
    coverArt: "from-indigo-400 to-blue-600",
    vibe: "chill",
  },
  {
    id: "kFDQOy8k5Oo",
    title: "Story Track 1",
    artist: "Piko",
    type: "video",
    src: "https://www.youtube.com/embed/kFDQOy8k5Oo",
    coverArt: "from-emerald-500 to-green-600",
    vibe: "storytelling",
  },
  {
    id: "4vBe5cSsW08",
    title: "Story Track 2",
    artist: "Piko",
    type: "video",
    src: "https://www.youtube.com/embed/4vBe5cSsW08",
    coverArt: "from-teal-500 to-emerald-600",
    vibe: "storytelling",
  },
];

