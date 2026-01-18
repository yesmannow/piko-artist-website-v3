export function getCamelotCompatibility(
  a?: string | null,
  b?: string | null,
): number {
  if (!a || !b) return 50;
  const matchA = /^(\d{1,2})([AB])$/i.exec(a);
  const matchB = /^(\d{1,2})([AB])$/i.exec(b);
  if (!matchA || !matchB) return 50;

  const numA = parseInt(matchA[1], 10);
  const numB = parseInt(matchB[1], 10);
  const letterA = matchA[2].toUpperCase();
  const letterB = matchB[2].toUpperCase();

  const adjacent = Math.abs(numA - numB) === 1 || Math.abs(numA - numB) === 11;
  const same = numA === numB && letterA === letterB;
  const parallel = numA === numB && letterA !== letterB;

  if (same) return 100;
  if (parallel) return 85;
  if (adjacent && letterA === letterB) return 80;
  if (adjacent) return 65;
  return 40;
}
