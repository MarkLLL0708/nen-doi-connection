/** yyyy-mm-dd for a local-midnight Date. */
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The same `n` items for everyone on a given day, rotating through the list over time. */
export function dailySlice<T>(items: T[], day: string, n: number): T[] {
  if (!items.length) return [];
  const idx = Math.floor(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) / 86400000);
  const start = (idx * n) % items.length;
  return Array.from({ length: Math.min(n, items.length) }, (_, i) => items[(start + i) % items.length]!);
}
