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
  {
    id: "xyJ0oCagkkQ",
    title: "Piko - Session 1",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/xyJ0oCagkkQ",
    coverArt: "from-orange-500 to-red-600",
    vibe: "hype"
  },
  {
    id: "FMr4jEVE9LE",
    title: "Piko - Session 2",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/FMr4jEVE9LE",
    coverArt: "from-red-600 to-rose-600",
    vibe: "hype"
  },
  {
    id: "_s-jxMyH2eM",
    title: "Piko - Session 3",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/_s-jxMyH2eM",
    coverArt: "from-amber-500 to-orange-500",
    vibe: "hype"
  },
  {
    id: "UK3iPsiRPf8",
    title: "Piko - Session 4",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/UK3iPsiRPf8",
    coverArt: "from-blue-400 to-cyan-500",
    vibe: "chill"
  },
  {
    id: "vvCc8_NeTDs",
    title: "Piko - Session 5",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/vvCc8_NeTDs",
    coverArt: "from-indigo-400 to-blue-600",
    vibe: "chill"
  },
  {
    id: "SoC8OPSVAQ4",
    title: "Piko - Session 6",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/SoC8OPSVAQ4",
    coverArt: "from-emerald-500 to-green-600",
    vibe: "storytelling"
  },
  {
    id: "teeTq5Buums",
    title: "Piko - Session 7",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/teeTq5Buums",
    coverArt: "from-teal-500 to-emerald-600",
    vibe: "storytelling"
  },
  {
    id: "Lm1xNXF-atU",
    title: "Piko - Session 8",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/Lm1xNXF-atU",
    coverArt: "from-purple-500 to-pink-600",
    vibe: "classic"
  },
  {
    id: "SrewrwYMIfQ",
    title: "Piko - Session 9",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/SrewrwYMIfQ",
    coverArt: "from-pink-500 to-rose-600",
    vibe: "classic"
  },
  {
    id: "rJJmXdPr-VQ",
    title: "Piko - Session 10",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/rJJmXdPr-VQ",
    coverArt: "from-yellow-500 to-amber-600",
    vibe: "hype"
  },
  {
    id: "TL52Cl9k0FA",
    title: "Piko - Session 11",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/TL52Cl9k0FA",
    coverArt: "from-cyan-500 to-blue-600",
    vibe: "chill"
  },
  {
    id: "Ow1Ae9j8Va4",
    title: "Piko - Session 12",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/Ow1Ae9j8Va4",
    coverArt: "from-green-500 to-emerald-600",
    vibe: "storytelling"
  },
  {
    id: "9OMBVY3hB-w",
    title: "Piko - Session 13",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/9OMBVY3hB-w",
    coverArt: "from-indigo-500 to-purple-600",
    vibe: "hype"
  },
  {
    id: "2kX9cYjIBWs",
    title: "Piko - Session 14",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/2kX9cYjIBWs",
    coverArt: "from-rose-500 to-red-600",
    vibe: "classic"
  },
  {
    id: "fs6bL8EHa1s",
    title: "Piko - Session 15",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/fs6bL8EHa1s",
    coverArt: "from-teal-400 to-cyan-500",
    vibe: "chill"
  },
  {
    id: "Sex-P009rWg",
    title: "Piko - Session 16",
    artist: "Piko",
    type: 'video',
    src: "https://www.youtube.com/embed/Sex-P009rWg",
    coverArt: "from-blue-500 to-indigo-600",
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

export interface TourDate {
  id: number;
  city: string;
  venue: string;
  date: string;
  lat: number;
  lng: number;
  ticketUrl: string;
  image: string;
  description: string;
}

export const tourDates: TourDate[] = [
  {
    id: 1,
    city: "New York",
    venue: "Terminal 5",
    date: "OCT 15",
    lat: 40.7128,
    lng: -74.0060,
    ticketUrl: "#",
    image: "https://images.unsplash.com/photo-1496442226666-8d4a0e29e128?q=80&w=2940&auto=format&fit=crop",
    description: "The world tour kicks off in the concrete jungle."
  },
  {
    id: 2,
    city: "London",
    venue: "O2 Brixton",
    date: "OCT 22",
    lat: 51.5074,
    lng: -0.1278,
    ticketUrl: "#",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=2940&auto=format&fit=crop",
    description: "A legendary night in the heart of London."
  },
  {
    id: 3,
    city: "Tokyo",
    venue: "Zepp DiverCity",
    date: "NOV 05",
    lat: 35.6762,
    lng: 139.6503,
    ticketUrl: "#",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2940&auto=format&fit=crop",
    description: "Neon lights and deep frequencies in Tokyo."
  },
  {
    id: 4,
    city: "Mexico City",
    venue: "Auditorio Nacional",
    date: "NOV 12",
    lat: 19.4326,
    lng: -99.1332,
    ticketUrl: "#",
    image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=2940&auto=format&fit=crop",
    description: "Latin American energy meets underground beats."
  },
  {
    id: 5,
    city: "Los Angeles",
    venue: "The Wiltern",
    date: "NOV 20",
    lat: 34.0522,
    lng: -118.2437,
    ticketUrl: "#",
    image: "https://images.unsplash.com/photo-1534237710431-e2fc698436d0?q=80&w=2940&auto=format&fit=crop",
    description: "The grand finale on the West Coast."
  }
];