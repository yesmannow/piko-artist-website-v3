export function hashStringToInt(input: string): number {
  // djb2 (fast, stable)
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  // force 32-bit
  return hash | 0;
}
