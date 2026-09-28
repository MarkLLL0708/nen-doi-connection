import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PRODUCT_NAME, PRODUCT_WORDMARK } from "@/config/product";
import { AvatarPair, BottomSheet, BottomTabBar, Card, DuotoneScreen, duotones, EmptyState, FadeUp, FlameGlyph, FlameStreak, Hairline, ImageSlot, LightBloom, PrimaryButton, SwipeCard, Tag, TextButton, Wordmark, type TabKey } from "@/components/visual";
import i18n from "@/i18n";

export const Route = createFileRoute("/styleguide")({
  head: () => ({ meta: [
    { title: `${i18n.t("pageTitle")} · ${PRODUCT_NAME}` },
    { name: "description", content: i18n.t("pageDescription") },
    { property: "og:title", content: `${i18n.t("pageTitle")} · ${PRODUCT_NAME}` },
    { property: "og:description", content: i18n.t("pageDescription") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Styleguide,
});

const TONE_MARKS = "ấ ầ ẩ ẫ ậ · ế ề ể ễ ệ · ỡ ờ ở ợ ớ · ự ừ ử ữ ứ · ỷ ỳ ỹ ỵ";
const TONE_WORDS = "Nguyễn Thượng Hữu Ưởng Kỹ Mỗi";
const swatches = [
  { key: "ivory", light: "#FAF6F0", dark: "#14100E", cls: "bg-background border border-hairline" },
  { key: "surface", light: "#FFFFFF · 70%", dark: "#1E1815", cls: "bg-card border border-hairline" },
  { key: "espresso", light: "#1F1A17", dark: "#F3EBDD", cls: "bg-foreground" },
  { key: "secondary", light: "#6B5F57", dark: "#B3A596", cls: "bg-muted-foreground" },
  { key: "terracotta", light: "#B8432A", dark: "#D9694F", cls: "bg-accent" },
  { key: "gold", light: "#B08D57", dark: "#C9A46A", cls: "bg-gold" },
  { key: "rose", light: "#C98B86", dark: "#C98B86", cls: "bg-rose" },
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <FadeUp><section className="space-y-6"><p className="label-caps">{title}</p>{children}</section></FadeUp>;
}

function Showcase({ dark }: { dark: boolean }) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bloom, setBloom] = useState(false);
  const [firstDone, setFirstDone] = useState(true);
  const [secondDone, setSecondDone] = useState(false);
  const [swiped, setSwiped] = useState<"left" | "right" | null>(null);
  const [tab, setTab] = useState<TabKey>("home");
  const [streak, setStreak] = useState(27);
  const [atRisk, setAtRisk] = useState(false);
  useEffect(() => { if (!bloom) return; const id = window.setTimeout(() => setBloom(false), 2600); return () => window.clearTimeout(id); }, [bloom]);

  return <div className={dark ? "dark" : undefined}>
    <div className="bg-background text-foreground">
      <div className="flex items-center gap-3 border-y border-hairline px-6 py-4"><span className="size-1.5 rounded-full bg-accent" /><span className="label-caps">{t(dark ? "modes.dark" : "modes.light")}</span></div>

      <header className="px-6 pb-12 pt-12">
        <p className="label-caps">{t("hero.label")}</p>
        <h1 className="mt-5 font-serif text-[48px] leading-[1.2] tracking-[-0.01em]">{t("hero.title")}</h1>
        <p className="mt-5 max-w-[300px] text-[16.5px] leading-relaxed text-muted-foreground">{t("hero.sub")}</p>
        <ImageSlot className="mt-10 h-[260px]" />
      </header>

      <div className="space-y-14 px-6 pb-16">
        <Section title={t("sections.colour")}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">{swatches.map((s) => <div key={s.key}><div className={`h-20 rounded-[12px] ${s.cls}`} /><p className="mt-2.5 text-[14px]">{t(`colours.${s.key}`)}</p><p className="text-[12.5px] text-muted-foreground">{dark ? s.dark : s.light}</p></div>)}</div>
        </Section>

        <Section title={t("sections.duotones")}>
          <div className="grid grid-cols-2 gap-3">{duotones.map((d) => <DuotoneScreen key={d} tone={d} className="min-h-[128px] p-4"><span /><span className="font-serif text-[20px] leading-[1.35]">{t(`categories.${d}`)}</span></DuotoneScreen>)}</div>
          <DuotoneScreen tone="deep"><span className="text-[11.5px] uppercase tracking-[0.12em] text-duo-foreground/75">{t("categories.deep")}</span><div><h3 className="font-serif text-[30px] leading-[1.32]">{t("type.titleSample")}</h3><p className="mt-3 text-[15px] text-duo-foreground/75">{t("tags.minutes")}</p></div></DuotoneScreen>
        </Section>

        <Section title={t("sections.type")}>
          <div className="space-y-7">
            <div><p className="label-caps mb-2">{t("type.display")} · 52</p><p className="font-serif text-[52px] leading-[1.22]">{t("type.displaySample")}</p></div>
            <div><p className="label-caps mb-2">{t("type.title")} · 30</p><p className="font-serif text-[30px] leading-[1.32]">{t("type.titleSample")}</p></div>
            <div><p className="label-caps mb-2">{t("type.body")} · 16.5</p><p className="text-[16.5px] leading-[1.65]">{t("type.bodySample")}</p></div>
            <div><p className="label-caps mb-2">{t("type.caption")} · 13</p><p className="text-[13px] text-muted-foreground">{t("type.captionSample")}</p></div>
            <div><p className="label-caps mb-2">{t("type.label")} · 11.5</p><p className="label-caps">{t("hero.label")} · {t("card.label")}</p></div>
          </div>
        </Section>

        <Section title={t("sections.toneMarks")}>
          <div className="space-y-4" data-testid="tone-marks">
            {[56, 44, 30].map((s) => <p key={s} className="font-serif leading-[1.35]" style={{ fontSize: s }}>{TONE_WORDS}</p>)}
            <p className="font-serif text-[30px] leading-[1.4]">{TONE_MARKS}</p>
            <p className="text-[16.5px] leading-[1.65]">{TONE_MARKS} — {TONE_WORDS}</p>
            <p className="text-[13px] leading-[1.6]">{TONE_MARKS} — {TONE_WORDS}</p>
            <p className="label-caps">{TONE_WORDS}</p>
          </div>
        </Section>

        <Section title={t("sections.buttons")}>
          <div className="space-y-2"><PrimaryButton onClick={() => setSheetOpen(true)}>{t("actions.openSheet")}</PrimaryButton><div className="flex justify-center"><TextButton>{t("actions.later")}</TextButton></div></div>
        </Section>

        <Section title={t("sections.tags")}>
          <div className="flex flex-wrap gap-2"><Tag accent>{t("tags.new")}</Tag><Tag>{t("tags.daily")}</Tag><Tag>{t("tags.minutes")}</Tag></div>
        </Section>

        <Section title={t("sections.cards")}>
          <Card><p className="label-caps">{t("card.label")}</p><h3 className="mt-4 font-serif text-[26px] leading-[1.35]">{t("card.title")}</h3><p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t("card.body")}</p><Hairline className="my-6" /><AvatarPair firstDone secondDone={false} /></Card>
        </Section>

        <Section title={t("sections.images")}>
          <div className="grid grid-cols-5 gap-3"><ImageSlot className="col-span-3 h-[220px]" /><div className="col-span-2 space-y-3"><ImageSlot tone="memory" className="h-[104px]" label=" " /><ImageSlot tone="distance" className="h-[104px]" label=" " /></div></div>
        </Section>

        <Section title={t("sections.together")}>
          <AvatarPair firstDone={firstDone} secondDone={secondDone} />
          <p className="text-[15px] italic text-muted-foreground">{t("waiting", { partner: t("avatars.partner") })}</p>
          <div className="flex gap-5"><TextButton onClick={() => setFirstDone(!firstDone)}>{t("avatars.toggleYou")}</TextButton><TextButton onClick={() => setSecondDone(!secondDone)}>{t("avatars.togglePartner")}</TextButton></div>
        </Section>

        <Section title={t("sections.streak")}>
          <div className="flex items-end gap-8">{[3, 30, 90].map((n) => <div key={n} className="flex flex-col items-center gap-3"><FlameGlyph streak={n} size={20 + n / 4} /><span className="text-[12.5px] text-muted-foreground">{n}</span></div>)}<div className="flex flex-col items-center gap-3"><FlameGlyph atRisk size={30} /><span className="text-[12.5px] text-muted-foreground">{t("streak.atRisk")}</span></div></div>
          <Hairline />
          <FlameStreak count={streak} atRisk={atRisk} />
          <div className="flex gap-5"><TextButton onClick={() => { setStreak((s) => s + 10); setAtRisk(false); }}>{t("streak.growing")}</TextButton><TextButton onClick={() => setAtRisk(!atRisk)}>{t("streak.atRisk")}</TextButton><TextButton onClick={() => { setStreak(27); setAtRisk(false); }}>{t("actions.reset")}</TextButton></div>
        </Section>

        <Section title={t("sections.empty")}><EmptyState /></Section>

        <Section title={t("sections.motion")}>
          <div className="relative overflow-hidden rounded-[16px] border border-hairline px-6 py-12">
            <LightBloom active={bloom} />
            <div className="relative z-[1] text-center"><p className="label-caps">{t("bloom.label")}</p><p className="mt-3 font-serif text-[26px] leading-[1.35]">{t("bloom.text")}</p><div className="mt-6 flex justify-center"><TextButton onClick={() => setBloom(true)}>{t("actions.bloom")}</TextButton></div></div>
          </div>
        </Section>

        <Section title={t("sections.swipe")}>
          <SwipeCard onSwipe={setSwiped} />
          <p className="text-[13px] text-muted-foreground" aria-live="polite">{swiped ? t(swiped === "right" ? "swipe.kept" : "swipe.skipped") : t("swipe.hint")}</p>
        </Section>

        <Section title={t("sections.nav")}>
          <div className="overflow-hidden rounded-[16px] border border-hairline"><BottomTabBar active={tab} onSelect={setTab} className="border-t-0" /></div>
        </Section>
      </div>
      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} dark={dark}>
        <p className="label-caps">{t("sheet.label")}</p><h3 className="mt-4 font-serif text-[30px] leading-[1.32]">{t("sheet.title")}</h3><p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">{t("sheet.body")}</p>
        <div className="mt-8 space-y-1"><PrimaryButton onClick={() => setSheetOpen(false)}>{t("actions.begin")}</PrimaryButton><div className="flex justify-center"><TextButton onClick={() => setSheetOpen(false)}>{t("actions.close")}</TextButton></div></div>
      </BottomSheet>
    </div>
  </div>;
}

function Styleguide() {
  const { t } = useTranslation();
  return <div className="min-h-screen bg-page">
    <div className="mx-auto min-h-screen w-full max-w-[390px] overflow-hidden bg-background shadow-soft">
      <div className="flex items-center justify-between px-6 py-5">
        <Wordmark text={PRODUCT_WORDMARK} />
        <div className="flex items-center gap-4">
          <Link to="/preview-home" className="text-[13px] text-foreground underline decoration-foreground/30 underline-offset-4">{t("actions.viewHome")}</Link>
          <button onClick={() => { void i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi"); }} className="text-[13px] text-muted-foreground hover:text-foreground">{t("actions.switchLanguage")}</button>
        </div>
      </div>
      <Showcase dark={false} />
      <Showcase dark />
    </div>
  </div>;
}
