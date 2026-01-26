#!/usr/bin/env node

import fs from "fs";
import path from "path";

const TRACK_DIR = path.join(process.cwd(), "public", "audio", "tracks");
const PIKO_JSON = path.join(process.cwd(), "src", "data", "piko-tracks.json");
const MUSICIAN_JSON = path.join(process.cwd(), "src", "data", "musician_tracks.json");

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  if (!fs.existsSync(TRACK_DIR)) {
    console.error("[check-tracks] Track directory not found:", TRACK_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(TRACK_DIR).filter((f) => f.endsWith(".mp3"));
  const piko = loadJSON(PIKO_JSON);
  const musician = loadJSON(MUSICIAN_JSON);

  const referenced = new Set([
    ...piko.map((t) => (t.src || "").replace("/audio/tracks/", "")),
    ...musician.map((t) => (t.src || "").replace("/audio/tracks/", "")),
  ]);

  const unused = files.filter((f) => !referenced.has(f));
  const missing = [...referenced].filter((f) => f && !files.includes(f));

  console.log("Track Integrity Report");
  console.log("----------------------");

  console.log("\nUnused MP3s:");
  console.log(unused.length ? unused.join(", ") : "None");

  console.log("\nMissing MP3s referenced in JSON:");
  console.log(missing.length ? missing.join(", ") : "None");

  console.log("\nTotal files:", files.length);
  console.log("Total referenced:", referenced.size);
}

main();
