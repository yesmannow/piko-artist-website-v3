export type KitType = "street" | "lofi" | "jardin" | "amor";

export interface Pad {
  id: string;
  name: string;
  audioFile: string;
  color: "green" | "pink" | "cyan";
}

export interface Kit {
  id: KitType;
  name: string;
  pads: Pad[];
  playbackRate?: number;
}

// STREET KIT - One-shot samples
export const streetKit: Kit = {
  id: "street",
  name: "STREET KIT",
  pads: [
    { id: "kick", name: "Kick", audioFile: "/audio/samples/kick-drum-426037.mp3", color: "green" },
    { id: "snare", name: "Snare", audioFile: "/audio/samples/tr909-snare-drum-241413.mp3", color: "pink" },
    { id: "hihat", name: "Hi-Hat", audioFile: "/audio/samples/090241_chimbal-aberto-39488.mp3", color: "cyan" },
    { id: "bass", name: "Bass", audioFile: "/audio/samples/deep-808-230752.mp3", color: "green" },
    { id: "perc", name: "Perc", audioFile: "/audio/samples/shaker-drum-434902.mp3", color: "pink" },
    { id: "fx", name: "FX", audioFile: "/audio/samples/reverse-cymbal-riser-451412.mp3", color: "cyan" },
  ],
  playbackRate: 1.0,
};

// LO-FI KIT - Same samples with slower playback
export const lofiKit: Kit = {
  id: "lofi",
  name: "LO-FI KIT",
  pads: [
    { id: "kick", name: "Kick", audioFile: "/audio/samples/kick-drum-426037.mp3", color: "green" },
    { id: "snare", name: "Snare", audioFile: "/audio/samples/tr909-snare-drum-241413.mp3", color: "pink" },
    { id: "hihat", name: "Hi-Hat", audioFile: "/audio/samples/090241_chimbal-aberto-39488.mp3", color: "cyan" },
    { id: "bass", name: "Bass", audioFile: "/audio/samples/deep-808-230752.mp3", color: "green" },
    { id: "perc", name: "Perc", audioFile: "/audio/samples/shaker-drum-434902.mp3", color: "pink" },
    { id: "fx", name: "FX", audioFile: "/audio/samples/reverse-cymbal-riser-451412.mp3", color: "cyan" },
  ],
  playbackRate: 0.8,
};

// JARDIN REMIX - Stem-based kit
export const jardinKit: Kit = {
  id: "jardin",
  name: "JARDIN REMIX",
  pads: [
    { id: "drums", name: "Drums", audioFile: "/audio/stems/jardin/drums.mp3", color: "green" },
    { id: "bass", name: "Bass", audioFile: "/audio/stems/jardin/bass.mp3", color: "pink" },
    { id: "melody", name: "Melody", audioFile: "/audio/stems/jardin/melody.mp3", color: "cyan" },
    { id: "vocals", name: "Vocals", audioFile: "/audio/stems/jardin/vocals.mp3", color: "green" },
  ],
  playbackRate: 1.0,
};

// AMOR REMIX - Stem-based kit
export const amorKit: Kit = {
  id: "amor",
  name: "AMOR REMIX",
  pads: [
    { id: "drums", name: "Drums", audioFile: "/audio/stems/amor/drums.mp3", color: "green" },
    { id: "bass", name: "Bass", audioFile: "/audio/stems/amor/bass.mp3", color: "pink" },
    { id: "melody", name: "Melody", audioFile: "/audio/stems/amor/melody.mp3", color: "cyan" },
    { id: "vocals", name: "Vocals", audioFile: "/audio/stems/amor/vocals.mp3", color: "green" },
  ],
  playbackRate: 1.0,
};

export const kits: Record<KitType, Kit> = {
  street: streetKit,
  lofi: lofiKit,
  jardin: jardinKit,
  amor: amorKit,
};

export function getKit(kitType: KitType): Kit {
  return kits[kitType];
}

