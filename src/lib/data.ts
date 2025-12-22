export interface MediaItem {
  id: string;
  title: string;
  artist: string;
  type: 'audio' | 'video';
  src: string;
  coverArt: string; // Tailwind gradient placeholder
  vibe: 'chill' | 'hype' | 'storytelling' | 'classic';
}

export const tracks: MediaItem[] = [
  // --- YOUTUBE VIDEOS (Curated) ---
  // HYPE
  {
    id: "LHcO1jwYi7U",
    title: "Hype Flow 1",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/LHcO1jwYi7U",
    coverArt: "from-orange-500 to-red-600",
    vibe: "hype"
  },
  {
    id: "Ow1Ae9j8Va4",
    title: "Hype Flow 2",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/Ow1Ae9j8Va4",
    coverArt: "from-red-600 to-rose-600",
    vibe: "hype"
  },
  {
    id: "9OMBVY3hB-w",
    title: "Hype Flow 3",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/9OMBVY3hB-w",
    coverArt: "from-amber-500 to-orange-500",
    vibe: "hype"
  },
  // CHILL
  {
    id: "TdvnheJZrtk",
    title: "Chill Session 1",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/TdvnheJZrtk",
    coverArt: "from-blue-400 to-cyan-500",
    vibe: "chill"
  },
  {
    id: "qeeePtLecTo",
    title: "Chill Session 2",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/qeeePtLecTo",
    coverArt: "from-indigo-400 to-blue-600",
    vibe: "chill"
  },
  // STORYTELLING
  {
    id: "kFDQOy8k5Oo",
    title: "Story Arc 1",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/kFDQOy8k5Oo",
    coverArt: "from-emerald-500 to-green-600",
    vibe: "storytelling"
  },
  {
    id: "4vBe5cSsW08",
    title: "Story Arc 2",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/4vBe5cSsW08",
    coverArt: "from-teal-500 to-emerald-600",
    vibe: "storytelling"
  },

  // --- LOCAL AUDIO TRACKS ---
  // CHILL VIBE
  {
    id: "dejate-llevar",
    title: "Déjate Llevar",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/dejate-llevar.mp3",
    coverArt: "from-purple-500 to-indigo-500",
    vibe: "chill"
  },
  {
    id: "entre-humos",
    title: "Entre Humos",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/entre-humos.mp3",
    coverArt: "from-slate-700 to-slate-900",
    vibe: "chill"
  },
  {
    id: "ganja",
    title: "Ganja",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/ganja.mp3",
    coverArt: "from-green-500 to-emerald-700",
    vibe: "chill"
  },
  {
    id: "amor-sincero",
    title: "Amor Sincero",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/amor-sincero.mp3",
    coverArt: "from-pink-500 to-rose-500",
    vibe: "chill"
  },
  {
    id: "amores-perdidos",
    title: "Amores Perdidos",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/amores-perdidos.mp3",
    coverArt: "from-rose-500 to-pink-600",
    vibe: "chill"
  },
  {
    id: "bungalow",
    title: "Bungalow",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/bungalow.mp3",
    coverArt: "from-cyan-500 to-blue-500",
    vibe: "chill"
  },
  {
    id: "corazon-y-mente",
    title: "Corazón Y Mente",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/corazon-y-mente.mp3",
    coverArt: "from-red-400 to-pink-500",
    vibe: "chill"
  },
  {
    id: "crussin",
    title: "Crussin",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/crussin.mp3",
    coverArt: "from-blue-600 to-violet-600",
    vibe: "chill"
  },
  {
    id: "jardin-de-rosas",
    title: "Jardín De Rosas",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/jardin-de-rosas.mp3",
    coverArt: "from-green-400 to-emerald-600",
    vibe: "chill"
  },
  {
    id: "noches-enteras",
    title: "Noches Enteras",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/noches-enteras.mp3",
    coverArt: "from-indigo-800 to-purple-900",
    vibe: "chill"
  },
  {
    id: "sentimientos",
    title: "Sentimientos",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/sentimientos.mp3",
    coverArt: "from-violet-500 to-fuchsia-500",
    vibe: "chill"
  },
  {
    id: "sin-rencores",
    title: "Sin Rencores",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/sin-rencores.mp3",
    coverArt: "from-gray-500 to-slate-600",
    vibe: "chill"
  },
  {
    id: "te-perdi",
    title: "Te Perdí",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/te-perdi.mp3",
    coverArt: "from-stone-500 to-neutral-600",
    vibe: "chill"
  },
  {
    id: "te-prometo",
    title: "Te Prometo",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/te-prometo.mp3",
    coverArt: "from-sky-400 to-blue-500",
    vibe: "chill"
  },
  {
    id: "un-dia-mas",
    title: "Un Día Más",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/un-dia-mas.mp3",
    coverArt: "from-orange-300 to-amber-400",
    vibe: "chill"
  },

  // HYPE VIBE
  {
    id: "gunster",
    title: "Gunster",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/gunster.mp3",
    coverArt: "from-zinc-800 to-black",
    vibe: "hype"
  },
  {
    id: "el-don",
    title: "El Don",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/el-don.mp3",
    coverArt: "from-yellow-500 to-amber-500",
    vibe: "hype"
  },
  {
    id: "f-7",
    title: "F-7",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/f-7.mp3",
    coverArt: "from-red-600 to-orange-600",
    vibe: "hype"
  },
  {
    id: "los-5",
    title: "Los 5",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/los-5.mp3",
    coverArt: "from-blue-700 to-indigo-800",
    vibe: "hype"
  },
  {
    id: "party",
    title: "Party",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/party.mp3",
    coverArt: "from-fuchsia-600 to-purple-700",
    vibe: "hype"
  },

  // STORYTELLING VIBE
  {
    id: "falle",
    title: "Fallé",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/falle.mp3",
    coverArt: "from-red-900 to-red-950",
    vibe: "storytelling"
  },
  {
    id: "im-sorry",
    title: "I'm Sorry",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/im-sorry.mp3",
    coverArt: "from-gray-700 to-gray-900",
    vibe: "storytelling"
  },
  {
    id: "me-cuentan",
    title: "Me Cuentan",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/me-cuentan.mp3",
    coverArt: "from-teal-700 to-emerald-800",
    vibe: "storytelling"
  },
  {
    id: "quejas",
    title: "Quejas",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/quejas.mp3",
    coverArt: "from-slate-600 to-gray-700",
    vibe: "storytelling"
  },

  // CLASSIC VIBE
  {
    id: "tortas-de-jamon",
    title: "Tortas De Jamón",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/tortas-de-jamon.mp3",
    coverArt: "from-amber-600 to-yellow-600",
    vibe: "classic"
  },
  {
    id: "12-05",
    title: "12-05",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/12_05.mp3",
    coverArt: "from-neutral-700 to-stone-800",
    vibe: "classic"
  }
];