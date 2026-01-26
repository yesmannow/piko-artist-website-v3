#!/usr/bin/env node

import fs from "fs";
import path from "path";

const TRACK_DIR = path.join(process.cwd(), "public", "audio", "tracks");
const PIKO_JSON = path.join(process.cwd(), "src", "data", "piko-tracks.json");
const MUSICIAN_JSON = path.join(process.cwd(), "src", "data", "musician_tracks.json");

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fail(message) {
  console.error("[validate-tracks] Build failed:", message);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(TRACK_DIR)) {
    fail(`Track directory not found: ${TRACK_DIR}`);
  }

  const files = fs.readdirSync(TRACK_DIR).filter((f) => f.endsWith(".mp3"));
  const piko = loadJSON(PIKO_JSON);
  const musician = loadJSON(MUSICIAN_JSON);

  const referenced = new Set([
    ...piko.map((t) => (t.src || "").replace("/audio/tracks/", "")),
    ...musician.map((t) => (t.src || "").replace("/audio/tracks/", "")),
  ]);

  for (const file of referenced) {
    if (!file) {
      fail("Found an empty track src value in JSON data.");
    }
    if (!files.includes(file)) {
      fail(`Referenced track missing: ${file}`);
    }
  }

  console.log("[validate-tracks] Track validation passed.");
}

main();
