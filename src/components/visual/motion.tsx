import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type MouseEvent } from "react";
import { AnimatePresence, animate, motion, useInView, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Shared motion tokens: snappy by default, overshoot only on key moments. */
export const spring = { type: "spring", stiffness: 400, damping: 28 } as const;
export const snap = [0.2, 0, 0, 1] as const;
export const overshoot = [0.34, 1.4, 0.64, 1] as const;

export function haptic(ms = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(ms); } catch { /* unsupported */ } }
}

/** Every tappable element: scale to 0.96 on press, spring back with a small overshoot. */
export function Pressable({ className, haptics = false, onClick, children, ...props }: HTMLMotionProps<"button"> & { haptics?: boolean }) {
  const reduce = useReducedMotion();
  return <motion.button whileTap={reduce ? {} : { scale: 0.96 }} transition={spring}
    onClick={(e) => { if (haptics) haptic(); onClick?.(e); }} className={className} {...props}>{children}</motion.button>;
}

/** Shrinks a single line (e.g. a big numeral) until it fits its container. Never wraps, never clips. */
export function FitText({ children, measure, max = 140, min = 24, className, style }: { children: ReactNode; measure?: string; max?: number; min?: number; className?: string; style?: CSSProperties }) {
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(max);
  const fit = useCallback(() => {
    const b = box.current, t = measure ? probe.current : text.current; if (!b || !t) return;
    t.style.fontSize = `${max}px`;
    const natural = t.scrollWidth, avail = b.clientWidth;
    const next = natural > avail ? Math.max(min, Math.floor((max * avail) / natural) - 1) : max;
    t.style.fontSize = `${next}px`; if (text.current) text.current.style.fontSize = `${next}px`; setSize(next);
  }, [max, min, measure]);
  useLayoutEffect(() => { fit(); }, [fit, children]);
  useEffect(() => {
    const b = box.current; if (!b) return;
    const ro = new ResizeObserver(() => fit()); ro.observe(b);
    void document.fonts?.ready.then(() => fit());
    return () => ro.disconnect();
  }, [fit]);
  return <div ref={box} className={cn("relative w-full min-w-0", className)} style={style}>
    {measure && <span ref={probe} aria-hidden="true" className="type-numeral invisible absolute left-0 top-0">{measure}</span>}
    <span ref={text} className="type-numeral inline-block" style={{ fontSize: size }}>{children}</span>
  </div>;
}

export function formatNumber(n: number, lang: string) {
  return n.toLocaleString(lang.startsWith("vi") ? "vi-VN" : "en-US");
}

/** Counts up once when first in view (700ms ease-out). */
export function CountUp({ to, replayKey = 0 }: { to: number; replayKey?: number }) {
  const { i18n } = useTranslation();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setV(to); return; }
    const c = animate(0, to, { duration: 0.7, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to, reduce, replayKey]);
  return <span ref={ref} className="nums">{formatNumber(v, i18n.language)}</span>;
}

/** Each digit flips odometer-style when the value changes. */
export function Odometer({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const digits = String(value).split("");
  return <span className={cn("nums inline-flex", className)} aria-label={String(value)}>
    {digits.map((d, i) => <span key={digits.length - i} className="relative inline-block overflow-hidden" aria-hidden="true" style={{ lineHeight: 1.15 }}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={d} className="inline-block" initial={reduce ? { opacity: 0 } : { y: "-100%" }} animate={reduce ? { opacity: 1 } : { y: "0%" }} exit={reduce ? { opacity: 0 } : { y: "100%" }} transition={{ duration: 0.3, ease: overshoot }}>{d}</motion.span>
      </AnimatePresence>
    </span>)}
  </span>;
}

/** Continuous scrolling line; pauses under reduced motion (CSS). */
export function Ticker({ text, className }: { text: string; className?: string }) {
  return <div className={cn("overflow-hidden py-3", className)} role="marquee" aria-label={text}>
    <div className="ticker-track" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span key={i} className="type-button whitespace-nowrap pr-3 text-[16px]">{text}</span>)}</div>
  </div>;
}

/** Headline that slides up from a mask line. Extra padding keeps stacked tone marks and dots below visible. */
export function SlideUp({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <span className={cn("block pb-[0.2em]", className)} style={{ clipPath: "inset(-60% -10% 0 -10%)" }}>
    <motion.span className="block" initial={reduce ? { opacity: 0 } : { y: "110%" }} animate={reduce ? { opacity: 1 } : { y: "0%" }} transition={{ duration: 0.35, ease: snap, delay }}>{children}</motion.span>
  </span>;
}

/** Staggered entrance for lists and tiles (40ms apart). */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>{children}</motion.div>;
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} variants={{ hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: snap } } }}>{children}</motion.div>;
}

/** Quick page entrance (slide + fade, 300ms). */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: snap }}>{children}</motion.div>;
}

/** A circle of colour expands from the tap point until it floods the container. */
export function ColourFlood({ at, active, colourClass, onDone }: { at: { x: number; y: number } | null; active: boolean; colourClass: string; onDone?: () => void }) {
  const reduce = useReducedMotion();
  const pos = at ? `${at.x}px ${at.y}px` : "50% 50%";
  return <AnimatePresence>{active && <motion.div key="flood" className={cn("pointer-events-none absolute inset-0 z-0", colourClass)} aria-hidden="true"
    initial={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${pos})` }} animate={reduce ? { opacity: 1 } : { clipPath: `circle(150% at ${pos})` }} exit={{ opacity: 0 }}
    transition={{ duration: reduce ? 0.2 : 0.55, ease: snap }} onAnimationComplete={() => onDone?.()} />}</AnimatePresence>;
}
export function pointFrom(e: MouseEvent<HTMLElement>, container: HTMLElement | null) {
  if (!container) return null;
  const r = container.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

const burstColours = ["var(--ember)", "var(--butter)", "var(--plum)", "var(--blush)", "var(--ink)"];
const burstShapes = ["circle", "square", "moon"] as const;

/** Milestones only: flat geometric shapes shoot outward and fall. Disabled under reduced motion. */
export function GeometricBurst({ fire }: { fire: number }) {
  const reduce = useReducedMotion();
  const [pieces, setPieces] = useState<{ id: number; x: number; y: number; r: number; c: string; s: typeof burstShapes[number]; size: number }[]>([]);
  useEffect(() => {
    if (!fire || reduce) return;
    const next = Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
      const d = 90 + Math.random() * 110;
      return { id: fire * 100 + i, x: Math.cos(a) * d, y: Math.sin(a) * d - 40, r: Math.random() * 360, c: burstColours[i % burstColours.length]!, s: burstShapes[i % 3]!, size: 10 + Math.random() * 10 };
    });
    setPieces(next);
    const id = window.setTimeout(() => setPieces([]), 1500);
    return () => window.clearTimeout(id);
  }, [fire, reduce]);
  return <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center" aria-hidden="true">
    {pieces.map((p) => <motion.span key={p.id} className="absolute" style={{ width: p.size, height: p.s === "moon" ? p.size / 2 : p.size, background: p.c,
      borderRadius: p.s === "circle" ? "999px" : p.s === "moon" ? `${p.size}px ${p.size}px 0 0` : "3px" }}
      initial={{ x: 0, y: 0, scale: 0.4, rotate: 0, opacity: 1 }}
      animate={{ x: [0, p.x, p.x * 1.1], y: [0, p.y, p.y + 180], scale: [0.4, 1, 1], rotate: p.r, opacity: [1, 1, 0] }}
      transition={{ duration: 1.3, times: [0, 0.35, 1], ease: ["easeOut", "easeIn"] }} />)}
  </div>;
}
