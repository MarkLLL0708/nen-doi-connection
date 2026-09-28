import { useEffect, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue, type PanInfo } from "motion/react";
import { useTranslation } from "react-i18next";
import { Heart, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic, Pressable, spring } from "./motion";

export type SwipeDir = "left" | "right";
const THRESHOLD = 110;
const FLICK = 600;
const OFF = 520;

/**
 * Physics swipe deck. Cards rotate with drag (up to 12deg), fly off past a threshold or on a flick,
 * snap back otherwise. Stamps and a colour wash grow with drag distance. Buttons and undo reuse the same motion.
 */
export function SwipeDeck<T>({ items, getKey, renderCard, onSwipe, className, cardClassName }: {
  items: T[]; getKey: (item: T) => string; renderCard: (item: T) => ReactNode;
  onSwipe?: (item: T, dir: SwipeDir) => void; className?: string; cardClassName?: string | ((item: T) => string);
}) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<SwipeDir[]>([]);
  const [busy, setBusy] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-12, 0, 12]);
  const likeO = useTransform(x, [20, THRESHOLD], [0, 1]);
  const skipO = useTransform(x, [-THRESHOLD, -20], [1, 0]);
  const washLike = useTransform(x, [0, 220], [0, 0.55]);
  const washSkip = useTransform(x, [-220, 0], [0.55, 0]);
  const nextScale = useTransform(x, [-200, 0, 200], [1, 0.94, 1]);
  const nextY = useTransform(x, [-200, 0, 200], [0, 14, 0]);

  const remaining = items.length - index;
  const visible = items.slice(index, index + 3);

  const fly = async (dir: SwipeDir, velocity = 0) => {
    if (busy || remaining <= 0) return;
    setBusy(true); haptic();
    const target = dir === "right" ? OFF : -OFF;
    await animate(x, target, reduce ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30, velocity });
    const cur = items[index]; if (cur !== undefined) onSwipe?.(cur, dir);
    setHistory((h) => [...h, dir]);
    x.set(0); setIndex((i) => i + 1); setBusy(false);
  };

  const undo = async () => {
    if (busy || history.length === 0) return;
    const dir = history[history.length - 1];
    setBusy(true); haptic();
    setHistory((h) => h.slice(0, -1));
    x.set(dir === "right" ? OFF : -OFF);
    setIndex((i) => i - 1);
    await animate(x, 0, reduce ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 26 });
    setBusy(false);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > THRESHOLD || velocity.x > FLICK) void fly("right", velocity.x);
    else if (offset.x < -THRESHOLD || velocity.x < -FLICK) void fly("left", velocity.x);
    else void animate(x, 0, spring);
  };

  useEffect(() => { if (index > items.length) setIndex(items.length); }, [index, items.length]);

  return <div className={cn("relative", className)}>
    <div className="relative h-[400px]">
      <motion.div aria-hidden="true" className="block-ember pointer-events-none absolute -inset-3 rounded-[32px]" style={{ opacity: washLike }} />
      <motion.div aria-hidden="true" className="block-ink pointer-events-none absolute -inset-3 rounded-[32px]" style={{ opacity: washSkip }} />
      {remaining === 0 && <div className="absolute inset-0 grid place-items-center rounded-[28px] bg-surface p-8 text-center"><p className="type-title">{t("cb.deckDone")}</p></div>}
      {[...visible].reverse().map((item, revI) => {
        const depth = visible.length - 1 - revI;
        const cls = typeof cardClassName === "function" ? cardClassName(item) : cardClassName;
        if (depth === 0) return <motion.div key={getKey(item)} data-testid="deck-top" drag={busy ? false : "x"} dragMomentum={false} onDragEnd={onDragEnd}
          style={{ x, rotate, touchAction: "pan-y" }} whileDrag={{ cursor: "grabbing" }}
          className={cn("grain absolute inset-0 z-10 flex cursor-grab select-none flex-col rounded-[28px] p-6 shadow-float", cls)}>
          <Stamp label={t("cb.like")} opacity={likeO} side="right" colour="var(--ember)" />
          <Stamp label={t("cb.skip")} opacity={skipO} side="left" colour="var(--ink)" />
          {renderCard(item)}
        </motion.div>;
        return <PeekCard key={getKey(item)} depth={depth} scale={depth === 1 ? nextScale : undefined} y={depth === 1 ? nextY : undefined} className={cls}>{renderCard(item)}</PeekCard>;
      })}
    </div>
    <div className="mt-6 flex items-center justify-center gap-4">
      <Pressable aria-label={t("cb.skipBtn")} onClick={() => void fly("left")} disabled={remaining === 0} className="block-ink grid size-16 place-items-center rounded-full disabled:opacity-40"><X strokeWidth={2.5} className="size-7" /></Pressable>
      <Pressable aria-label={t("cb.undo")} onClick={() => void undo()} disabled={history.length === 0} className="grid size-12 place-items-center rounded-full bg-surface text-foreground disabled:opacity-40"><RotateCcw strokeWidth={2.5} className="size-5" /></Pressable>
      <Pressable aria-label={t("cb.likeBtn")} onClick={() => void fly("right")} disabled={remaining === 0} className="block-ember grid size-16 place-items-center rounded-full disabled:opacity-40"><Heart strokeWidth={2.5} className="size-7" /></Pressable>
    </div>
    <p className="mt-3 text-center type-caption text-muted-foreground" aria-live="polite">{t("cb.deckLeft", { count: remaining })}</p>
  </div>;
}

function Stamp({ label, opacity, side, colour }: { label: string; opacity: MotionValue<number>; side: "left" | "right"; colour: string }) {
  return <motion.span aria-hidden="true" style={{ opacity, color: colour, boxShadow: `inset 0 0 0 3px ${colour}` }} className={cn("block-cream type-button absolute top-6 z-20 rounded-[12px] px-4 py-2 text-[20px] tracking-[0.04em]", side === "left" ? "left-6" : "right-6")}>{label}</motion.span>;
}

function PeekCard({ children, depth, scale, y, className }: { children: ReactNode; depth: number; scale?: MotionValue<number> | undefined; y?: MotionValue<number> | undefined; className?: string | undefined }) {
  const s = 1 - depth * 0.06, off = depth * 14;
  return <motion.div aria-hidden="true" style={{ scale: scale ?? s, y: y ?? off, zIndex: 10 - depth }} className={cn("grain absolute inset-0 flex flex-col rounded-[28px] p-6", className)}>
    <div className="flex flex-1 flex-col opacity-60">{children}</div>
  </motion.div>;
}
