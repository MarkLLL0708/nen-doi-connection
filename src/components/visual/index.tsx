import { useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, Camera, Heart, House, Puzzle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlameGlyph } from "./FlameGlyph";

export { FlameGlyph };
export const ease = [0.22, 0.61, 0.36, 1] as const;
export const ICON_STROKE = 1.5;

export function Wordmark({ text, className }: { text: string; className?: string }) {
  return <span className={cn("type-title text-foreground", className)}>{text}</span>;
}

export function PrimaryButton({ className, children, arrow = true, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { arrow?: boolean }) {
  return <button className={cn("group inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[16px] bg-primary px-6 type-button text-primary-foreground transition-[opacity,transform] duration-300 ease-[var(--ease-soft)] hover:opacity-90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40", className)} {...props}>
    {children}{arrow && <ArrowRight strokeWidth={ICON_STROKE} className="size-[18px] transition-transform duration-300 group-hover:translate-x-0.5" />}
  </button>;
}

export function TextButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex h-11 items-center type-button text-foreground underline decoration-foreground/30 underline-offset-[6px] transition-colors duration-300 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm", className)} {...props}>{children}</button>;
}

export function Tag({ children, accent = false, className }: { children: ReactNode; accent?: boolean; className?: string }) {
  return <span className={cn("inline-flex w-fit items-center rounded-full px-3 py-1 type-label", accent ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground", className)}>{children}</span>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[16px] border border-hairline bg-card p-6 text-card-foreground backdrop-blur-sm", className)}>{children}</div>;
}

export const Hairline = ({ className }: { className?: string }) => <div role="separator" className={cn("h-px w-full bg-hairline", className)} />;

export type DuotoneName = "memory" | "food" | "tet" | "distance" | "deep" | "fun";
export const duotones: DuotoneName[] = ["memory", "food", "tet", "distance", "deep", "fun"];
const duoClass: Record<DuotoneName | "photo", string> = { memory: "duo-memory", food: "duo-food", tet: "duo-tet", distance: "duo-distance", deep: "duo-deep", fun: "duo-fun", photo: "duo-photo" };

export function DuotoneScreen({ tone, children, className }: { tone: DuotoneName; children: ReactNode; className?: string }) {
  return <div className={cn("grain flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[16px] p-6 text-duo-foreground", duoClass[tone], className)}><div className="relative z-[2] flex flex-1 flex-col justify-between">{children}</div></div>;
}

export function ImageSlot({ tone = "photo", className, label }: { tone?: DuotoneName | "photo"; className?: string; label?: string }) {
  const { t } = useTranslation();
  return <div role="img" aria-label={t("image.alt")} className={cn("grain flex items-end overflow-hidden rounded-[16px]", duoClass[tone], className)}>
    <span className="relative z-[2] m-4 type-label text-duo-foreground/80">{label ?? t("image.placeholder")}</span>
  </div>;
}

export function BottomSheet({ open, onOpenChange, dark, children }: { open: boolean; onOpenChange: (open: boolean) => void; dark?: boolean; children: ReactNode }) {
  const { t } = useTranslation();
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <div className={dark ? "dark" : undefined}>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-500" />
      <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] rounded-t-[24px] bg-background px-6 pb-10 pt-3 text-foreground shadow-sheet outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:duration-500 data-[state=closed]:duration-300">
        <div className="mx-auto mb-8 h-1 w-9 rounded-full bg-hairline" />
        <Dialog.Title className="sr-only">{t("sheet.title")}</Dialog.Title>
        <Dialog.Description className="sr-only">{t("sheet.body")}</Dialog.Description>
        {children}
      </Dialog.Content>
    </div>
  </Dialog.Portal></Dialog.Root>;
}

function Portrait({ initial, tone, done }: { initial: string; tone: DuotoneName | "photo"; done: boolean }) {
  return <span className={cn("grain relative grid size-14 place-items-center overflow-hidden rounded-full ring-1 ring-offset-[3px] ring-offset-background transition-[box-shadow] duration-500", duoClass[tone], done ? "ring-gold" : "ring-hairline")}>
    <span className="relative z-[2] font-serif type-body text-duo-foreground">{initial}</span>
  </span>;
}

export function AvatarPair({ firstDone = true, secondDone = false }: { firstDone?: boolean; secondDone?: boolean }) {
  const { t } = useTranslation();
  const you = t("avatars.you"), partner = t("avatars.partner");
  return <div className="flex items-center gap-5">
    <div className="flex -space-x-3"><Portrait initial={you.charAt(0)} tone="photo" done={firstDone} /><Portrait initial={partner.charAt(0)} tone="memory" done={secondDone} /></div>
    <div className="flex flex-col gap-0.5 type-body">
      <span className="text-foreground">{you} <span className="text-muted-foreground">· {t(firstDone ? "avatars.done" : "avatars.waiting")}</span></span>
      <span className="text-foreground">{partner} <span className="text-muted-foreground">· {t(secondDone ? "avatars.done" : "avatars.waiting")}</span></span>
    </div>
  </div>;
}

export function FlameStreak({ count = 27, atRisk = false }: { count?: number; atRisk?: boolean }) {
  const { t } = useTranslation();
  return <div className="flex items-center gap-3.5">
    <FlameGlyph streak={count} atRisk={atRisk} size={30} />
    <p className="type-body text-foreground">{t("streak.days", { count })}<span className="text-muted-foreground"> · {t(atRisk ? "streak.risk" : "streak.steady")}</span></p>
  </div>;
}

export function EmptyState() {
  const { t } = useTranslation();
  return <div className="flex flex-col items-start gap-5 py-6">
    <Camera strokeWidth={ICON_STROKE} className="size-7 text-muted-foreground" aria-hidden="true" />
    <div><p className="type-title text-foreground">{t("empty.title")}</p><p className="mt-2 max-w-[280px] type-body text-muted-foreground">{t("empty.body")}</p></div>
  </div>;
}

/** Soft radial warm light that replaces confetti. */
export function LightBloom({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
    <AnimatePresence>{active && <motion.div key="bloom" className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, var(--color-glow) 0%, transparent 60%)" }}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.4 }} animate={{ opacity: 0.9, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 1.4, ease }} />}</AnimatePresence>
  </div>;
}

export function SwipeCard({ onSwipe }: { onSwipe?: (direction: "left" | "right") => void }) {
  const { t } = useTranslation();
  const [key, setKey] = useState(0);
  return <motion.div key={key} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} dragTransition={{ bounceStiffness: 120, bounceDamping: 30 }}
    onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) { onSwipe?.(info.offset.x < 0 ? "left" : "right"); setKey((v) => v + 1); } }}
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}
    className="touch-pan-y cursor-grab select-none active:cursor-grabbing" aria-label={t("swipe.label")}>
    <DuotoneScreen tone="food" className="min-h-[300px]">
      <span className="type-label text-duo-foreground/75">{t("sheet.label")}</span>
      <div><h3 className="type-title">{t("sheet.title")}</h3><p className="mt-3 type-body text-duo-foreground/80">{t("sheet.body")}</p></div>
    </DuotoneScreen>
  </motion.div>;
}

export const tabs = [{ key: "home", Icon: House }, { key: "play", Icon: Puzzle }, { key: "date", Icon: Heart }, { key: "memories", Icon: BookOpen }, { key: "settings", Icon: Settings }] as const;
export type TabKey = typeof tabs[number]["key"];

export function BottomTabBar({ active = "home", onSelect, className }: { active?: TabKey; onSelect?: (tab: TabKey) => void; className?: string }) {
  const { t } = useTranslation();
  return <nav aria-label={t("navigationLabel")} className={cn("flex h-[68px] items-center justify-around border-t border-hairline bg-nav px-2 pb-1 backdrop-blur-xl", className)}>
    {tabs.map(({ key, Icon }) => { const on = active === key; return <button key={key} aria-current={on ? "page" : undefined} onClick={() => onSelect?.(key)} className={cn("flex w-16 flex-col items-center gap-1 rounded-md py-1.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
      <Icon strokeWidth={ICON_STROKE} className="size-[22px]" aria-hidden="true" />
      <span className="type-label">{t(`tabs.${key}`)}</span>
      <span className={cn("h-[3px] w-[3px] rounded-full bg-accent transition-opacity duration-300", on ? "opacity-100" : "opacity-0")} />
    </button>; })}
  </nav>;
}

export function FadeUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay, ease }}>{children}</motion.div>;
}
