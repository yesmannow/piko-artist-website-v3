import { getTrackArtworkUrl } from "./getTrackArtworkUrl";

export type StudioTrack = {
  id: string;        // slug (filename without extension)
  title: string;     // display name
  url: string;       // local static url: /audio/tracks/*.mp3
  artworkUrl: string;// deterministic artwork: /images/tracks/*
};

const TRACK_BASE = "/audio/tracks";

const FILES = [
  "12_05.mp3",
  "amor-sincero.mp3",
  "amores-perdidos.mp3",
  "bungalow.mp3",
  "corazon-y-mente.mp3",
  "crussin.mp3",
  "dejate-llevar.mp3",
  "el-don.mp3",
  "entre-humos.mp3",
  "f-7.mp3",
  "Falle.mp3",
  "ganja.mp3",
  "gunster.mp3",
  "im-sorry.mp3",
  "jardin-de-rosas.mp3",
  "los-5.mp3",
  "me-cuentan.mp3",
  "noches-enteras.mp3",
  "party.mp3",
  "quejas.mp3",
  "sentimientos.mp3",
  "sin-rencores.mp3",
  "te-perdi.mp3",
  "te-prometo.mp3",
  "tortas-de-jamon.mp3",
  "un-dia-mas.mp3"
] as const;

function humanizeId(id: string): string {
  // "te-perdi" => "Te Perdi", "12_05" => "12 05"
  const spaced = id.replace(/[-_]+/g, " ").trim();
  return spaced.replace(/\b\w/g, (m) => m.toUpperCase());
}

export const STUDIO_TRACKS: StudioTrack[] = FILES.map((file) => {
  const id = file.replace(/\.mp3$/i, "");
  return {
    id,
    title: humanizeId(id),
    url: `${TRACK_BASE}/${file}`,
    artworkUrl: getTrackArtworkUrl(id),
  };
});

export const STUDIO_TRACK_MAP = new Map(STUDIO_TRACKS.map(t => [t.id, t]));
