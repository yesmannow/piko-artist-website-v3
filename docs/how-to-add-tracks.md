# How to Add New Tracks to the Studio

The Studio uses local MP3 files stored in:

```
public/audio/tracks/*.mp3
```

Track metadata lives in:

```
src/data/piko-tracks.json
src/data/musician_tracks.json
```

Follow these steps exactly.

---

# 1. Add the MP3 File

Place your file here:

```
public/audio/tracks/my-new-track.mp3
```

---

# 2. Add Metadata to Both JSON Files

Add this object to both JSON files:

```json
{
  "trackId": "my-new-track",
  "title": "My New Track",
  "src": "/audio/tracks/my-new-track.mp3",
  "artist": "Unknown Artist",
  "bpm": 0,
  "energy": 0.5,
  "key": "C",
  "genre": "Unknown",
  "mood": "Neutral"
}
```

---

# 3. Run the Track Integrity Checker

```bash
node scripts/check-tracks.js
```

You should see:

- 0 missing tracks
- 0 unused tracks

---

# 4. Run the Build Validator

```bash
npm run validate:tracks
```

This will fail the build if:

- The MP3 file is missing
- The JSON entry is missing
- The filename is wrong

---

# 5. Test the Studio

```bash
npm run dev
```

Visit:

```
http://localhost:3000/studio
```

Confirm:

- Track appears in the library
- Waveform renders
- Seeking works
- No worker errors

---

# 6. Run Regression Test

```bash
npm run test:e2e
```

---

# 7. Commit Your Changes

```
feat(studio): add new track "My New Track"
```
