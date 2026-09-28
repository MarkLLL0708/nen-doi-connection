/**
 * Vietnamese lunar calendar (Hồ Ngọc Đức's algorithm, timezone UTC+7).
 * Vietnam uses UTC+7, so a few dates differ from the Chinese (UTC+8) calendar;
 * this is why a Chinese lunar library is not used.
 */
const PI = Math.PI;
const TZ = 7;

function jdFromDate(dd: number, mm: number, yy: number) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

function jdToDate(jd: number): [number, number, number] {
  let b: number, c: number;
  if (jd > 2299160) { const a = jd + 32044; b = Math.floor((4 * a + 3) / 146097); c = a - Math.floor((b * 146097) / 4); }
  else { b = 0; c = jd + 32082; }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return [e - Math.floor((153 * m + 2) / 5) + 1, m + 3 - 12 * Math.floor(m / 10), b * 100 + d - 4800 + Math.floor(m / 10)];
}

function newMoonDay(k: number) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 += 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Math.floor(jd1 + C1 - deltat + 0.5 + TZ / 24);
}

function sunLongitude(jdn: number) {
  const T = (jdn - 2451545.5 - TZ / 24) / 36525, T2 = T * T, dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - PI * 2 * Math.floor(L / (PI * 2));
  return Math.floor((L / PI) * 6);
}

function lunarMonth11(yy: number) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  const nm = newMoonDay(k);
  return sunLongitude(nm) >= 9 ? newMoonDay(k - 1) : nm;
}

function leapMonthOffset(a11: number) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1, arc = sunLongitude(newMoonDay(k + i));
  do { last = arc; i++; arc = sunLongitude(newMoonDay(k + i)); } while (arc !== last && i < 14);
  return i - 1;
}

/** Lunar date (Vietnam) -> Gregorian Date (local midnight). */
export function lunarToSolar(day: number, month: number, year: number, leap = false): Date {
  let a11: number, b11: number;
  if (month < 11) { a11 = lunarMonth11(year - 1); b11 = lunarMonth11(year); }
  else { a11 = lunarMonth11(year); b11 = lunarMonth11(year + 1); }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = month - 11; if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = leapMonthOffset(a11);
    let leapMonth = leapOff - 2; if (leapMonth < 0) leapMonth += 12;
    if (leap && month !== leapMonth) throw new Error("invalid leap month");
    if (leap || off >= leapOff) off += 1;
  }
  const [d, m, y] = jdToDate(newMoonDay(k + off) + day - 1);
  return new Date(y, m - 1, d);
}
