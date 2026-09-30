import { NotificationBell } from "@/components/app/NotificationBell";
import { SensitiveTopics } from "@/components/app/SensitiveTopics";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Brush, Camera, Fingerprint, Gamepad2, MessageCircle, MessagesSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ActionTile, AvatarDuo, Block, BottomTabBar, CountUp, FitText, FlameMark, GeometricBurst, Logo, OccasionBanner, PageTransition, PhotoTile,
  Pressable, SlideUp, Stagger, StaggerItem, StreakLine, Ticker, applyTheme, formatNumber, type TabKey, type ThemeMode,
} from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { setThemeEverywhere, storedTheme } from "@/components/app/GlobalControls";
import { PlayTab } from "@/components/app/PlayTab";
import { DateTab } from "@/components/app/DateTab";
import { MemoriesTab } from "@/components/app/MemoriesTab";
import { CategoryCard, ExploreTab, useCategoryState } from "@/components/app/ExploreTab";
import { updateProfile, useAvatarUrl, useMe, type Me, type TodayStatus } from "@/lib/couple";
import { diffDays, milestoneToday, parseDate, todayIn, upcomingOccasions } from "@/lib/occasions";
import i18n from "@/i18n";
import { FAKE_HOUR_KEY, testFlag } from "@/lib/testmode";

const tabKeys = ["home", "explore", "play", "date", "memories", "settings"] as const;

export const Route = createFileRoute("/_authenticated/app")({
  validateSearch: z.object({ tab: z.enum(tabKeys).optional() }),
  head: () => ({ meta: [
    { title: i18n.t("app.meta.homeTitle") },
    { name: "description", content: i18n.t("app.meta.homeDesc") },
    { property: "og:title", content: i18n.t("app.meta.homeTitle") },
    { property: "og:description", content: i18n.t("app.meta.homeDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AppScreen,
});

function AppScreen() {
  const { data: me, isLoading } = useMe();
  const navigate = useNavigate();
  const { tab = "home" } = Route.useSearch();

  useEffect(() => {
    if (!me) return;
    applyTheme(storedTheme() ?? (me.profile?.theme as ThemeMode | undefined) ?? "system");
    if (!me.profile?.onboarded || !me.couple) void navigate({ to: "/onboarding", replace: true });
  }, [me, navigate]);

  if (isLoading || !me?.couple || !me.profile?.onboarded) return <Shell><div className="grid flex-1 place-items-center"><FlameMark size={40} /></div></Shell>;

  return <Shell className="pb-[calc(9.5rem+env(safe-area-inset-bottom))]">
    <PageTransition key={tab} className="flex flex-1 flex-col">
      {tab === "home" ? <Home me={me} /> : tab === "explore" ? <ExploreTab me={me} /> : tab === "settings" ? <SettingsTab me={me} /> : tab === "play" ? <PlayTab me={me} /> : tab === "date" ? <DateTab me={me} /> : <MemoriesTab me={me} />}
    </PageTransition>
    <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-[390px] px-4">
      <BottomTabBar id="app-tabs" active={tab} onSelect={(k: TabKey) => void navigate({ to: "/app", search: k === "home" ? {} : { tab: k } })} />
    </div>
  </Shell>;
}

function Home({ me }: { me: Me }) {
  const { t, i18n: i } = useTranslation();
  const navigate = useNavigate();
  const couple = me.couple!;
  const cat = useCategoryState();
  const partnerCall = me.profile?.partner_call_name || t("app.setup.call.ban");
  const partnerName = me.partner?.display_name || partnerCall;
  const solo = me.members.length < 2;
  const today = todayIn(couple.timezone);
  const days = couple.start_date ? diffDays(today, parseDate(couple.start_date)) : 0;
  const streak = me.streak?.current ?? 0;
  const myUrl = useAvatarUrl(me.profile?.avatar);
  const partnerUrl = useAvatarUrl(me.partner?.avatar);

  const { data: status } = useQuery({ queryKey: ["today", couple.id],
    queryFn: async () => { const { data, error } = await supabase.rpc("today_status"); if (error) throw error; return data as unknown as TodayStatus; } });
  const mine = status?.members.find((m) => m.user_id === me.userId);
  const theirs = status?.members.find((m) => m.user_id !== me.userId);
  const anyDone = (m?: { question: boolean; photo: boolean; game: boolean }) => !!m && (m.question || m.photo || m.game);
  const hour = testFlag(FAKE_HOUR_KEY) ? 20 : status?.local_hour ?? 0;
  const atRisk = !!status && hour >= 20 && !(anyDone(mine) && anyDone(theirs));

  const occasion = useMemo(() => {
    const birthdays = [me.profile, me.partner].filter((p) => p?.birthday).map((p) => ({ name: (p!.display_name ?? "").toUpperCase(), date: p!.birthday! }));
    return upcomingOccasions(today, { startDate: couple.start_date, birthdays })[0];
  }, [today.getTime(), couple.start_date, me.profile?.birthday, me.partner?.birthday]); // eslint-disable-line react-hooks/exhaustive-deps

  // Milestones fire the burst once per device.
  const [burst, setBurst] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);
  useEffect(() => {
    const m = milestoneToday(days, streak, today, couple.start_date);
    if (!m) return;
    const key = `nendoi.milestone.${couple.id}.${m}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setMilestone(m); setBurst(Date.now());
  }, [days, streak]); // eslint-disable-line react-hooks/exhaustive-deps

  const people = (k: "question" | "photo" | "game") => [
    { name: me.profile?.display_name ?? t("app.home.you"), done: !!mine?.[k], avatar: me.profile?.avatar, url: myUrl },
    { name: partnerName, done: !!theirs?.[k], avatar: me.partner?.avatar, url: partnerUrl },
  ];
  const tile = (k: "question" | "photo" | "game", tone: string, icon: typeof Camera) =>
    <ActionTile onClick={k === "question" ? () => void navigate({ to: "/question" }) : k === "photo" ? () => void navigate({ to: "/photo" }) : () => void navigate({ to: "/app", search: { tab: "play" } })} tone={tone} icon={icon} title={t(`app.home.tiles.${k}`)} youDone={!!mine?.[k]} partnerDone={!!theirs?.[k]}
      youName={t("app.home.you")} partnerName={partnerName} avatars={<AvatarDuo size={32} people={people(k)} />} />;

  const occName = occasion ? t(`app.occasionNames.${occasion.kind}`, { year: occasion.year, count: occasion.count ?? 0, name: occasion.name ?? "" }) : "";
  const msText = milestone ? (milestone.startsWith("streak") ? t("app.home.milestone.streak", { count: streak }) : milestone.startsWith("days") ? t("app.home.milestone.days", { count: days }) : t("app.home.milestone.anniv")) : null;

  return <div className="relative">
    <GeometricBurst fire={burst} />
    <Ticker text={t("app.ticker")} className="block-butter" />
    <header className="flex items-center gap-3 px-5 py-4"><Logo /><NotificationBell me={me} /></header>

    {solo && <div className="px-4 pb-4"><Pressable haptics onClick={() => void navigate({ to: "/pair" })} className="grain block-plum flex w-full items-center justify-between gap-3 rounded-[24px] p-5 text-left">
      <span className="relative z-[2] type-title text-[20px]">{t("app.home.soloBanner", { partner: partnerCall })}</span>
      <span className="relative z-[2] shrink-0 rounded-full bg-cream px-4 py-2 type-button text-ink">{t("app.home.soloCta")}</span>
    </Pressable></div>}

    {msText && <div className="px-4 pb-4"><Block tone="block-butter" className="rounded-[24px] p-5"><p className="type-label">{t("app.home.milestone.label")}</p><p className="mt-2 type-title">{msText}</p></Block></div>}

    <div className="px-4">
      <Block tone="block-ember" className="pb-7 pt-5">
        <p className="type-label">{t("sample.today")}</p>
        {couple.start_date ? <>
          <FitText max={140} measure={formatNumber(days, i.language)} className="mt-1"><CountUp to={days} /></FitText>
          <h1 className="type-display"><SlideUp delay={0.2}>{t("sample.daysLabel")}</SlideUp></h1>
        </> : <h1 className="mt-3 type-display">{t("app.home.noStart")}</h1>}
      </Block>
    </div>

    <div className="px-5 py-6"><StreakLine count={streak} atRisk={atRisk} note={atRisk ? t("app.home.risk") : t("app.home.steady")} /></div>
    {atRisk && <p role="status" className="mx-4 -mt-2 mb-5 rounded-[20px] bg-ink px-5 py-4 type-button text-cream">{t("app.home.risk")}</p>}

    <div className="mb-3 px-4"><CategoryCard me={me} onOpen={() => void navigate({ to: "/app", search: { tab: "explore" } })} /></div>
    <Stagger className="space-y-3 px-4">
      <StaggerItem>{tile("question", "block-plum", MessageCircle)}</StaggerItem>
      <StaggerItem>{tile("photo", "block-butter", Camera)}</StaggerItem>
      <StaggerItem>{tile("game", "block-blush", Gamepad2)}</StaggerItem>
    </Stagger>
    <div className="mt-3 px-4"><Pressable haptics onClick={() => void navigate({ to: "/thumb" })} className="block-ink flex w-full items-center justify-between gap-3 rounded-[24px] p-5 text-left">
      <span><span className="block type-title text-[20px]">{t("feat.thumb.open")}</span><span className="mt-1 block type-caption opacity-80">{t("feat.thumb.openSub", { partner: partnerCall })}</span></span>
      <Fingerprint strokeWidth={2} className="size-6 shrink-0" aria-hidden="true" />
    </Pressable></div>
    <div className="mt-3 px-4"><Pressable haptics onClick={() => void navigate({ to: "/draw" })} className="grain block-plum flex w-full items-center justify-between gap-3 rounded-[24px] p-5 text-left">
      <span className="relative z-[2]"><span className="block type-title text-[20px]">{t("feat.draw.open")}</span><span className="mt-1 block type-caption opacity-80">{t("feat.draw.openSub", { partner: partnerCall })}</span></span>
      <Brush strokeWidth={2} className="relative z-[2] size-6 shrink-0" aria-hidden="true" />
    </Pressable></div>
    <div className="mt-3 px-4"><Pressable haptics onClick={() => void navigate({ to: "/coach" })} className="flex w-full items-center justify-between gap-3 rounded-[24px] bg-surface p-5 text-left">
      <span><span className="block type-title text-[20px]">{t("feat.coach.open")}</span><span className="mt-1 block type-caption text-muted-foreground">{t("feat.coach.openSub")}</span></span>
      <MessagesSquare strokeWidth={2} className="size-7 shrink-0" aria-hidden="true" />
    </Pressable></div>

    <div className="mt-6 px-4"><PhotoTile title={t("app.home.photoTitle")} /></div>
    {occasion && <div className="mt-6 px-4"><OccasionBanner
      label={occasion.days === 0 ? t("app.home.occasionToday", { name: occName }) : t("app.home.occasion", { name: occName, count: occasion.days })}
      note={t(`app.home.occasionNotes.${occasion.kind}`)} /></div>}
  </div>;
}

function SettingsTab({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ThemeMode>(storedTheme() ?? (me.profile?.theme as ThemeMode | undefined) ?? "system");
  const change = async (m: ThemeMode) => {
    setMode(m); setThemeEverywhere(m);
    await updateProfile(me.userId, { theme: m });
    void qc.invalidateQueries({ queryKey: ["me"] });
  };
  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    applyTheme("system");
    void navigate({ to: "/auth", replace: true });
  };
  return <div className="px-5 pt-8">
    <p className="type-label text-muted-foreground">{t("app.settings.label")}</p>
    <h1 className="mt-3 type-display"><SlideUp>{t("app.settings.title")}</SlideUp></h1>
    <div className="mt-8"><ThemeSwitchLabelled mode={mode} onChange={(m) => void change(m)} /></div>
    {me.couple && <SensitiveTopics me={me} />}
    <button onClick={() => void signOut()} className="mt-12 type-button underline decoration-2 underline-offset-[6px]">{t("app.settings.signOut")}</button>
  </div>;
}

function ThemeSwitchLabelled({ mode, onChange }: { mode: ThemeMode; onChange: (m: ThemeMode) => void }) {
  const { t } = useTranslation();
  return <div className="space-y-3">
    {(["system", "light", "dark"] as const).map((m) => <Pressable key={m} haptics aria-pressed={mode === m} onClick={() => onChange(m)}
      className={`flex h-16 w-full items-center rounded-[20px] px-5 type-button text-[17px] ${mode === m ? "block-ember" : "bg-surface text-foreground"}`}>{t(`app.settings.${m}`)}</Pressable>)}
  </div>;
}
