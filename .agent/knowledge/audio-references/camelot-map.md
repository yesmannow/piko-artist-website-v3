# Camelot Key Mapping — Complete Reference

> **Usage**: Reference this map when calculating compatibility scores in the Smart Match column of the TrackLibrary.
>
> **System**: The Camelot Wheel (also known as the Harmonic Mixing Wheel) organizes all 24 musical keys into a circular chart where adjacent keys are harmonically compatible.

---

## Complete Mapping Table

| Musical Key (Minor) | Camelot (Minor) | Musical Key (Major) | Camelot (Major) |
|---|---|---|---|
| A♭m / G#m | **1A** | B Major | **1B** |
| E♭m / D#m | **2A** | F# / G♭ Major | **2B** |
| B♭m / A#m | **3A** | D♭ / C# Major | **3B** |
| Fm | **4A** | A♭ / G# Major | **4B** |
| Cm | **5A** | E♭ / D# Major | **5B** |
| Gm | **6A** | B♭ / A# Major | **6B** |
| Dm | **7A** | F Major | **7B** |
| Am | **8A** | C Major | **8B** |
| Em | **9A** | G Major | **9B** |
| Bm | **10A** | D Major | **10B** |
| F#m / G♭m | **11A** | A Major | **11B** |
| C#m / D♭m | **12A** | E Major | **12B** |

---

## Harmonic Compatibility Rules

### 1. Perfect Match (Score: 1.0)
- **Same key** → e.g., `8A → 8A` (Am → Am)

### 2. Adjacent Keys (Score: 0.9)
- **+1 / -1 on the wheel** (same letter) → e.g., `8A → 7A` (Am → Dm) or `8A → 9A` (Am → Em)

### 3. Relative Major/Minor (Score: 0.85)
- **Same number, switch letter** → e.g., `8A → 8B` (Am → C Major)

### 4. Energy Boost (+1, same letter) (Score: 0.8)
- Moving **up** one position on the wheel boosts energy while staying compatible

### 5. Semi-Compatible (±2) (Score: 0.6)
- Two steps away on the wheel → still mixable with caution

### 6. Incompatible (Score: < 0.3)
- Keys more than 2 steps away or across the wheel

---

## Compatibility Score Algorithm

```typescript
function camelotCompatibility(keyA: string, keyB: string): number {
  // Parse Camelot codes
  const parseCode = (code: string) => {
    const match = code.match(/^(\d{1,2})([AB])$/);
    if (!match) return null;
    return { number: parseInt(match[1]), letter: match[2] as 'A' | 'B' };
  };

  const a = parseCode(keyA);
  const b = parseCode(keyB);
  if (!a || !b) return 0;

  // Same key
  if (a.number === b.number && a.letter === b.letter) return 1.0;

  // Relative major/minor (same number, different letter)
  if (a.number === b.number && a.letter !== b.letter) return 0.85;

  // Adjacent keys (same letter)
  if (a.letter === b.letter) {
    const diff = Math.abs(a.number - b.number);
    const circularDiff = Math.min(diff, 12 - diff);
    if (circularDiff === 1) return 0.9;
    if (circularDiff === 2) return 0.6;
    if (circularDiff === 7) return 0.5; // Dominant relationship
  }

  // Adjacent keys (different letter, ±1 number)
  if (a.letter !== b.letter) {
    const diff = Math.abs(a.number - b.number);
    const circularDiff = Math.min(diff, 12 - diff);
    if (circularDiff === 1) return 0.7;
  }

  return 0.2; // Incompatible
}
```

---

## Musical Key → Camelot Lookup Map

```typescript
const KEY_TO_CAMELOT: Record<string, string> = {
  // Minor Keys
  'Abm': '1A', 'G#m': '1A',
  'Ebm': '2A', 'D#m': '2A',
  'Bbm': '3A', 'A#m': '3A',
  'Fm':  '4A',
  'Cm':  '5A',
  'Gm':  '6A',
  'Dm':  '7A',
  'Am':  '8A',
  'Em':  '9A',
  'Bm':  '10A',
  'F#m': '11A', 'Gbm': '11A',
  'C#m': '12A', 'Dbm': '12A',

  // Major Keys
  'B':   '1B',
  'F#':  '2B', 'Gb':  '2B',
  'Db':  '3B', 'C#':  '3B',
  'Ab':  '4B', 'G#':  '4B',
  'Eb':  '5B', 'D#':  '5B',
  'Bb':  '6B', 'A#':  '6B',
  'F':   '7B',
  'C':   '8B',
  'G':   '9B',
  'D':   '10B',
  'A':   '11B',
  'E':   '12B',
};
```

---

## Camelot Wheel Visualization

```
        12B(E)
     11B(A)   1B(B)
   10B(D)       2B(F#)
  9B(G)           3B(Db)
   8B(C)        4B(Ab)
     7B(F)    5B(Eb)
        6B(Bb)

        12A(C#m)
     11A(F#m)  1A(Abm)
   10A(Bm)       2A(Ebm)
  9A(Em)           3A(Bbm)
   8A(Am)        4A(Fm)
     7A(Dm)    5A(Cm)
        6A(Gm)
```

Inner ring = A (minor), Outer ring = B (major).
Adjacent keys on the same ring or across rings at the same position are harmonically compatible.
