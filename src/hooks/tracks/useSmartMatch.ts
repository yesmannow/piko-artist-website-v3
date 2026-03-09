import { useLibraryStore } from '@/store/libraryStore';
import { useDeckStore } from '@/store/deckStore';

export function useSmartMatch() {
  const { tracks } = useLibraryStore();
  const { deckA } = useDeckStore();

  const getHarmonicMatches = () => {
    const currentCamelot = deckA?.track?.key;
    if (!currentCamelot || currentCamelot === '??') return tracks;

    const match = currentCamelot.match(/^(\d+)([AB])$/);
    if (!match) return tracks;

    const [, numStr, letter] = match;
    const num = parseInt(numStr, 10);
    const oppositeLetter = letter === 'A' ? 'B' : 'A';

    const prevNum = num === 1 ? 12 : num - 1;
    const nextNum = num === 12 ? 1 : num + 1;

    const compatibleKeys = new Set([
      currentCamelot,
      `${num}${oppositeLetter}`,
      `${prevNum}${letter}`,
      `${nextNum}${letter}`,
    ]);

    return tracks.filter(track => {
      if (!track.key) return false;
      return compatibleKeys.has(track.key) || track.key.includes(currentCamelot);
    });
  };

  return { getHarmonicMatches };
}
