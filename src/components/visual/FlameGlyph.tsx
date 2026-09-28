import { cn } from "@/lib/utils";

/** Minimal single-path flame. Glow brightens with streak length and dims when at risk. */
export function FlameGlyph({ streak = 7, atRisk = false, size = 28, className }: { streak?: number; atRisk?: boolean; size?: number; className?: string }) {
  const strength = atRisk ? 0.25 : Math.min(1, 0.45 + streak / 60);
  return (
    <span aria-hidden="true" className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <span className="flame-glow absolute rounded-full" style={{ inset: -size * 0.45, background: "radial-gradient(circle, var(--color-glow) 0%, transparent 65%)", ["--glow-o" as string]: strength }} />
      <svg viewBox="0 0 24 32" width={size * 0.75} height={size} className={cn("relative", !atRisk && "flame-sway")} style={{ opacity: atRisk ? 0.45 : 1 }}>
        <path d="M12 1.5c.9 4.6 5.3 7.6 7.2 12.2 2.3 5.7-.9 12.8-7.2 12.8S2.5 19.6 4.9 14.3c1-2.2 2.5-3.5 3.3-5.3.4 2.6 1.4 4 2.7 4.5C10.6 9.4 11 5.2 12 1.5Z" fill="var(--color-flame)" />
      </svg>
    </span>
  );
}
