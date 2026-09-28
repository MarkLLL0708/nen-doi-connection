import { useEffect, useState, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, Camera, Check, Clock, Heart, House, Puzzle, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_WORDMARK } from "@/config/product";
import { Odometer, Pressable, spring } from "./motion";

export * from "./motion";
export { SwipeDeck, type SwipeDir } from "./SwipeDeck";
export const ICON_STROKE = 2;

/* ---------- Brand ---------- */

/** Geometric two-tone flame. Pulses (squash & stretch), brighter with a longer streak, dimmed at risk. */
export function FlameMark({ size = 28, streak = 10, atRisk = false, onBlock = false, pulse = true, className }: { size?: number; streak?: number; atRisk?: boolean; onBlock?: boolean; pulse?: boolean; className?: string }) {
  const glow = Math.min(1, 0.55 + streak / 100);
  return <svg width={size} height={size * 1.2} viewBox="0 0 40 48" aria-hidden="true" className={cn(pulse && "flame-pulse", className)}
    style={{ opacity: atRisk ? 0.45 : glow, filter: atRisk ? "grayscale(0.8)" : `saturate(${0.8 + glow * 0.4})` }}>
    <path d="M20 2 C28 12 36 20 36 31 A16 16 0 0 1 4 31 C4 22 10 17 14 10 C16 16 18 18 20 19 C20 13 19 8 20 2 Z" fill={onBlock ? "currentColor" : "var(--ember)"} />
    <path d="M20 24 C25 29 28 33 28 37 A8 8 0 0 1 12 37 C12 32 16 28 20 24 Z" fill="var(--butter)" />
  </svg>;
}

export function Logo({ onBlock = false, className }: { onBlock?: boolean; className?: string }) {
  return <span className={cn("inline-flex items-center gap-2", className)}><FlameMark size={20} onBlock={onBlock} pulse={false} /><span className="type-title text-[22px] lowercase">{PRODUCT_WORDMARK}</span></span>;
}

/* ---------- Buttons & tags ---------- */

type BtnProps = HTMLMotionProps<"button"> & { arrow?: boolean; tone?: "primary" | "ember" | "surface"; children?: ReactNode };
const toneCls = { primary: "bg-primary text-primary-foreground", ember: "block-ember", surface: "bg-surface text-foreground" };

export function PrimaryButton({ className, children, arrow = true, tone = "primary", ...props }: BtnProps) {
  return <Pressable haptics className={cn("inline-flex h-14 w-full items-center justify-center gap-2 rounded-[18px] px-6 type-button focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 disabled:opacity-40", toneCls[tone], className)} {...props}>
    {children}{arrow && <ArrowRight strokeWidth={2.5} className="size-[18px]" aria-hidden="true" />}
  </Pressable>;
}
export function SecondaryButton(props: BtnProps) { return <PrimaryButton tone="surface" arrow={false} {...props} />; }
export function GhostButton({ className, children, ...props }: BtnProps) {
  return <Pressable className={cn("inline-flex h-14 items-center gap-2 px-1 type-button text-foreground underline decoration-2 underline-offset-[6px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 rounded-md", className)} {...props}>{children}</Pressable>;
}

export function Tag({ children, tone, className }: { children: ReactNode; tone?: string; className?: string }) {
  return <span className={cn("inline-flex w-fit items-center rounded-full px-3 py-1.5 type-label", tone ?? "bg-surface text-foreground", className)}>{children}</span>;
}

/* ---------- Colour blocks & packs ---------- */

export type PackName = "memory" | "food" | "tet" | "distance" | "deep" | "fun";
export const packs: PackName[] = ["memory", "food", "tet", "distance", "deep", "fun"];
export const packClass: Record<PackName, string> = { memory: "block-blush", food: "block-ember", tet: "block-tet", distance: "block-plum", deep: "block-deep", fun: "block-butter" };

export function Block({ tone, className, children }: { tone: string; className?: string; children: ReactNode }) {
  return <div className={cn("grain rounded-[28px] p-6", tone, className)}><div className="relative z-[2]">{children}</div></div>;
}

/* ---------- Two people ---------- */

export function Status({ done, name }: { done: boolean; name: string }) {
  const { t } = useTranslation();
  const Icon = done ? Check : Clock;
  return <span className="inline-flex items-center gap-1.5 text-[13px] font-bold"><Icon strokeWidth={2.5} className="size-4" aria-hidden="true" />{name} · {t(done ? "avatars.done" : "avatars.waiting")}</span>;
}

export function AvatarPair({ firstDone = true, secondDone = false }: { firstDone?: boolean; secondDone?: boolean }) {
  const { t } = useTranslation();
  const people = [{ name: t("avatars.you"), done: firstDone, tone: "block-plum" }, { name: t("avatars.partner"), done: secondDone, tone: "block-blush" }];
  return <div className="flex items-center gap-4">
    <div className="flex -space-x-3">{people.map((p) => <span key={p.name} className={cn("relative grid size-14 place-items-center rounded-full ring-4 ring-background type-title text-[22px]", p.tone)}>
      {p.name.charAt(0)}
      <span className={cn("absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full ring-2 ring-background", p.done ? "block-ember" : "bg-surface text-foreground")}>{p.done ? <Check strokeWidth={3} className="size-3.5" /> : <Clock strokeWidth={3} className="size-3.5" />}</span>
    </span>)}</div>
    <div className="flex flex-col gap-0.5">{people.map((p) => <Status key={p.name} done={p.done} name={p.name} />)}</div>
  </div>;
}

export function ActionTile({ tone, icon: Icon, title, youDone, partnerDone }: { tone: string; icon: LucideIcon; title: string; youDone: boolean; partnerDone: boolean }) {
  const { t } = useTranslation();
  return <Pressable haptics className={cn("grain flex min-h-[140px] w-full flex-col justify-between rounded-[24px] p-5 text-left", tone)}>
    <span className="relative z-[2] flex items-start justify-between gap-3"><span className="type-title">{title}</span><Icon strokeWidth={2} className="size-7 shrink-0" aria-hidden="true" /></span>
    <span className="relative z-[2] mt-4 flex flex-wrap gap-x-4 gap-y-1"><Status done={youDone} name={t("avatars.you")} /><Status done={partnerDone} name={t("avatars.partner")} /></span>
  </Pressable>;
}

/* ---------- Streak ---------- */

export function StreakLine({ count, atRisk = false }: { count: number; atRisk?: boolean }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  return <motion.div className="flex items-center gap-3" key={atRisk ? "risk" : "ok"} initial={reduce ? { opacity: 0 } : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, ease: [0.34, 1.4, 0.64, 1] }}>
    <FlameMark size={30} streak={count} atRisk={atRisk} />
    <div>
      <p className="type-title text-[22px]"><Odometer value={count} /> <span>{t("streak.unit")}</span></p>
      <p className="type-caption text-muted-foreground">{atRisk ? t("cb.streakRisk") : t("sample.streakNote")}</p>
    </div>
  </motion.div>;
}

/* ---------- Photo, occasion, empty ---------- */

export function PhotoTile({ className, title }: { className?: string; title?: string }) {
  const { t } = useTranslation();
  return <div className={className}>
    <div role="img" aria-label={t("image.alt")} className="grain block-plum flex h-[220px] items-end rounded-[24px] p-5">
      <span className="relative z-[2] flex items-center gap-2 type-label"><Camera strokeWidth={2} className="size-4" aria-hidden="true" />{t("sample.photoSlot")}</span>
    </div>
    {title && <p className="mt-3 px-1 type-title text-[22px]">{title}</p>}
  </div>;
}

export function OccasionBanner({ days = 131 }: { days?: number }) {
  const { t } = useTranslation();
  return <Block tone="block-tet" className="rounded-[24px] p-5"><p className="type-title">{t("sample.occasion", { count: days })}</p><p className="mt-2 type-body opacity-90">{t("sample.occasionNote")}</p></Block>;
}

export function EmptyState() {
  const { t } = useTranslation();
  return <Block tone="bg-surface text-foreground"><FlameMark size={34} atRisk pulse={false} /><p className="mt-5 type-title">{t("cb.empty.title")}</p><p className="mt-2 type-body text-muted-foreground">{t("cb.empty.body")}</p></Block>;
}

/* ---------- Sheet ---------- */

export function BottomSheet({ open, onOpenChange, mode, children }: { open: boolean; onOpenChange: (open: boolean) => void; mode?: "light" | "dark"; children: ReactNode }) {
  const { t } = useTranslation();
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <div className={mode}>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] rounded-t-[28px] bg-background px-5 pb-8 pt-3 text-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-300 data-[state=closed]:duration-200">
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-surface" />
        <Dialog.Title className="sr-only">{t("cb.sheet.title")}</Dialog.Title>
        <Dialog.Description className="sr-only">{t("cb.sheet.body")}</Dialog.Description>
        {children}
      </Dialog.Content>
    </div>
  </Dialog.Portal></Dialog.Root>;
}

/* ---------- Tab bar ---------- */

export const tabs = [{ key: "home", Icon: House }, { key: "play", Icon: Puzzle }, { key: "date", Icon: Heart }, { key: "memories", Icon: BookOpen }, { key: "settings", Icon: Settings }] as const;
export type TabKey = typeof tabs[number]["key"];

/** Slim floating bar; the active tab is a solid pill that slides and morphs between tabs. */
export function BottomTabBar({ active = "home", onSelect, id = "tabs", className }: { active?: TabKey; onSelect?: (tab: TabKey) => void; id?: string; className?: string }) {
  const { t } = useTranslation();
  return <LayoutGroup id={id}><nav aria-label={t("navigationLabel")} className={cn("flex h-16 items-center justify-between rounded-full bg-nav p-1.5 shadow-float", className)}>
    {tabs.map(({ key, Icon }) => { const on = active === key; return <Pressable key={key} haptics aria-label={t(`tabs.${key}`)} aria-current={on ? "page" : undefined} onClick={() => onSelect?.(key)}
      className="relative flex h-full flex-1 items-center justify-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ color: on ? "var(--nav-active-fg)" : "var(--nav-fg)" }}>
      {on && <motion.span layoutId="pill" className="absolute inset-0 rounded-full" style={{ background: "var(--nav-active)" }} transition={spring} />}
      <Icon strokeWidth={ICON_STROKE} className="relative size-[22px]" aria-hidden="true" />
    </Pressable>; })}
  </nav></LayoutGroup>;
}

/* ---------- Theme ---------- */

export type ThemeMode = "system" | "light" | "dark";
/** Follows the phone's setting by default; an explicit choice adds .light or .dark on <html>. */
export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>("system");
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("light", "dark");
    if (mode !== "system") el.classList.add(mode);
  }, [mode]);
  return [mode, setMode] as const;
}

export function ThemeSwitch({ mode, onChange }: { mode: ThemeMode; onChange: (m: ThemeMode) => void }) {
  const { t } = useTranslation();
  return <div role="group" aria-label={t("cb.theme.label")} className="flex rounded-full bg-surface p-1">
    {(["system", "light", "dark"] as const).map((m) => <Pressable key={m} aria-pressed={mode === m} onClick={() => onChange(m)}
      className={cn("h-10 rounded-full px-3 text-[13px] font-bold", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{t(`cb.theme.${m}`)}</Pressable>)}
  </div>;
}
