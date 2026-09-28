import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useTranslation } from "react-i18next";
import { Camera, ChevronRight, MessageCircle, Puzzle, type LucideIcon } from "lucide-react";
import { PRODUCT_NAME, PRODUCT_WORDMARK } from "@/config/product";
import { BottomTabBar, FadeUp, FlameStreak, Hairline, ICON_STROKE, ImageSlot, Wordmark, ease, type TabKey } from "@/components/visual";
import i18n from "@/i18n";

export const Route = createFileRoute("/preview-home")({
  head: () => ({ meta: [
    { title: `${i18n.t("home.title")} · ${PRODUCT_NAME}` },
    { name: "description", content: i18n.t("home.description") },
    { property: "og:title", content: `${i18n.t("home.title")} · ${PRODUCT_NAME}` },
    { property: "og:description", content: i18n.t("home.description") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PreviewHome,
});

const sample = { days: 412, streak: 27 };

function Row({ Icon, title, status }: { Icon: LucideIcon; title: string; status: string }) {
  return <div className="group flex items-center gap-4 py-5">
    <Icon strokeWidth={ICON_STROKE} className="size-[22px] shrink-0 text-foreground" aria-hidden="true" />
    <div className="min-w-0 flex-1"><p className="type-body text-foreground">{title}</p><p className="mt-0.5 type-caption text-muted-foreground">{status}</p></div>
    <ChevronRight strokeWidth={ICON_STROKE} className="size-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
  </div>;
}

function PreviewHome() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>("home");
  const reduce = useReducedMotion();
  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: photoRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-18, 18]);

  return <div className="min-h-screen bg-page">
    <div className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-hidden bg-background text-foreground shadow-soft">
      <main className="px-6 pb-32">
        <div className="flex items-center justify-between py-5"><Wordmark text={PRODUCT_WORDMARK} /><span className="type-caption text-muted-foreground">{t("home.sampleNote")}</span></div>

        <motion.section className="pt-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <p className="label-caps">{t("hero.label")}</p>
          <p className="mt-3 type-display nums">{sample.days}</p>
          <p className="mt-1 type-title italic text-muted-foreground">{t("home.daysLabel")}</p>
          <div className="mt-8"><FlameStreak count={sample.streak} /></div>
        </motion.section>

        <FadeUp delay={0.1} className="mt-12">
          <Hairline />
          <Row Icon={MessageCircle} title={t("home.question")} status={t("home.questionStatus")} />
          <Hairline />
          <Row Icon={Camera} title={t("home.photo")} status={t("home.photoStatus")} />
          <Hairline />
          <Row Icon={Puzzle} title={t("home.game")} status={t("home.gameStatus")} />
          <Hairline />
        </FadeUp>

        <FadeUp className="mt-12">
          <div ref={photoRef} className="overflow-hidden rounded-[16px]">
            <motion.div style={{ y }} className="-my-5"><ImageSlot className="h-[340px] rounded-none" /></motion.div>
          </div>
          <p className="mt-3 type-caption text-muted-foreground">{t("home.photoCaption")}</p>
        </FadeUp>

        <FadeUp className="mt-12">
          <div className="flex items-baseline justify-between gap-4 rounded-[16px] bg-secondary px-5 py-5">
            <div><p className="label-caps">{t("home.occasionLabel")}</p><p className="mt-1.5 type-title">{t("home.occasion")}</p></div>
            <p className="shrink-0 type-body text-accent">{t("home.occasionIn")}</p>
          </div>
        </FadeUp>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[390px]"><BottomTabBar active={tab} onSelect={setTab} /></div>
    </div>
  </div>;
}
