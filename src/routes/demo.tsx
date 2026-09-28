import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, BookOpen, Compass, Heart, House, Lock, MessageCircle, User } from "lucide-react";
import {
  ActionTile, AvatarDuo, Avatar, Block, ColourFlood, CountUp, FitText, GeometricBurst, PageTransition, PrimaryButton, Pressable,
  SlideUp, StreakLine, SwipeDeck, pointFrom, spring,
} from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { LangSwitch } from "@/components/landing/SiteChrome";
import { cn } from "@/lib/utils";
import s1 from "@/assets/sample-1.jpg";
import s2 from "@/assets/sample-2.jpg";
import s3 from "@/assets/sample-3.jpg";
import i18n from "@/i18n";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [
    { title: i18n.t("landing.meta.demoTitle") },
    { name: "description", content: i18n.t("landing.meta.demoDesc") },
    { property: "og:title", content: i18n.t("landing.meta.demoTitle") },
    { property: "og:description", content: i18n.t("landing.meta.demoDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Demo,
});

/* Fully client-side: nothing here talks to the backend. */
type Tab = "home" | "explore" | "date" | "memories" | "profile";
const tabList: { key: Tab; Icon: typeof House }[] = [
  { key: "home", Icon: House }, { key: "explore", Icon: Compass }, { key: "date", Icon: Heart }, { key: "memories", Icon: BookOpen }, { key: "profile", Icon: User },
];

function Demo() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("home");
  const [moment, setMoment] = useState(false);
  const [sparks, setSparks] = useState(14);
  const [answered, setAnswered] = useState(false);
  return <Shell className="pb-28">
    <div className="sticky top-0 z-40 flex items-center gap-2 block-butter px-3 py-2">
      <p className="flex-1 type-button text-[13px]">{t("landing.demo.banner")}</p>
      <LangSwitch className="scale-90" />
      <Link to="/" className="inline-flex h-9 items-center rounded-full bg-ink px-3 text-[12px] font-bold text-cream">{t("landing.demo.exit")}</Link>
    </div>
    <PageTransition key={moment ? "m" : tab} className="flex flex-1 flex-col">
      {moment ? <Moment onBack={() => setMoment(false)} onDone={() => { if (!answered) { setAnswered(true); setSparks((n) => n + 1); } }} />
        : tab === "home" ? <HomeDemo answered={answered} sparks={sparks} onOpen={() => setMoment(true)} />
        : tab === "explore" ? <ExploreDemo /> : tab === "date" ? <DateDemo /> : tab === "memories" ? <MemoriesDemo answered={answered} /> : <ProfileDemo />}
    </PageTransition>
    <div className="px-4 pb-4 pt-6"><Link to="/auth" className="grain block-ember flex h-14 items-center justify-center rounded-[18px] type-button"><span className="relative z-[2]">{t("landing.demo.start")}</span></Link></div>
    {!moment && <nav aria-label={t("navigationLabel")} className="fixed inset-x-0 bottom-4 z-30 mx-auto flex h-16 max-w-[358px] items-center rounded-full bg-nav p-1.5 shadow-float">
      {tabList.map(({ key, Icon }) => { const on = tab === key; return <Pressable key={key} haptics aria-label={t(`landing.demo.tabs.${key}`)} aria-current={on ? "page" : undefined} onClick={() => setTab(key)}
        className="relative flex h-full flex-1 items-center justify-center rounded-full" style={{ color: on ? "var(--nav-active-fg)" : "var(--nav-fg)" }}>
        {on && <motion.span layoutId="demo-pill" className="absolute inset-0 rounded-full" style={{ background: "var(--nav-active)" }} transition={spring} />}
        <Icon strokeWidth={2} className="relative size-[22px]" aria-hidden="true" />
      </Pressable>; })}
    </nav>}
  </Shell>;
}

function HomeDemo({ answered, sparks, onOpen }: { answered: boolean; sparks: number; onOpen: () => void }) {
  const { t } = useTranslation();
  return <div className="space-y-4 px-4 pt-5">
    <div className="flex items-center justify-between gap-3 px-1">
      <div><p className="type-label text-muted-foreground">{t("landing.demo.home.together")}</p><h1 className="mt-1 type-display text-[32px]"><SlideUp>{t("landing.demo.home.hi")}</SlideUp></h1></div>
      <AvatarDuo size={40} people={[{ name: "Minh", done: answered, avatar: "geo:1" }, { name: "Linh", done: true, avatar: "geo:2" }]} />
    </div>
    <Block tone="block-ember" className="pb-6 pt-5">
      <FitText max={120} measure="412"><CountUp to={412} /></FitText>
      <p className="type-title">{t("landing.demo.home.days")}</p>
    </Block>
    <div className="flex items-center justify-between gap-3 px-1">
      <StreakLine count={answered ? 8 : 7} note={t("landing.demo.home.streakNote")} />
      <span className="shrink-0 rounded-full block-butter px-3 py-1.5 type-button text-[13px]">{sparks} {t("landing.demo.home.sparks")}</span>
    </div>
    <div>
      <p className="mb-2 px-1 type-caption text-muted-foreground">{t("landing.demo.home.progress")}</p>
      <ActionTile tone="block-plum" icon={MessageCircle} title={t("landing.demo.home.moment")} youDone={answered} partnerDone youName="Minh" partnerName="Linh" onClick={onOpen} />
    </div>
    <Block tone="block-tet" className="rounded-[24px] p-5">
      <p className="type-label">{t("landing.demo.home.next")}</p>
      <p className="mt-2 type-title">{t("landing.demo.home.nextTitle")} · {t("landing.demo.home.nextIn", { count: 9 })}</p>
    </Block>
  </div>;
}

function Moment({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const presets = t("landing.demo.moment.presets", { returnObjects: true }) as string[];
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [flood, setFlood] = useState(false);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  return <div ref={box} className="relative flex flex-1 flex-col px-4 pt-3">
    <button onClick={onBack} className="flex h-12 w-fit items-center gap-2 type-button"><ArrowLeft strokeWidth={2.5} className="size-5" aria-hidden="true" />{t("landing.demo.moment.back")}</button>
    <div className="grain block-blush relative mt-2 flex min-h-[520px] flex-col overflow-hidden rounded-[28px] p-5">
      <ColourFlood at={at} active={flood} colourClass="block-ink" onDone={() => { setOpen(true); setBurst((b) => b + 1); onDone(); }} />
      {!open ? <div className="relative z-[2] flex flex-1 flex-col">
        <p className="type-label">{t("landing.demo.moment.pack")}</p>
        <h1 className="mt-3 type-display text-[30px] leading-[1.15]">{t("landing.demo.moment.q")}</h1>
        {!sent ? <>
          <p className="mt-4 flex items-center gap-2 type-caption"><Lock strokeWidth={2.5} className="size-4" aria-hidden="true" />{t("landing.demo.moment.linhDone")}</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={t("landing.demo.moment.placeholder")}
            className="mt-4 w-full rounded-[18px] bg-cream p-4 type-body text-ink placeholder:text-ink/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-ink/30" />
          <div className="mt-3 flex flex-wrap gap-2">{presets.map((p) => <button key={p} onClick={() => setText(p)} className="rounded-full border-2 border-current px-3 py-1.5 text-[13px] font-bold">{p}</button>)}</div>
          <PrimaryButton className="mt-auto" disabled={!text.trim()} onClick={() => setSent(true)}>{t("landing.demo.moment.send")}</PrimaryButton>
        </> : <div className="mt-auto">
          <p className="type-title">{t("landing.demo.moment.both")}</p>
          <PrimaryButton className="mt-4" onClick={(e: MouseEvent<HTMLButtonElement>) => { setAt(pointFrom(e, box.current)); setFlood(true); }}>{t("landing.demo.moment.reveal")}</PrimaryButton>
        </div>}
      </div> : <div className="relative z-[3] flex flex-1 flex-col text-cream">
        <GeometricBurst fire={burst} />
        <p className="type-display text-[24px] leading-[1.15]">{t("landing.demo.moment.q")}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[[t("landing.demo.moment.you"), text], [t("landing.demo.moment.partner"), t("landing.demo.moment.linhAnswer")]].map(([n, a], i) => <motion.div key={n} className="rounded-[18px] bg-cream p-3 text-ink"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: i ? 40 : -40 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: i * 0.08 }}>
            <p className="type-label">{n}</p><p className="mt-2 break-words text-[15px] font-bold leading-snug">{a}</p>
          </motion.div>)}
        </div>
        <p className="mt-auto rounded-[18px] block-butter p-4 type-button">{t("landing.demo.moment.saved")}</p>
      </div>}
    </div>
  </div>;
}

function ExploreDemo() {
  const { t } = useTranslation();
  const decks = t("landing.demo.explore.decks", { returnObjects: true }) as { name: string; desc: string; count: number }[];
  const tones = ["block-blush", "block-butter", "block-deep", "block-plum", "block-ember", "block-cream"];
  return <div className="px-4 pt-6">
    <h1 className="px-1 type-display"><SlideUp>{t("landing.demo.explore.title")}</SlideUp></h1>
    <p className="mt-3 px-1 type-body text-muted-foreground">{t("landing.demo.explore.body")}</p>
    <div className="mt-6 grid grid-cols-2 gap-3">
      {decks.map((d, i) => <div key={d.name} className={cn("grain relative flex min-h-[200px] flex-col overflow-hidden rounded-[24px] p-4", tones[i])}>
        <svg viewBox="0 0 40 40" className="absolute -right-4 -top-4 size-24 opacity-90" aria-hidden="true">
          {i % 3 === 0 ? <circle cx="20" cy="20" r="16" fill="currentColor" opacity="0.18" /> : i % 3 === 1 ? <rect x="6" y="6" width="28" height="28" rx="4" fill="currentColor" opacity="0.18" transform="rotate(45 20 20)" /> : <path d="M4 34 A16 16 0 0 1 36 34 Z" fill="currentColor" opacity="0.18" />}
        </svg>
        <span className="relative z-[2] self-start rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-cream">{i < 2 ? t("landing.demo.explore.free") : t("landing.demo.explore.premium")}</span>
        <p className="relative z-[2] mt-auto type-title text-[19px] leading-[1.2]">{d.name}</p>
        <p className="relative z-[2] mt-1 text-[13px] font-medium leading-snug">{d.desc}</p>
        <p className="relative z-[2] mt-2 type-label">{t("landing.demo.explore.count", { count: d.count })}</p>
      </div>)}
    </div>
  </div>;
}

const LINH_LIKES = new Set([0, 2, 4]);
function DateDemo() {
  const { t } = useTranslation();
  const ideas = (t("landing.demo.date.ideas", { returnObjects: true }) as string[]).map((title, i) => ({ i, title }));
  const [left, setLeft] = useState(ideas.map((x) => x.i));
  const [list, setList] = useState<number[]>([]);
  const [match, setMatch] = useState<string | null>(null);
  return <div className="px-4 pt-6">
    <h1 className="px-1 type-display"><SlideUp>{t("landing.demo.date.title")}</SlideUp></h1>
    <p className="mt-3 px-1 type-body text-muted-foreground">{t("landing.demo.date.body")}</p>
    {left.length ? <SwipeDeck className="mt-6" items={ideas.filter((x) => left.includes(x.i))} getKey={(x) => String(x.i)} cardClassName="block-ember"
      labels={{ skip: t("cb.skip"), like: t("cb.like") }}
      onSwipe={(x, d) => { setLeft((l) => l.filter((k) => k !== x.i)); if (d === "right" && LINH_LIKES.has(x.i)) { setList((l) => [...l, x.i]); setMatch(x.title); } else setMatch(null); }}
      renderCard={(x) => <p className="relative z-[2] mt-auto type-display text-[30px] leading-[1.15]">{x.title}</p>} />
      : <p className="mt-6 px-1 type-body">{t("landing.demo.date.done")}</p>}
    {match && <p role="status" className="mt-4 rounded-[18px] block-butter p-4 type-button">{t("landing.demo.date.match")} · {match}</p>}
    <h2 className="mt-8 px-1 type-title">{t("landing.demo.date.listTitle")}</h2>
    {list.length ? <ul className="mt-3 space-y-2">{list.map((k) => <li key={k} className="rounded-[18px] bg-surface p-4 type-button">{ideas[k]!.title}</li>)}</ul>
      : <p className="mt-2 px-1 type-body text-muted-foreground">{t("landing.demo.date.empty")}</p>}
  </div>;
}

function MemoriesDemo({ answered }: { answered: boolean }) {
  const { t } = useTranslation();
  const items = t("landing.demo.memories.items", { returnObjects: true }) as { title: string; date: string }[];
  const imgs = [s1, s2, s3];
  return <div className="px-4 pt-6">
    <h1 className="px-1 type-display"><SlideUp>{t("landing.demo.memories.title")}</SlideUp></h1>
    <div className="mt-6 space-y-3">
      {answered && <div className="grain block-blush rounded-[24px] p-5"><p className="relative z-[2] type-label">{t("landing.demo.moment.pack")}</p><p className="relative z-[2] mt-2 type-title">{t("landing.demo.moment.q")}</p></div>}
      {items.map((m, i) => <div key={m.title} className="overflow-hidden rounded-[24px] bg-surface">
        <img src={imgs[i]} alt="" loading="lazy" className="h-44 w-full object-cover" />
        <div className="flex items-center justify-between gap-3 p-4"><p className="type-title text-[19px]">{m.title}</p><p className="type-label text-muted-foreground">{m.date}</p></div>
      </div>)}
    </div>
  </div>;
}

function ProfileDemo() {
  const { t } = useTranslation();
  const rows: [string, string][] = [
    [t("landing.demo.profile.call"), t("landing.demo.profile.callValue")],
    [t("landing.demo.profile.stage"), t("landing.demo.profile.stageValue")],
    [t("landing.demo.profile.city"), `${t("landing.demo.profile.cityValue")} · ${t("landing.demo.profile.partnerCity")}`],
  ];
  return <div className="px-4 pt-6">
    <h1 className="px-1 type-display"><SlideUp>{t("landing.demo.profile.title")}</SlideUp></h1>
    <div className="mt-6 flex items-center gap-4 px-1"><Avatar value="geo:1" size={64} /><p className="type-display text-[28px]">{t("landing.demo.profile.name")}</p></div>
    <div className="mt-6 space-y-2">{rows.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-3 rounded-[18px] bg-surface p-4"><span className="type-caption text-muted-foreground">{k}</span><span className="type-button text-right">{v}</span></div>)}</div>
    <p className="mt-6 rounded-[18px] block-ink p-4 type-button">{t("landing.demo.profile.privacy")}</p>
    <p className="mt-3 px-1 type-caption text-muted-foreground">{t("landing.demo.profile.unpair")}</p>
  </div>;
}
