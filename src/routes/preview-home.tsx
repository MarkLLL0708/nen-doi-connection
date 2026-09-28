import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Gamepad2, MessageCircle } from "lucide-react";
import { PRODUCT_NAME } from "@/config/product";
import { ActionTile, Block, BottomTabBar, CountUp, FitText, formatNumber, Logo, OccasionBanner, PageTransition, PhotoTile, SlideUp, Stagger, StaggerItem, StreakLine, Ticker, type TabKey } from "@/components/visual";
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

const sample = { days: 412, streak: 23, tet: 131 };

function PreviewHome() {
  const { t, i18n: i } = useTranslation();
  const [tab, setTab] = useState<TabKey>("home");
  return <div className="min-h-screen bg-page">
    <PageTransition className="mx-auto min-h-screen max-w-[390px] bg-background pb-28 text-foreground">
      <Ticker text={t("sample.ticker")} className="block-butter" />
      <header className="flex items-center justify-between px-5 py-4"><Logo /><span className="type-label text-muted-foreground">{t("home.sampleNote")}</span></header>

      <div className="px-4">
        <Block tone="block-ember" className="pb-7 pt-5">
          <p className="type-label">{t("sample.today")}</p>
          <FitText max={140} measure={formatNumber(sample.days, i.language)} className="mt-1"><CountUp to={sample.days} /></FitText>
          <h1 className="type-display"><SlideUp delay={0.2}>{t("sample.daysLabel")}</SlideUp></h1>
        </Block>
      </div>

      <div className="px-5 py-6"><StreakLine count={sample.streak} /></div>

      <Stagger className="space-y-3 px-4">
        <StaggerItem><ActionTile tone="block-plum" icon={MessageCircle} title={t("sample.tiles.question")} youDone partnerDone={false} /></StaggerItem>
        <StaggerItem><ActionTile tone="block-butter" icon={Camera} title={t("sample.tiles.photo")} youDone={false} partnerDone={false} /></StaggerItem>
        <StaggerItem><ActionTile tone="block-blush" icon={Gamepad2} title={t("sample.tiles.game")} youDone partnerDone /></StaggerItem>
      </Stagger>

      <div className="mt-6 px-4"><PhotoTile title={t("sample.photoTitle")} /></div>
      <div className="mt-6 px-4"><OccasionBanner days={sample.tet} /></div>
    </PageTransition>
    <div className="fixed inset-x-0 bottom-4 z-30 mx-auto max-w-[390px] px-4"><BottomTabBar id="home-tabs" active={tab} onSelect={setTab} /></div>
  </div>;
}
