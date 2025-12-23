export interface MediaItem {
  id: string;
  title: string;
  artist: string;
  type: 'audio' | 'video';
  src: string;
  coverArt: string; // Image path or Tailwind gradient placeholder (for videos)
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
    coverArt: "/images/tracks/abstract-1846847_1280.jpg",
    vibe: "chill"
  },
  {
    id: "entre-humos",
    title: "Entre Humos",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/entre-humos.mp3",
    coverArt: "/images/tracks/architecture-3189972_1280.jpg",
    vibe: "chill"
  },
  {
    id: "ganja",
    title: "Ganja",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/ganja.mp3",
    coverArt: "/images/tracks/aurora-borealis-9267515_1280.jpg",
    vibe: "chill"
  },
  {
    id: "amor-sincero",
    title: "Amor Sincero",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/amor-sincero.mp3",
    coverArt: "/images/tracks/background-1833056_1280.jpg",
    vibe: "chill"
  },
  {
    id: "amores-perdidos",
    title: "Amores Perdidos",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/amores-perdidos.mp3",
    coverArt: "/images/tracks/bicycle-3045580_1280.jpg",
    vibe: "chill"
  },
  {
    id: "bungalow",
    title: "Bungalow",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/bungalow.mp3",
    coverArt: "/images/tracks/dj-2581269_1280.jpg",
    vibe: "chill"
  },
  {
    id: "corazon-y-mente",
    title: "Corazón Y Mente",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/corazon-y-mente.mp3",
    coverArt: "/images/tracks/gong-8255081_1280.jpg",
    vibe: "chill"
  },
  {
    id: "crussin",
    title: "Crussin",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/crussin.mp3",
    coverArt: "/images/tracks/graffiti-1476119_1280.jpg",
    vibe: "chill"
  },
  {
    id: "jardin-de-rosas",
    title: "Jardín De Rosas",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/jardin-de-rosas.mp3",
    coverArt: "/images/tracks/graffiti-3750912_1280.jpg",
    vibe: "chill"
  },
  {
    id: "noches-enteras",
    title: "Noches Enteras",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/noches-enteras.mp3",
    coverArt: "/images/tracks/hamburg-2718329_1280.jpg",
    vibe: "chill"
  },
  {
    id: "sentimientos",
    title: "Sentimientos",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/sentimientos.mp3",
    coverArt: "/images/tracks/love-2724141_1280.png",
    vibe: "chill"
  },
  {
    id: "sin-rencores",
    title: "Sin Rencores",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/sin-rencores.mp3",
    coverArt: "/images/tracks/skateboard-447147_1280.jpg",
    vibe: "chill"
  },
  {
    id: "te-perdi",
    title: "Te Perdí",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/te-perdi.mp3",
    coverArt: "/images/tracks/skull-and-crossbones-414207_1280.jpg",
    vibe: "chill"
  },
  {
    id: "te-prometo",
    title: "Te Prometo",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/te-prometo.mp3",
    coverArt: "/images/tracks/starry-sky-1655503_1280.jpg",
    vibe: "chill"
  },
  {
    id: "un-dia-mas",
    title: "Un Día Más",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/un-dia-mas.mp3",
    coverArt: "/images/tracks/street-art-1499524_1280.jpg",
    vibe: "chill"
  },

  // HYPE VIBE
  {
    id: "gunster",
    title: "Gunster",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/gunster.mp3",
    coverArt: "/images/tracks/tube-7260586_1280.jpg",
    vibe: "hype"
  },
  {
    id: "el-don",
    title: "El Don",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/el-don.mp3",
    coverArt: "/images/tracks/vinyl-1595847_1280.jpg",
    vibe: "hype"
  },
  {
    id: "f-7",
    title: "F-7",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/f-7.mp3",
    coverArt: "/images/tracks/wall-2583885_1280.jpg",
    vibe: "hype"
  },
  {
    id: "los-5",
    title: "Los 5",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/los-5.mp3",
    coverArt: "/images/tracks/wallpaper-5928106_1280.png",
    vibe: "hype"
  },
  {
    id: "party",
    title: "Party",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/party.mp3",
    coverArt: "/images/tracks/woman-3633737_1280.jpg",
    vibe: "hype"
  },

  // STORYTELLING VIBE
  {
    id: "falle",
    title: "Fallé",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/falle.mp3",
    coverArt: "/images/tracks/abstract-1846847_1280.jpg",
    vibe: "storytelling"
  },
  {
    id: "im-sorry",
    title: "I'm Sorry",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/im-sorry.mp3",
    coverArt: "/images/tracks/architecture-3189972_1280.jpg",
    vibe: "storytelling"
  },
  {
    id: "me-cuentan",
    title: "Me Cuentan",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/me-cuentan.mp3",
    coverArt: "/images/tracks/aurora-borealis-9267515_1280.jpg",
    vibe: "storytelling"
  },
  {
    id: "quejas",
    title: "Quejas",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/quejas.mp3",
    coverArt: "/images/tracks/background-1833056_1280.jpg",
    vibe: "storytelling"
  },

  // CLASSIC VIBE
  {
    id: "tortas-de-jamon",
    title: "Tortas De Jamón",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/tortas-de-jamon.mp3",
    coverArt: "/images/tracks/bicycle-3045580_1280.jpg",
    vibe: "classic"
  },
  {
    id: "12-05",
    title: "12-05",
    artist: "Piko",
    type: 'audio',
    src: "/audio/tracks/12_05.mp3",
    coverArt: "/images/tracks/dj-2581269_1280.jpg",
    vibe: "classic"
  }
];