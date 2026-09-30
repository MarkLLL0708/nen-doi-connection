import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const colours = ["var(--ember)", "var(--butter)", "var(--plum)", "var(--blush)"];
const HEART = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 5.3 3.2 1.7-2 3.1-3.2 5.3-3.2 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";
const FLAME = "M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-4.6.2 1.8 1 2.8 2.1 3.1C11 8.8 11 5.4 12 2z";

type Piece = { id: number; x: number; y: number; r: number; c: string; heart: boolean; size: number; delay: number };

/** Sync moment only: solid hearts and flames explode from the touch circle's centre, grow, spin a little, fade. */
export function ThumbBurst({ fire }: { fire: number }) {
  const reduce = useReducedMotion();
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    if (!fire || reduce) return;
    const n = 26;
    setPieces(Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const d = (i % 2 ? 150 : 210) + Math.random() * 60;
      return { id: fire * 100 + i, x: Math.cos(a) * d, y: Math.sin(a) * d, r: (Math.random() - 0.5) * 70,
        c: colours[i % colours.length]!, heart: i % 3 !== 2, size: 26 + Math.random() * 22, delay: (i % 3) * 0.05 };
    }));
    const id = window.setTimeout(() => setPieces([]), 1600);
    return () => window.clearTimeout(id);
  }, [fire, reduce]);
  return <div data-testid="thumb-burst" data-count={pieces.length} aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-0">
    {pieces.map((p) => <motion.svg key={p.id} viewBox="0 0 24 24" width={p.size} height={p.size} className="absolute"
      style={{ left: -p.size / 2, top: -p.size / 2, fill: p.c }}
      initial={{ x: 0, y: 0, scale: 0.2, rotate: 0, opacity: 1 }}
      animate={{ x: p.x, y: p.y, scale: [0.2, 1.5, 1.1], rotate: p.r, opacity: [1, 1, 0] }}
      transition={{ duration: 1.3, delay: p.delay, times: [0, 0.4, 1], ease: "easeOut" }}>
      <path d={p.heart ? HEART : FLAME} />
    </motion.svg>)}
  </div>;
}
