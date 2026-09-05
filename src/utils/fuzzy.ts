export function fuzzyMatch(target: string, input: string): number {
  const a = target.toLowerCase().trim();
  const b = input.toLowerCase().trim();
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  let ai = 0;
  for (let bi = 0; bi < b.length && ai < a.length; bi++) {
    if (a[ai] === b[bi]) ai++;
  }
  const sequential = ai / Math.max(a.length, b.length);
  const shared = b.split("").filter((c) => a.includes(c)).length / b.length;
  return Math.max(sequential, shared);
}

export function bestMatch(items: any[], input: string): any {
  if (!input || !items.length) return null;
  let best = null;
  let bestScore = 0;
  for (const item of items) {
    const score = fuzzyMatch(item.name || item.label || "", input);
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore >= 0.4 ? best : null;
}
