import { PRODUCT_NAME, PRODUCT_WORDMARK } from "@/config/product";

/** Builds a 1080×1920 Colour Block result card (no names, answers or photos) and shares or downloads it. */
export async function shareResultCard(opts: { tone: string; label: string; score: string; verdict: string; fileName: string }) {
  const blob = await renderCard(opts);
  const file = new File([blob], `${opts.fileName}.png`, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: PRODUCT_NAME }); return "shared" as const; }
    catch (e) { if ((e as Error).name === "AbortError") return "cancelled" as const; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded" as const;
}

export async function renderCard({ tone, label, score, verdict }: { tone: string; label: string; score: string; verdict: string }): Promise<Blob> {
  const W = 1080, H = 1920, P = 96;
  const css = getComputedStyle(document.documentElement);
  const name = tone.replace("block-", "");
  const bg = css.getPropertyValue(`--${name}`).trim() || "#FFD447";
  const fg = css.getPropertyValue(`--on-${name}`).trim() || "#121212";
  await Promise.all([
    document.fonts.load('800 200px "Unbounded"'), document.fonts.load('700 48px "Plus Jakarta Sans"'),
  ]).catch(() => undefined);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // 3% grain
  for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"; g.fillRect(Math.random() * W, Math.random() * H, 3, 3); }
  g.fillStyle = fg; g.textBaseline = "alphabetic";
  g.font = '700 44px "Plus Jakarta Sans", sans-serif';
  g.fillText(label.toUpperCase(), P, 220);
  // Big score, auto-fit to width
  let size = 420;
  do { g.font = `800 ${size}px "Unbounded", sans-serif`; size -= 10; } while (g.measureText(score).width > W - P * 2 && size > 80);
  g.fillText(score, P, 900);
  // Verdict, wrapped
  g.font = '800 64px "Unbounded", sans-serif';
  let y = 1100; let line = "";
  for (const w of verdict.split(" ")) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > W - P * 2 && line) { g.fillText(line, P, y); y += 88; line = w; } else line = test;
  }
  if (line) g.fillText(line, P, y);
  g.font = '800 72px "Unbounded", sans-serif';
  g.fillText(PRODUCT_WORDMARK, P, H - P - 20);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("no image"))), "image/png"));
}
