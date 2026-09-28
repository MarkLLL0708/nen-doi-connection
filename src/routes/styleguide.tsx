import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Camera, Check, Gamepad2, MessageCircle } from "lucide-react";
import { PRODUCT_NAME } from "@/config/product";
import {
  ActionTile, AvatarPair, Block, BottomSheet, BottomTabBar, ColourFlood, CountUp, EmptyState, FitText, FlameMark, formatNumber, GeometricBurst, GhostButton,
  Logo, OccasionBanner, Odometer, overshoot, packClass, packs, PageTransition, PhotoTile, pointFrom, PrimaryButton, SecondaryButton, SlideUp, Stagger, StaggerItem,
  StreakLine, SwipeDeck, Tag, ThemeSwitch, Ticker, useThemeMode, type TabKey,
} from "@/components/visual";
import i18n from "@/i18n";

export const Route = createFileRoute("/styleguide")({
  head: () => ({ meta: [
    { title: `${i18n.t("cb.pageTitle")} · ${PRODUCT_NAME}` },
    { name: "description", content: i18n.t("cb.pageDescription") },
    { property: "og:title", content: `${i18n.t("cb.pageTitle")} · ${PRODUCT_NAME}` },
    { property: "og:description", content: i18n.t("cb.pageDescription") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Styleguide,
});

const swatches = [
  { key: "ink", hex: "#121212", cls: "block-ink" }, { key: "cream", hex: "#F5EFE6", cls: "block-cream" }, { key: "ember", hex: "#FF5A1F", cls: "block-ember" },
  { key: "butter", hex: "#FFD447", cls: "block-butter" }, { key: "plum", hex: "#3A1B4B", cls: "block-plum" }, { key: "blush", hex: "#FF9EB5", cls: "block-blush" }, { key: "tet", hex: "#E0321C", cls: "block-tet" },
] as const;
const toneBgs = ["block-cream", "block-ink", "block-ember", "block-plum"] as const;
const toneSizes = [120, 56, 30, 16, 12];
const ideaTones = ["block-ember", "block-plum", "block-butter", "block-blush", "block-ink", "block-tet"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-5"><h2 className="type-label text-muted-foreground">{title}</h2>{children}</section>;
}

function Styleguide() {
  const { t, i18n: i } = useTranslation();
  const [mode, setMode] = useThemeMode();
  return <div className="min-h-screen bg-page">
    <PageTransition className="mx-auto max-w-[390px] bg-background text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/preview-home" className="text-[13px] font-bold underline decoration-2 underline-offset-4">{t("actions.viewHome")}</Link>
          <button onClick={() => { void i.changeLanguage(i.language === "vi" ? "en" : "vi"); }} className="h-10 text-[13px] font-bold text-muted-foreground">{t("actions.switchLanguage")}</button>
        </div>
      </div>
      <div className="px-5 pt-4"><ThemeSwitch mode={mode} onChange={setMode} /></div>
      <header className="px-5 pb-10 pt-10">
        <p className="type-label text-muted-foreground">{t("cb.heroLabel")}</p>
        <h1 className="mt-4 type-display"><SlideUp>{t("cb.heroTitle")}</SlideUp></h1>
        <p className="mt-4 type-body text-muted-foreground">{t("cb.heroSub")}</p>
      </header>
      <Ticker text={t("sample.ticker")} className="block-ember" />
      <Showcase variant="light" />
      <Ticker text={t("sample.ticker")} className="block-butter" />
      <Showcase variant="dark" />
      <Ticker text={t("sample.ticker")} className="block-plum" />
      <MotionLab />
    </PageTransition>
  </div>;
}

function Showcase({ variant }: { variant: "light" | "dark" }) {
  const { t, i18n: i } = useTranslation();
  const [sheet, setSheet] = useState(false);
  const [you, setYou] = useState(true);
  const [partner, setPartner] = useState(false);
  const [streak, setStreak] = useState(23);
  const [risk, setRisk] = useState(false);
  const [tab, setTab] = useState<TabKey>("home");
  return <div className={variant} data-showcase={variant}>
    <div className="space-y-14 bg-background px-5 py-12 text-foreground">
      <p className="type-display">{t(variant === "light" ? "cb.modeLight" : "cb.modeDark")}</p>

      <Section title={t("cb.sections.colour")}>
        <div className="grid grid-cols-2 gap-3">{swatches.map((s) => <div key={s.key} className={`grain flex h-28 flex-col justify-end rounded-[20px] p-4 ${s.cls} ${s.key === "cream" || s.key === "ink" ? "ring-2 ring-surface" : ""}`}>
          <span className="relative z-[2] type-title text-[18px]">{t(`cb.colours.${s.key}`)}</span><span className="relative z-[2] type-caption">{s.hex}</span></div>)}</div>
      </Section>

      <Section title={t("cb.sections.packs")}>
        <div className="grid grid-cols-2 gap-3">{packs.map((p) => <div key={p} className={`grain flex min-h-[120px] items-end rounded-[20px] p-4 ${packClass[p]}`}><span className="relative z-[2] type-title text-[20px]">{t(`categories.${p}`)}</span></div>)}</div>
      </Section>

      <Section title={t("cb.sections.type")}>
        <div className="space-y-6">
          <div><p className="type-label text-muted-foreground">{t("cb.typeNames.numeral")} · 96–140</p><FitText max={140}>412</FitText></div>
          <div><p className="type-label text-muted-foreground">{t("cb.typeNames.display")} · 40</p><p className="mt-1 type-display">{t("cb.typeSample.display")}</p></div>
          <div><p className="type-label text-muted-foreground">{t("cb.typeNames.title")} · 26</p><p className="mt-1 type-title">{t("cb.typeSample.title")}</p></div>
          <div><p className="type-label text-muted-foreground">{t("cb.typeNames.body")} · 16</p><p className="mt-1 type-body">{t("cb.typeSample.body")}</p></div>
          <div><p className="type-label text-muted-foreground">{t("cb.typeNames.caption")} · 13</p><p className="mt-1 type-caption text-muted-foreground">{t("cb.typeSample.caption")}</p></div>
          <div><p className="type-label text-muted-foreground">{t("cb.typeNames.label")} · 12</p><p className="mt-1 type-label">{t("cb.typeSample.label")}</p></div>
          <div><p className="type-label text-muted-foreground">{t("cb.typeNames.button")} · 15</p><p className="mt-1 type-button">{t("cb.typeSample.button")}</p></div>
        </div>
      </Section>

      <Section title={t("cb.sections.tone")}>
        <div className="space-y-3" data-testid="tone-marks">{toneBgs.map((bg) => <div key={bg} className={`rounded-[24px] p-5 ${bg} ${bg === "block-ink" || bg === "block-cream" ? "ring-2 ring-surface" : ""}`}>
          {toneSizes.map((s) => <p key={s} className="font-display font-extrabold" style={{ fontSize: s, lineHeight: 1.2, overflowWrap: "anywhere" }}>{s >= 56 ? "Ấm ề ữ ở ự" : t("cb.toneTest")}</p>)}
          <p className="mt-2 font-display font-normal" style={{ fontSize: 30, lineHeight: 1.2 }}>{t("cb.toneTest")}</p>
          <p className="mt-2 type-body">{t("cb.toneTest")}</p>
          <p className="type-body font-bold">{t("cb.toneTest")}</p>
        </div>)}</div>
      </Section>

      <Section title={t("cb.sections.fit")}>
        <p className="type-body text-muted-foreground">{t("cb.fitNote")}</p>
        <div className="space-y-3">{[412, 1234, 12345].map((n) => <Block key={n} tone="block-ember" className="py-4"><FitText max={140}>{formatNumber(n, i.language)}</FitText></Block>)}</div>
      </Section>

      <Section title={t("cb.sections.buttons")}>
        <div className="space-y-3">
          <PrimaryButton onClick={() => setSheet(true)}>{t("cb.buttons.openSheet")}</PrimaryButton>
          <PrimaryButton tone="ember">{t("cb.buttons.primary")}</PrimaryButton>
          <SecondaryButton>{t("cb.buttons.secondary")}</SecondaryButton>
          <GhostButton>{t("cb.buttons.ghost")}</GhostButton>
        </div>
      </Section>

      <Section title={t("cb.sections.tags")}>
        <div className="flex flex-wrap gap-2"><Tag tone="block-ember">{t("cb.tags.new")}</Tag><Tag>{t("cb.tags.daily")}</Tag><Tag tone="block-plum">{t("cb.tags.minutes")}</Tag></div>
      </Section>

      <Section title={t("cb.sections.tiles")}>
        <Stagger className="space-y-3">
          <StaggerItem><ActionTile tone="block-plum" icon={MessageCircle} title={t("sample.tiles.question")} youDone partnerDone={false} /></StaggerItem>
          <StaggerItem><ActionTile tone="block-butter" icon={Camera} title={t("sample.tiles.photo")} youDone={false} partnerDone={false} /></StaggerItem>
          <StaggerItem><ActionTile tone="block-blush" icon={Gamepad2} title={t("sample.tiles.game")} youDone partnerDone /></StaggerItem>
        </Stagger>
      </Section>

      <Section title={t("cb.sections.together")}>
        <AvatarPair firstDone={you} secondDone={partner} />
        <div className="flex flex-wrap gap-2"><SecondaryButton className="h-12 w-auto" onClick={() => setYou((v) => !v)}>{t("avatars.toggleYou")}</SecondaryButton><SecondaryButton className="h-12 w-auto" onClick={() => setPartner((v) => !v)}>{t("avatars.togglePartner")}</SecondaryButton></div>
      </Section>

      <Section title={t("cb.sections.streak")}>
        <div className="flex items-end gap-6">{[3, 30, 100].map((n) => <div key={n} className="flex flex-col items-center gap-2"><FlameMark size={22 + n / 5} streak={n} /><span className="type-caption nums">{n}</span></div>)}<div className="flex flex-col items-center gap-2"><FlameMark size={30} atRisk /><span className="type-caption">{t("cb.streakRiskToggle")}</span></div></div>
        <StreakLine count={streak} atRisk={risk} />
        <div className="flex flex-wrap gap-2">
          <SecondaryButton className="h-12 w-auto" onClick={() => { setStreak((s) => s + 1); setRisk(false); }}>{t("cb.streakGrow")}</SecondaryButton>
          <SecondaryButton className="h-12 w-auto" onClick={() => setRisk((r) => !r)}>{t("cb.streakRiskToggle")}</SecondaryButton>
          <SecondaryButton className="h-12 w-auto" onClick={() => { setStreak(23); setRisk(false); }}>{t("cb.reset")}</SecondaryButton>
        </div>
      </Section>

      <Section title={t("cb.sections.photo")}><PhotoTile title={t("sample.photoTitle")} /><OccasionBanner /></Section>
      <Section title={t("cb.sections.empty")}><EmptyState /></Section>
      <Section title={t("cb.sections.nav")}><BottomTabBar id={`tabs-${variant}`} active={tab} onSelect={setTab} /></Section>
    </div>
    <BottomSheet open={sheet} onOpenChange={setSheet} mode={variant}>
      <p className="type-label text-muted-foreground">{t("cb.sheet.label")}</p>
      <h3 className="mt-3 type-display">{t("cb.sheet.title")}</h3>
      <p className="mt-3 type-body text-muted-foreground">{t("cb.sheet.body")}</p>
      <div className="mt-8 space-y-2"><PrimaryButton tone="ember" onClick={() => setSheet(false)}>{t("cb.sheet.action")}</PrimaryButton><SecondaryButton onClick={() => setSheet(false)}>{t("cb.sheet.close")}</SecondaryButton></div>
    </BottomSheet>
  </div>;
}

type Idea = { title: string; meta: string };
type Pair = { a: string; b: string };

function MotionLab() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const ideas = (t("cb.ideas", { returnObjects: true }) as Idea[]).map((x, idx) => ({ ...x, id: `i${idx}`, tone: ideaTones[idx % ideaTones.length]! }));
  const pairs = (t("cb.pairs", { returnObjects: true }) as Pair[]).map((x, idx) => ({ ...x, id: `p${idx}` }));
  const [countKey, setCountKey] = useState(0);
  const [odo, setOdo] = useState(29);
  const [burst, setBurst] = useState(0);
  return <div className="space-y-14 px-5 pb-16 pt-12">
    <p className="type-display">{t("cb.sections.lab")}</p>
    {reduce && <p className="type-body text-muted-foreground">{t("cb.reducedNote")}</p>}

    <Section title={t("cb.sections.deck")}>
      <p className="type-caption text-muted-foreground">{t("cb.deckHint")}</p>
      <SwipeDeck items={ideas} getKey={(x) => x.id} cardClassName={(x) => x.tone} renderCard={(x) => <div className="relative z-[2] flex flex-1 flex-col justify-end">
        <p className="type-label opacity-80">{t("tabs.date")}</p><p className="mt-3 type-display text-[34px]">{x.title}</p><p className="mt-3 type-body opacity-85">{x.meta}</p></div>} />
    </Section>

    <Section title={t("cb.sections.choose")}>
      <SwipeDeck items={pairs} getKey={(x) => x.id} cardClassName="block-butter" renderCard={(x) => <div className="relative z-[2] flex flex-1 flex-col justify-center gap-3">
        <p className="type-label">{t("cb.chooseLabel")}</p>
        <div className="block-ink rounded-[20px] p-5"><p className="type-title">{x.a}</p></div>
        <p className="type-title text-center">{t("cb.or")}</p>
        <div className="block-ember rounded-[20px] p-5"><p className="type-title">{x.b}</p></div></div>} />
    </Section>

    <Section title={t("cb.sections.flood")}><FloodDemo /></Section>

    <Section title={t("cb.sections.count")}>
      <Block tone="block-plum"><FitText max={120} measure={formatNumber(1234, i18n.language)}><CountUp to={1234} replayKey={countKey} /></FitText></Block>
      <SecondaryButton onClick={() => setCountKey((k) => k + 1)}>{t("cb.countReplay")}</SecondaryButton>
    </Section>

    <Section title={t("cb.sections.odometer")}>
      <Block tone="block-butter"><div className="flex items-center gap-4"><FlameMark size={44} streak={odo} /><span className="type-numeral text-[96px]"><Odometer value={odo} /></span></div></Block>
      <SecondaryButton onClick={() => setOdo((v) => v + 1)}>{t("cb.odometerNext")}</SecondaryButton>
    </Section>

    <Section title={t("cb.sections.burst")}>
      <div className="relative">
        <Block tone="block-ember" className="text-left"><p className="type-label">{t("cb.burstLabel")}</p><p className="mt-2 type-numeral text-[96px]">30</p><p className="type-title">{t("cb.burstText")}</p></Block>
        <GeometricBurst fire={burst} />
      </div>
      <PrimaryButton onClick={() => setBurst((b) => b + 1)}>{t("cb.burstFire")}</PrimaryButton>
    </Section>
  </div>;
}

function FloodDemo() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const answers = [{ who: t("sample.you"), a: t("sample.answerA"), tone: "block-cream", from: -1 }, { who: t("sample.partner"), a: t("sample.answerB"), tone: "block-ink", from: 1 }];
  return <div ref={box} className="relative min-h-[620px] overflow-hidden rounded-[28px] bg-surface" data-testid="flood">
    <ColourFlood at={at} active={open} colourClass="block-ember" />
    <div className={`relative z-[1] flex min-h-[620px] flex-col p-6 transition-colors duration-300 ${open ? "text-ink" : "text-foreground"}`}>
      <Tag tone={open ? "block-ink" : "block-ember"}>{t("cb.floodPack")}</Tag>
      <h3 className="mt-5 type-title">{t("cb.floodQuestion", { partner: t("sample.partner") })}</h3>
      {!open ? <div className="mt-auto pt-8">
        <p className="mb-4 flex items-center gap-2 type-body font-bold"><Check strokeWidth={2.5} className="size-5" aria-hidden="true" />{t("cb.floodBoth")}</p>
        <PrimaryButton onClick={(e) => { setAt(pointFrom(e, box.current)); setOpen(true); }}>{t("cb.floodReveal")}</PrimaryButton>
      </div> : <div className="mt-6 space-y-3">
        <motion.p className="type-display text-[32px]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.35, duration: 0.25 }}>{t("cb.floodRevealed")}</motion.p>
        <AnimatePresence>{answers.map((c, idx) => <motion.div key={c.who} className={`rounded-[24px] p-5 ${c.tone}`}
          initial={reduce ? { opacity: 0 } : { x: c.from * 320, rotate: c.from * 8, opacity: 0 }} animate={{ x: 0, rotate: 0, opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.45 + idx * 0.12, duration: 0.35, ease: overshoot }}>
          <p className="type-label opacity-70">{c.who}</p><p className="mt-2 type-title">{c.a}</p>
        </motion.div>)}</AnimatePresence>
        <p className="pt-1 type-body">{t("sample.verdict")}</p>
        <GhostButton className="text-ink" onClick={() => setOpen(false)}>{t("cb.floodReplay")}</GhostButton>
      </div>}
    </div>
  </div>;
}
