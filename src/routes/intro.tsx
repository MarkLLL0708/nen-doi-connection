import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { GhostButton, Logo, PrimaryButton, SlideUp, Ticker, snap } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { INTRO_SEEN_KEY } from "@/lib/couple";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";

export const Route = createFileRoute("/intro")({
  head: () => ({ meta: [
    { title: i18n.t("app.meta.introTitle") },
    { name: "description", content: i18n.t("app.meta.introDesc") },
    { property: "og:title", content: i18n.t("app.meta.introTitle") },
    { property: "og:description", content: i18n.t("app.meta.introDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Intro,
});

const tones = ["block-ember", "block-plum", "block-butter"];

function Intro() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const slides = t("app.intro", { returnObjects: true }) as { label: string; title: string }[];
  const finish = () => { localStorage.setItem(INTRO_SEEN_KEY, "1"); void navigate({ to: "/auth" }); };
  const next = () => (i < slides.length - 1 ? setI(i + 1) : finish());
  const tone = tones[i]!;
  return <Shell className={cn("grain transition-colors", tone)}>
    <Ticker text={t("app.ticker")} className="relative z-[2] bg-ink text-cream" />
    <div className="relative z-[2] flex flex-1 flex-col px-5 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <Logo onBlock />
        <div className="flex gap-1.5" aria-hidden="true">{slides.map((_, k) => <span key={k} className={cn("h-2 rounded-full bg-current transition-all", k === i ? "w-6" : "w-2 opacity-40")} />)}</div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} className="flex flex-1 flex-col justify-end pb-10"
          initial={reduce ? { opacity: 0 } : { x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { x: -60, opacity: 0 }} transition={{ duration: 0.3, ease: snap }}>
          <p className="type-label">{slides[i]!.label}</p>
          <h1 className="mt-4 type-display text-[44px] leading-[1.15]"><SlideUp delay={0.05}>{slides[i]!.title}</SlideUp></h1>
        </motion.div>
      </AnimatePresence>
      <PrimaryButton onClick={next}>{t("app.next")}</PrimaryButton>
      <GhostButton className="mt-2 self-start" onClick={finish}>{t("app.introHave")}</GhostButton>
    </div>
  </Shell>;
}
