import { useRef, useState, type MouseEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Block, ColourFlood, FlameMark, PrimaryButton, Pressable, SlideUp, Stagger, StaggerItem, SwipeDeck, pointFrom, spring } from "@/components/visual";
import type { Me } from "@/lib/couple";
import { dailySlice, dateKey } from "@/lib/daily";
import { todayIn } from "@/lib/occasions";

type GameType = "this_or_that" | "who_more_likely";
type Content = { id: string; type: string; content: { a?: string; b?: string; text_vi?: string }; sort_order: number };
type Resp = { session_id: string; user_id: string; response: { pick: string } };
const tone: Record<GameType, string> = { this_or_that: "block-butter", who_more_likely: "block-blush" };

function useGame(me: Me, type: GameType) {
  const couple = me.couple!;
  const day = dateKey(todayIn(couple.timezone));
  return useQuery({ queryKey: ["game", type, day], refetchInterval: 5000, queryFn: async () => {
    const { data: all, error } = await supabase.from("game_content").select("id,type,content,sort_order").eq("type", type).order("sort_order");
    if (error) throw error;
    const cards = dailySlice((all ?? []) as unknown as Content[], day, 5);
    if (!cards.length) return { day, cards, sessions: {} as Record<string, string>, resps: [] as Resp[] };
    await supabase.from("game_sessions").upsert(cards.map((c) => ({ couple_id: couple.id, content_id: c.id, played_on: day })), { onConflict: "couple_id,content_id,played_on", ignoreDuplicates: true });
    const { data: ss } = await supabase.from("game_sessions").select("id,content_id").eq("couple_id", couple.id).eq("played_on", day).in("content_id", cards.map((c) => c.id));
    const sessions = Object.fromEntries((ss ?? []).map((s) => [s.content_id, s.id])) as Record<string, string>;
    const { data: rs } = await supabase.from("game_responses").select("session_id,user_id,response").in("session_id", Object.values(sessions));
    return { day, cards, sessions, resps: (rs ?? []) as unknown as Resp[] };
  } });
}

export function PlayTab({ me }: { me: Me }) {
  const { t } = useTranslation();
  const [game, setGame] = useState<GameType | null>(null);
  if (game) return <GameScreen me={me} type={game} onBack={() => setGame(null)} />;
  return <div className="px-4 pt-8">
    <p className="px-1 type-label text-muted-foreground">{t("feat.play.label")}</p>
    <h1 className="mt-3 px-1 type-display"><SlideUp>{t("feat.play.title")}</SlideUp></h1>
    <p className="mt-3 px-1 type-body text-muted-foreground">{t("feat.play.body")}</p>
    <Stagger className="mt-6 space-y-3">
      {(["this_or_that", "who_more_likely"] as const).map((g) => <StaggerItem key={g}><GameTile me={me} type={g} onOpen={() => setGame(g)} /></StaggerItem>)}
    </Stagger>
  </div>;
}

function GameTile({ me, type, onOpen }: { me: Me; type: GameType; onOpen: () => void }) {
  const { t } = useTranslation();
  const { data } = useGame(me, type);
  const mine = data ? data.resps.filter((r) => r.user_id === me.userId).length : 0;
  const total = data?.cards.length ?? 5;
  return <Pressable haptics onClick={onOpen} className={`grain ${tone[type]} flex min-h-[180px] w-full flex-col justify-between rounded-[28px] p-6 text-left`}>
    <span className="relative z-[2] type-label">{t("feat.play.today")} · {mine}/{total}</span>
    <span className="relative z-[2] mt-6 flex items-end justify-between gap-3">
      <span className="type-display text-[34px]">{t(`feat.play.games.${type}`)}</span>
      <span className="shrink-0 rounded-full bg-ink px-4 py-2 type-button text-cream">{mine >= total && total > 0 ? t("feat.play.played") : t("feat.play.start")}</span>
    </span>
  </Pressable>;
}

function GameScreen({ me, type, onBack }: { me: Me; type: GameType; onBack: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useGame(me, type);
  const partnerId = me.partner?.id;
  const partner = me.profile?.partner_call_name || me.partner?.display_name || t("app.setup.call.ban");
  const [err, setErr] = useState(false);

  if (!data) return <div className="grid flex-1 place-items-center"><FlameMark size={40} /></div>;
  const mineBy = (cid: string, uid: string | undefined) => data.resps.find((r) => r.session_id === data.sessions[cid] && r.user_id === uid)?.response.pick;
  const todo = data.cards.filter((c) => !mineBy(c.id, me.userId));
  const partnerDone = !!partnerId && data.cards.every((c) => mineBy(c.id, partnerId));

  const onSwipe = async (c: Content, dir: "left" | "right") => {
    const pick = type === "this_or_that" ? (dir === "left" ? "a" : "b") : (dir === "left" ? me.userId : partnerId ?? "partner");
    const { error } = await supabase.from("game_responses").upsert({ session_id: data.sessions[c.id]!, couple_id: me.couple!.id, user_id: me.userId, response: { pick } }, { onConflict: "session_id,user_id" });
    setErr(!!error);
    if (!error) { void qc.invalidateQueries({ queryKey: ["game", type] }); void qc.invalidateQueries({ queryKey: ["today"] }); void qc.invalidateQueries({ queryKey: ["me"] }); }
  };

  return <div className="flex flex-1 flex-col px-4 pt-4">
    <button onClick={onBack} className="flex h-12 w-fit items-center gap-2 type-button"><ArrowLeft strokeWidth={2.5} className="size-5" />{t("feat.play.back")}</button>
    <h1 className="mt-2 px-1 type-display text-[34px]">{t(`feat.play.games.${type}`)}</h1>
    {!data.cards.length ? <p className="mt-6 type-body">{t("feat.play.empty")}</p>
      : todo.length ? <>
        <p className="mt-2 px-1 type-caption text-muted-foreground">{t(`feat.play.gameNotes.${type}`, { partner })}</p>
        <SwipeDeck className="mt-6" items={todo} getKey={(c) => c.id} cardClassName={tone[type]} onSwipe={(c, d) => void onSwipe(c, d)}
          labels={type === "this_or_that" ? { skip: todo[0]?.content.a ?? "A", like: todo[0]?.content.b ?? "B" } : { skip: t("feat.play.me"), like: partner.toUpperCase() }}
          renderCard={(c) => <GameCard c={c} type={type} partner={partner} />} />
      </> : <Results me={me} type={type} cards={data.cards} pick={mineBy} partnerId={partnerId} partner={partner} ready={partnerDone} />}
    {err && <p role="alert" className="mt-4 type-button">{t("feat.error")}</p>}
  </div>;
}

function GameCard({ c, type, partner }: { c: Content; type: GameType; partner: string }) {
  const { t } = useTranslation();
  if (type === "this_or_that") return <div className="relative z-[2] mt-auto">
    <p className="type-display text-[34px]">{c.content.a}</p>
    <p className="my-3 type-label">{t("feat.play.or")}</p>
    <p className="type-display text-[34px]">{c.content.b}</p>
  </div>;
  return <div className="relative z-[2] mt-auto">
    <p className="type-display text-[30px]">{(c.content.text_vi ?? "").split("{partner}").join(partner)}</p>
    <p className="mt-4 type-label">← {t("feat.play.me")} · {partner.toUpperCase()} →</p>
  </div>;
}

function Results({ me, type, cards, pick, partnerId, partner, ready }: { me: Me; type: GameType; cards: Content[]; pick: (cid: string, uid: string | undefined) => string | undefined; partnerId: string | undefined; partner: string; ready: boolean }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [flood, setFlood] = useState(false);
  const [open, setOpen] = useState(false);
  const label = (c: Content, p: string | undefined) => !p ? "…" : type === "this_or_that" ? (p === "a" ? c.content.a : c.content.b) : p === me.userId ? (me.profile?.display_name ?? t("feat.play.you")) : partner;
  const matches = cards.filter((c) => pick(c.id, me.userId) && pick(c.id, me.userId) === pick(c.id, partnerId)).length;

  if (!ready) return <Block tone={tone[type]} className="mt-6"><FlameMark size={36} /><p className="mt-4 type-title">{t("feat.play.waitingTitle")}</p><p className="mt-2 type-body">{t("feat.play.waiting", { partner })}</p></Block>;
  if (!open) return <div ref={box} className="relative mt-6 flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[28px] bg-surface p-6">
    <ColourFlood at={at} active={flood} colourClass={tone[type]} onDone={() => setOpen(true)} />
    <div className="relative z-[2]"><p className="type-title">{t("feat.play.readyTitle")}</p>
      <PrimaryButton className="mt-5" onClick={(e: MouseEvent<HTMLButtonElement>) => { setAt(pointFrom(e, box.current)); setFlood(true); }}>{t("feat.play.reveal")}</PrimaryButton></div>
  </div>;
  return <div className={`grain ${tone[type]} mt-6 rounded-[28px] p-5`}>
    <p className="relative z-[2] type-display text-[30px]">{t("feat.play.score", { count: matches, total: cards.length })}</p>
    <ul className="relative z-[2] mt-4 space-y-3">
      {cards.map((c, i) => { const a = pick(c.id, me.userId), b = pick(c.id, partnerId);
        return <motion.li key={c.id} initial={reduce ? { opacity: 0 } : { opacity: 0, x: i % 2 ? 40 : -40, rotate: i % 2 ? 4 : -4 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ ...spring, delay: i * 0.06 }}
          className="rounded-[20px] bg-cream p-4 text-ink">
          <p className="type-caption">{type === "this_or_that" ? `${c.content.a} / ${c.content.b}` : (c.content.text_vi ?? "").split("{partner}").join(partner)}</p>
          <div className="mt-2 flex items-center justify-between gap-3 type-button">
            <span>{t("feat.play.you")}: {label(c, a)}</span><span>{partner}: {label(c, b)}</span>
            {a && a === b && <Check strokeWidth={3} className="size-5 shrink-0" aria-hidden="true" />}
          </div>
        </motion.li>; })}
    </ul>
  </div>;
}
