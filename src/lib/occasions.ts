import { lunarToSolar } from "./lunar";

export type OccasionKind = "tet" | "midautumn" | "qixi" | "valentine" | "women" | "whiteValentine" | "vnWomen" | "christmas" | "days100" | "anniversary" | "birthday";
export type Occasion = { kind: OccasionKind; date: Date; days: number; year: number; count?: number; name?: string };

const DAY = 86400000;
export function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
export function diffDays(a: Date, b: Date) { return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY); }

/** Today's calendar date in a given IANA timezone, as a local-midnight Date. */
export function todayIn(tz = "Asia/Ho_Chi_Minh", now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now).split("-").map(Number);
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
}
export function hourIn(tz = "Asia/Ho_Chi_Minh", now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now));
}
export function parseDate(s: string) { const [y, m, d] = s.split("-").map(Number); return new Date(y!, m! - 1, d!); }

/** All occasions from today onwards (within ~13 months), soonest first. */
export function upcomingOccasions(today: Date, opts: { startDate?: string | null; birthdays?: { name: string; date: string }[] } = {}): Occasion[] {
  const out: Occasion[] = [];
  const push = (kind: OccasionKind, date: Date, extra: Partial<Occasion> = {}) => {
    const days = diffDays(date, today);
    if (days >= 0 && days <= 400) out.push({ kind, date, days, year: date.getFullYear(), ...extra });
  };
  for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
    push("tet", lunarToSolar(1, 1, y));
    push("midautumn", lunarToSolar(15, 8, y));
    push("qixi", lunarToSolar(7, 7, y));
    push("valentine", new Date(y, 1, 14));
    push("women", new Date(y, 2, 8));
    push("whiteValentine", new Date(y, 2, 14));
    push("vnWomen", new Date(y, 9, 20));
    push("christmas", new Date(y, 11, 24));
    for (const b of opts.birthdays ?? []) { const d = parseDate(b.date); push("birthday", new Date(y, d.getMonth(), d.getDate()), { name: b.name }); }
  }
  if (opts.startDate) {
    const s = parseDate(opts.startDate);
    const together = diffDays(today, s);
    const next100 = (Math.floor(together / 100) + 1) * 100;
    push("days100", new Date(s.getTime() + next100 * DAY), { count: next100 });
    for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
      const n = y - s.getFullYear();
      if (n >= 1) push("anniversary", new Date(y, s.getMonth(), s.getDate()), { count: n });
    }
  }
  return out.sort((a, b) => a.days - b.days);
}

/** Milestone reached today (for the one-time burst). */
export function milestoneToday(daysTogether: number, streak: number, today: Date, startDate?: string | null): string | null {
  if ([7, 30, 100].includes(streak)) return `streak-${streak}`;
  if (daysTogether > 0 && daysTogether % 100 === 0) return `days-${daysTogether}`;
  if (startDate) { const s = parseDate(startDate); if (today.getMonth() === s.getMonth() && today.getDate() === s.getDate() && today.getFullYear() > s.getFullYear()) return `anniv-${today.getFullYear()}`; }
  return null;
}
