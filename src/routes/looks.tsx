import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { Camera, Check, Clock, Gamepad2, MessageCircle, type LucideIcon } from "lucide-react";
import { PRODUCT_NAME, PRODUCT_WORDMARK } from "@/config/product";
import i18n from "@/i18n";

export const Route = createFileRoute("/looks")({
  head: () => ({ meta: [
    { title: `${i18n.t("looks.title")} · ${PRODUCT_NAME}` },
    { name: "description", content: i18n.t("looks.description") },
    { property: "og:title", content: `${i18n.t("looks.title")} · ${PRODUCT_NAME}` },
    { property: "og:description", content: i18n.t("looks.description") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Looks,
});

type Dir = "block" | "midnight" | "tomato";
const directions: { key: Dir; defaultDark: boolean }[] = [
  { key: "block", defaultDark: false }, { key: "midnight", defaultDark: true }, { key: "tomato", defaultDark: false },
];
const snap = [0.2, 0, 0, 1] as const;
const overshoot = [0.34, 1.4, 0.64, 1] as const;

function Looks() {
  const { t } = useTranslation();
  return <main className="min-h-screen bg-page py-10">
    <header className="mx-auto max-w-[1240px] px-6">
      <p className="label-caps">{t("looks.title")}</p>
      <h1 className="mt-3 text-[40px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">{t("looks.heading")}</h1>
      <p className="mt-3 max-w-[520px] text-[16px] text-muted-foreground">{t("looks.sub")}</p>
    </header>
    <div className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-8 xl:mx-auto xl:max-w-[1240px] xl:justify-between xl:overflow-visible">
      {directions.map((d, i) => <DirectionColumn key={d.key} dir={d.key} index={i + 1} defaultDark={d.defaultDark} />)}
    </div>
  </main>;
}

function DirectionColumn({ dir, index, defaultDark }: { dir: Dir; index: number; defaultDark: boolean }) {
  const { t } = useTranslation();
  const [dark, setDark] = useState(defaultDark);
  const [screen, setScreen] = useState<"home" | "question">("home");
  const mode = dark ? "look-dark" : "look-light";
  const seg = (on: boolean) => `h-10 rounded-full px-4 text-[13px] font-medium transition-colors ${on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`;
  return <section className="w-[390px] shrink-0 snap-center" aria-label={t(`looks.names.${dir}`)}>
    <p className="label-caps">{t("looks.pick")} {index}</p>
    <h2 className="mt-1 text-[24px] font-medium text-foreground">{t(`looks.names.${dir}`)}</h2>
    <p className="mt-1 text-[14px] text-muted-foreground">{t(`looks.notes.${dir}`)}</p>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex rounded-full bg-card p-1" role="group">
        <button className={seg(screen === "home")} aria-pressed={screen === "home"} onClick={() => setScreen("home")}>{t("looks.screenHome")}</button>
        <button className={seg(screen === "question")} aria-pressed={screen === "question"} onClick={() => setScreen("question")}>{t("looks.screenQuestion")}</button>
      </div>
      <div className="flex rounded-full bg-card p-1" role="group">
        <button className={seg(!dark)} aria-pressed={!dark} onClick={() => setDark(false)}>{t("looks.light")}</button>
        <button className={seg(dark)} aria-pressed={dark} onClick={() => setDark(true)}>{t("looks.dark")}</button>
      </div>
    </div>
    <div data-look={dir} className={`look look-${dir} ${mode} mt-4 h-[844px] overflow-y-auto overflow-x-hidden rounded-[44px] shadow-soft ring-8 ring-foreground/90`}>
      {screen === "home" ? <HomeScreen dir={dir} /> : <QuestionScreen />}
    </div>
  </section>;
}

function FlameMark({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size * 1.2} viewBox="0 0 40 48" aria-hidden="true">
    <path d="M20 2 C28 12 36 20 36 31 A16 16 0 0 1 4 31 C4 22 10 17 14 10 C16 16 18 18 20 19 C20 13 19 8 20 2 Z" fill="var(--l-accent)" />
    <path d="M20 24 C25 29 28 33 28 37 A8 8 0 0 1 12 37 C12 32 16 28 20 24 Z" fill="var(--l-accent2)" />
  </svg>;
}

function Logo() {
  return <div className="flex items-center gap-2"><FlameMark size={22} /><span className="l-head text-[24px]">{PRODUCT_WORDMARK}</span></div>;
}

function Ticker() {
  const { t } = useTranslation();
  const text = t("looks.ticker");
  return <div className="overflow-hidden py-3" style={{ background: "var(--l-ticker)", color: "var(--l-ticker-fg)" }} aria-label={text}>
    <div className="l-ticker-track" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} className="l-head whitespace-nowrap pr-3 text-[18px]">{text}</span>)}</div>
  </div>;
}

function CountUp({ to, className, style }: { to: number; className?: string; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => { if (reduce) { setV(to); return; } const c = animate(0, to, { duration: 1.1, ease: snap, onUpdate: (x) => setV(Math.round(x)) }); return () => c.stop(); }, [to, reduce]);
  return <span className={className} style={style}>{v.toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US")}</span>;
}

function Status({ done, name }: { done: boolean; name: string }) {
  const { t } = useTranslation();
  const Icon = done ? Check : Clock;
  return <span className="inline-flex items-center gap-1.5 text-[13px] l-bold"><Icon strokeWidth={2.5} className="size-4" aria-hidden="true" />{name} · {t(done ? "looks.done" : "looks.waiting")}</span>;
}

function Tile({ n, icon: Icon, title, you, partner }: { n: 1 | 2 | 3; icon: LucideIcon; title: string; you: boolean; partner: boolean }) {
  const { t } = useTranslation();
  return <motion.button whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} className="flex min-h-[132px] w-full flex-col justify-between rounded-[24px] p-5 text-left" style={{ background: `var(--l-t${n})`, color: `var(--l-t${n}-fg)` }}>
    <div className="flex items-start justify-between gap-3"><span className="l-head text-[28px]">{title}</span><Icon strokeWidth={2} className="size-7 shrink-0" aria-hidden="true" /></div>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1"><Status done={you} name={t("looks.you")} /><Status done={partner} name={t("looks.partner")} /></div>
  </motion.button>;
}

function PhotoSlot({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return <div className={`l-grain flex items-end overflow-hidden rounded-[24px] p-4 ${className}`} style={{ background: "linear-gradient(145deg, var(--l-photo-a) 20%, var(--l-photo-b) 130%)" }}>
    <span className="l-label relative z-[2]" style={{ color: "var(--l-photo-fg)" }}>{t("looks.photoSlot")}</span>
  </div>;
}

function HomeScreen({ dir }: { dir: Dir }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const heroBlock = dir !== "tomato";
  return <div className="pb-10">
    <div className="flex items-center justify-between px-6 pb-4 pt-12"><Logo /><span className="l-label" style={{ color: "var(--l-muted)" }}>{t("looks.today")}</span></div>
    <section className="relative mx-4 overflow-hidden rounded-[32px] px-5 pb-6 pt-5" style={{ background: heroBlock ? "var(--l-hero)" : "transparent", color: "var(--l-hero-fg)" }}>
      <div className="pointer-events-none absolute -left-10 top-10 size-72 rounded-full blur-3xl" style={{ background: "var(--l-glow)" }} />
      <p className="l-label relative">{t("looks.today")}</p>
      <CountUp to={412} className="l-num relative mt-2 block text-[160px]" style={{ color: "var(--l-num)" }} />
      <p className="l-head relative mt-1 text-[32px]">{t("looks.daysLabel")}</p>
      <motion.div className="relative mt-5 flex items-center gap-3" initial={reduce ? false : { scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.9, duration: 0.3, ease: overshoot }}>
        <div className="rounded-full p-1.5" style={{ boxShadow: dir === "midnight" ? "0 0 32px var(--l-glow)" : undefined }}><FlameMark size={30} /></div>
        <div><p className="text-[18px] l-bold">{t("looks.streak", { count: 23 })}</p><p className="text-[14px] font-medium opacity-75">{t("looks.streakNote")}</p></div>
      </motion.div>
    </section>
    <div className="mt-6"><Ticker /></div>
    <div className="mt-6 space-y-3 px-4">
      <Tile n={1} icon={MessageCircle} title={t("looks.tiles.question")} you partner={false} />
      <Tile n={2} icon={Camera} title={t("looks.tiles.photo")} you={false} partner={false} />
      <Tile n={3} icon={Gamepad2} title={t("looks.tiles.game")} you partner />
    </div>
    <div className="mt-6 px-4"><PhotoSlot className="h-[220px]" /><p className="l-head mt-3 px-1 text-[22px]">{t("looks.photoTitle")}</p></div>
    <div className="mx-4 mt-6 rounded-[24px] p-5" style={{ background: "var(--l-banner)", color: "var(--l-banner-fg)" }}>
      <p className="l-head text-[26px]">{t("looks.occasion", { count: 131 })}</p>
      <p className="mt-2 text-[15px] font-medium opacity-85">{t("looks.occasionNote")}</p>
    </div>
  </div>;
}

function QuestionScreen() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const d = reduce ? 0 : 1;
  return <div className="relative min-h-full">
    <AnimatePresence>{open && <motion.div key="flood" className="absolute inset-0" style={{ background: "var(--l-flood)" }} initial={{ clipPath: "circle(0% at 50% 90%)" }} animate={{ clipPath: "circle(150% at 50% 90%)" }} exit={{ opacity: 0 }} transition={{ duration: 0.5 * d, ease: snap }} />}</AnimatePresence>
    <div className="relative flex min-h-[844px] flex-col px-6 pb-8 pt-12" style={{ color: open ? "var(--l-flood-fg)" : "var(--l-fg)", transition: "color .25s" }}>
      <Logo />
      <span className="l-label mt-10 w-fit rounded-full px-3 py-1.5" style={{ background: open ? "var(--l-flood-fg)" : "var(--l-accent)", color: open ? "var(--l-flood)" : "var(--l-accent-fg)" }}>{t("looks.pack")}</span>
      <h3 className="l-head mt-5 text-[40px]" style={{ textWrap: "balance" }}>{t("looks.question", { partner: t("looks.partner") })}</h3>
      {!open ? <div className="mt-auto pt-10">
        <p className="mb-4 flex items-center gap-2 text-[15px] l-bold"><Check strokeWidth={2.5} className="size-5" aria-hidden="true" />{t("looks.bothAnswered")}</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="h-14 w-full rounded-[18px] text-[16px] l-bold" style={{ background: "var(--l-btn)", color: "var(--l-btn-fg)" }}>{t("looks.reveal")}</motion.button>
      </div> : <div className="mt-8 space-y-3">
        <motion.p className="l-head text-[28px]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 * d, duration: 0.25 }}>{t("looks.revealed")}</motion.p>
        {[{ who: t("looks.you"), a: t("looks.answerA"), bg: "var(--l-card)", fg: "var(--l-card-fg)" }, { who: t("looks.partner"), a: t("looks.answerB"), bg: "var(--l-card2)", fg: "var(--l-card2-fg)" }].map((c, i) =>
          <motion.div key={c.who} className="rounded-[24px] p-5" style={{ background: c.bg, color: c.fg }} initial={{ x: i ? 80 : -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: (0.4 + i * 0.12) * d, duration: 0.3, ease: overshoot }}>
            <p className="l-label opacity-70">{c.who}</p><p className="l-head mt-2 text-[30px]">{c.a}</p>
          </motion.div>)}
        <p className="pt-2 text-[16px] font-medium">{t("looks.verdict")}</p>
        <button onClick={() => setOpen(false)} className="h-14 text-[15px] l-bold underline underline-offset-4">{t("looks.replay")}</button>
      </div>}
    </div>
  </div>;
}
