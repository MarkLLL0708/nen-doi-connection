import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { PRODUCT_NAME } from "@/config/product";
import { FlameMascot, flameExpressions } from "@/components/visual/FlameMascot";
import { AvatarPair, BigCard, BottomSheet, BottomTabBar, Confetti, EmptyState, FlameStreak, GradientScreen, gradients, PillTag, PrimaryButton, SecondaryButton, SwipeCard, tabs } from "@/components/visual";
import i18n from "@/i18n";
import { emoji } from "@/assets/emoji";

const Section = ({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) => <section id={id} className="space-y-5"><h2 className="text-[27px] font-black leading-tight text-foreground">{title}</h2>{children}</section>;

export const Route = createFileRoute("/styleguide")({
  head: () => ({ meta: [
    { title: `${i18n.t("pageTitle")} · ${PRODUCT_NAME}` },
    { name: "description", content: i18n.t("guideIntro") },
    { property: "og:title", content: `${i18n.t("pageTitle")} · ${PRODUCT_NAME}` },
    { property: "og:description", content: i18n.t("guideIntro") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Styleguide,
});

function Styleguide() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [dark, setDark] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["key"]>("home");
  const [firstDone, setFirstDone] = useState(true);
  const [secondDone, setSecondDone] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  useEffect(() => { if (!celebrating) return; const timeout = window.setTimeout(() => setCelebrating(false), 1700); return () => window.clearTimeout(timeout); }, [celebrating]);
  return <div className={dark ? "dark min-h-screen bg-page" : "min-h-screen bg-page"}>
    <div className="mx-auto min-h-screen w-full max-w-[390px] overflow-hidden bg-background shadow-card">
      <main className="pb-10">
        <header className="relative overflow-hidden bg-background px-6 pb-11 pt-9">
          <div className="mb-12 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FlameMascot size={35} expression="vui"/><span className="text-[20px] font-black text-foreground">{PRODUCT_NAME}</span></div><div className="flex items-center gap-2"><button onClick={() => { void i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi"); }} className="rounded-full bg-secondary px-3 py-2 text-xs font-extrabold text-secondary-foreground transition-transform active:scale-95" aria-label={t("actions.switchLanguage")}>{i18n.language === "vi" ? "EN" : "VI"}</button><button onClick={() => setDark(!dark)} className="grid size-9 place-items-center rounded-full bg-secondary text-lg transition-transform active:scale-95" aria-label={t("actions.switchTheme")}>{dark ? "☀️" : "🌙"}</button></div></div>
          <PillTag className="-rotate-3">✦ {t("eyebrow")}</PillTag>
          <h1 className="mt-6 max-w-[330px] text-[40px] font-black leading-[1.12] text-foreground">{t("guideTitle")}</h1>
          <p className="mt-5 text-[17px] font-semibold leading-relaxed text-muted-foreground">{t("guideIntro")}</p>
          <div className="relative mt-10 flex h-[193px] items-center justify-center rounded-[30px] bg-secondary"><img src={emoji.redHeart.url} alt="" className="absolute left-7 top-6 size-9 rotate-[-15deg] object-contain"/><img src={emoji.sparkles.url} alt="" className="absolute bottom-6 right-7 size-9 rotate-[18deg] object-contain"/><motion.div initial={reduceMotion ? false : { scale: 0.75, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 240, damping: 18 }}><FlameMascot size={166} expression="yeu" pulse/></motion.div></div>
          <p className="mt-5 text-center text-[14px] font-extrabold text-primary">{t("brandLine")}</p>
        </header>

        <div className="space-y-14 px-6 pt-8">
          <Section title={t("sections.colors")}><div className="grid grid-cols-2 gap-3">{(["cream", "ember", "rose", "charcoal"] as const).map((color) => <div key={color} className="min-w-0"><div role="img" aria-label={`${t("colorSample")}: ${t(`colors.${color}`)}`} className={`h-24 rounded-[22px] shadow-soft ${{ cream: "bg-cream", ember: "bg-ember", rose: "bg-rose", charcoal: "bg-charcoal" }[color]}`}/><div className="mt-2 flex flex-col"><span className="text-sm font-extrabold text-foreground">{t(`colors.${color}`)}</span><span className="text-xs font-bold text-muted-foreground">{{ cream: "#FFF8F1", ember: "#E8590C", rose: "#F4A6A0", charcoal: "#2B2320" }[color]}</span></div></div>)}</div></Section>
          <Section title={t("sections.gradients")}><div className="grid grid-cols-2 gap-3">{gradients.map((gradient) => <div key={gradient} role="img" aria-label={`${t("gradientLabel")}: ${t(`categories.${gradient}`)}`} className={`gradient-${gradient} flex h-[112px] items-end rounded-[23px] p-4 text-sm font-black text-gradient-foreground shadow-soft`}><span className="rounded-full bg-card/70 px-3 py-1.5">{t(`categories.${gradient}`)}</span></div>)}</div><GradientScreen gradient="memory" className="relative"><img src={emoji.loveLetter.url} alt="" className="size-10 object-contain"/><div><PillTag>{t("preview")}</PillTag><h3 className="mt-3 max-w-[240px] text-[32px] font-black leading-tight">{t("type.heading")}</h3></div></GradientScreen></Section>
          <Section title={t("sections.type")}><div className="space-y-6"><div><PillTag>{t("type.caption")}</PillTag><p className="mt-3 text-[40px] font-black leading-[1.1] text-foreground">{t("type.display")}</p></div><p className="text-[30px] font-black leading-tight text-foreground">{t("type.heading")}</p><p className="text-[17px] font-semibold leading-relaxed text-foreground">{t("type.body")}</p></div></Section>
          <Section title={t("sections.mascot")}><div className="grid grid-cols-4 gap-x-1 gap-y-6">{flameExpressions.map((expression) => <div key={expression} className="flex min-w-0 flex-col items-center gap-1.5"><FlameMascot expression={expression} size={72}/><span className="text-center text-[12px] font-extrabold text-foreground">{t(`expressions.${expression}`)}</span></div>)}</div></Section>
          <Section title={t("sections.buttons")}><div className="space-y-3"><PrimaryButton onClick={() => setSheetOpen(true)}>{t("actions.start")} <span aria-hidden="true">↗</span></PrimaryButton><SecondaryButton onClick={() => setSheetOpen(true)}>{t("actions.later")}</SecondaryButton><div className="flex flex-wrap gap-2 pt-2"><PillTag>💗 {t("card.tag")}</PillTag><PillTag className="-rotate-3 bg-accent">✨ {t("type.caption")}</PillTag></div></div></Section>
          <Section title={t("sections.cards")}><BigCard><PillTag>{t("card.tag")}</PillTag><h3 className="mt-6 text-[28px] font-black leading-tight text-foreground">{t("card.title")}</h3><p className="mt-3 text-[17px] font-semibold leading-relaxed text-muted-foreground">{t("card.body")}</p><img src={emoji.loveLetter.url} alt="" className="mt-7 size-12 object-contain"/></BigCard><div className="space-y-3"><SwipeCard onSwipe={(direction) => setSwipeDirection(direction)}/><p className="text-center text-sm font-bold text-muted-foreground">{swipeDirection ? t(swipeDirection === "left" ? "swipeLeft" : "swipeRight") : t("card.swipeHint")}</p></div></Section>
          <Section title={t("sections.together")}><div className="flex flex-wrap gap-2"><FlameStreak count={7} size="small"/><FlameStreak count={7} size="medium"/><FlameStreak count={7} size="large"/></div><div className="space-y-5 pt-2"><AvatarPair firstDone={firstDone} secondDone={secondDone}/><div className="flex gap-2"><SecondaryButton className="h-10 px-3 text-xs" onClick={() => setFirstDone(!firstDone)}>{t("avatars.you")}: {t(firstDone ? "avatars.done" : "avatars.waiting")}</SecondaryButton><SecondaryButton className="h-10 px-3 text-xs" onClick={() => setSecondDone(!secondDone)}>{t("avatars.partner")}: {t(secondDone ? "avatars.done" : "avatars.waiting")}</SecondaryButton></div></div><EmptyState/></Section>
          <Section title={t("sections.motions")}><div className="relative overflow-hidden rounded-[28px] bg-secondary p-6"><Confetti active={celebrating}/><div className="flex items-center gap-4"><FlameMascot expression="mung" size={76} pulse/><div><p className="text-lg font-black text-foreground">{t("streak.status")}</p><p className="text-sm font-bold text-muted-foreground">{t("sample")}</p></div></div><PrimaryButton className="relative mt-6" onClick={() => { setCelebrating(false); requestAnimationFrame(() => setCelebrating(true)); }}>{t("actions.celebrate")} ✨</PrimaryButton></div><SecondaryButton onClick={() => setSheetOpen(true)}>{t("actions.openSheet")}</SecondaryButton></Section>
          <Section title={t("sections.navigation")}><BottomTabBar active={activeTab} onSelect={setActiveTab}/></Section>
        </div>
      </main>
    </div>
    <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}><div className="flex flex-col items-center gap-5 text-center"><FlameMascot expression="yeu" size={112} pulse/><PillTag>{t("sheet.tag")}</PillTag><h2 className="text-[30px] font-black leading-tight">{t("sheet.title")}</h2><p className="text-[17px] font-semibold leading-relaxed text-muted-foreground">{t("sheet.body")}</p><PrimaryButton className="mt-4" onClick={() => setSheetOpen(false)}>{t("actions.close")}</PrimaryButton></div></BottomSheet>
  </div>;
}
