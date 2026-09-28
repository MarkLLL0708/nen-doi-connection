import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Block, ColourFlood, FlameMark, PrimaryButton, Pressable, SlideUp, Stagger, StaggerItem, SwipeDeck, haptic, pointFrom, spring } from "@/components/visual";
import type { Me } from "@/lib/couple";
import { dateKey } from "@/lib/daily";
import { todayIn } from "@/lib/occasions";
import { floodFor } from "@/lib/flood";
import { shareResultCard } from "@/lib/share";
import i18n from "@/i18n";

export type GameType = "this_or_that" | "who_more_likely" | "guess" | "rapid_qa";
const GAMES: GameType[] = ["this_or_that", "who_more_likely", "guess", "rapid_qa"];
type Content = { a?: string; b?: string; text_vi?: string; question_self?: string; question_other?: string; options?: string[] };
type Session = { id: string; content_id: string; content: Content };
type Resp = { session_id: string; user_id: string; response: { pick?: string | number; text?: string } };
type Round = { id: string; type: GameType; played_on: string; answerer: string | null; created_at: string };
type Status = { total: number; completed: boolean; answerer: string | null; members: { user_id: string; done: number }[] };
const tone: Record<GameType, string> = { this_or_that: "block-butter", who_more_likely: "block-blush", guess: "block-plum", rapid_qa: "block-ember" };
const optionTones = ["block-butter", "block-blush", "block-ember", "block-cream"];

/** Round length and daily limit come from one place: the app_settings table (admin-editable). */
function useGameSettings() {
  return useQuery({ queryKey: ["gameSettings"], staleTime: 60_000, queryFn: async () => {
    const { data } = await supabase.from("app_settings").select("key,value");
    const get = (k: string, d: number) => Number((data ?? []).find((r) => r.key === k)?.value ?? d);
    return { roundSize: get("round_size", 8), limit: get("daily_game_limit", 2) };
  } });
}

function useRoundsToday(me: Me) {
  const day = dateKey(todayIn(me.couple!.timezone));
  return useQuery({ queryKey: ["rounds", day], refetchInterval: 5000, queryFn: async () => {
    const { data, error } = await supabase.from("game_rounds").select("id,type,played_on,answerer,created_at").eq("played_on", day).order("created_at");
    if (error) throw error;
    return (data ?? []) as Round[];
  } });
}

function useRound(roundId: string | undefined) {
  return useQuery({ enabled: !!roundId, queryKey: ["round", roundId], refetchInterval: (q) => (q.state.data?.status.completed ? false : 4000), queryFn: async () => {
    const { data: ss, error } = await supabase.from("game_sessions").select("id,content_id,game_content(content,sort_order)").eq("round_id", roundId!).order("created_at");
    if (error) throw error;
    const sessions = (ss ?? []).map((s) => ({ id: s.id, content_id: s.content_id, content: ((s as unknown as { game_content: { content: Content } | null }).game_content?.content ?? {}) })) as Session[];
    const { data: st } = await supabase.rpc("round_status", { _round: roundId! });
    const { data: rs } = await supabase.from("game_responses").select("session_id,user_id,response").in("session_id", sessions.map((s) => s.id));
    return { sessions, status: st as unknown as Status, resps: (rs ?? []) as unknown as Resp[] };
  } });
}

function usePartner(me: Me) {
  const { t } = useTranslation();
  return { partnerId: me.members.find((m) => m.user_id !== me.userId)?.user_id, partner: me.profile?.partner_call_name || me.partner?.display_name || t("app.setup.call.ban") };
}

export function PlayTab({ me }: { me: Me }) {
  const { t } = useTranslation();
  const [game, setGame] = useState<GameType | null>(null);
  const settings = useGameSettings();
  const rounds = useRoundsToday(me);
  const { partner } = usePartner(me);
  if (game) return <GameScreen me={me} type={game} onBack={() => setGame(null)} />;
  const limit = settings.data?.limit ?? 2;
  const used = rounds.data?.length ?? 0;
  return <div className="px-4 pt-8 pb-6">
    <p className="px-1 type-label text-muted-foreground">{t("feat.play.label")}</p>
    <h1 className="mt-3 px-1 type-display"><SlideUp>{t("feat.play.title")}</SlideUp></h1>
    <p className="mt-3 px-1 type-body text-muted-foreground">{t("feat.play.body", { size: settings.data?.roundSize ?? 8 })}</p>
    <p className="mt-4 inline-flex rounded-full bg-surface px-4 py-2 type-button nums">{used >= limit ? t("feat.play.limitReached", { limit }) : t("feat.play.limitLine", { used, limit })}</p>
    <Stagger className="mt-6 space-y-3">
      {GAMES.map((g) => {
        const rs = (rounds.data ?? []).filter((r) => r.type === g);
        return <StaggerItem key={g}>
          <Pressable haptics onClick={() => setGame(g)} className={`grain ${tone[g]} flex min-h-[150px] w-full flex-col justify-between rounded-[28px] p-6 text-left`}>
            <span className="relative z-[2] type-label">{t(`feat.play.gameNotes.${g}`, { partner })}</span>
            <span className="relative z-[2] mt-5 flex items-end justify-between gap-3">
              <span className="type-display text-[30px] leading-[1.15]">{t(`feat.play.games.${g}`, { partner })}</span>
              <span className="shrink-0 rounded-full bg-ink px-4 py-2 type-button text-cream">{rs.length ? t("feat.play.continue") : t("feat.play.start")}</span>
            </span>
          </Pressable>
        </StaggerItem>;
      })}
    </Stagger>
  </div>;
}

function GameScreen({ me, type, onBack }: { me: Me; type: GameType; onBack: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const settings = useGameSettings();
  const rounds = useRoundsToday(me);
  const round = (rounds.data ?? []).filter((r) => r.type === type).at(-1);
  const { data } = useRound(round?.id);
  const { partner, partnerId } = usePartner(me);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const limit = settings.data?.limit ?? 2;
  const used = rounds.data?.length ?? 0;

  const start = async () => {
    setBusy(true); setErr(null);
    const { error } = await supabase.rpc("start_round", { _type: type });
    setBusy(false);
    if (error) { setErr(error.message.includes("daily limit") ? t("feat.play.limitReached", { limit }) : t("feat.error")); return; }
    await qc.invalidateQueries({ queryKey: ["rounds"] });
  };
  const respond = async (s: Session, response: Resp["response"]) => {
    const { error } = await supabase.from("game_responses").insert({ session_id: s.id, couple_id: me.couple!.id, user_id: me.userId, response });
    if (error && error.code !== "23505") { setErr(t("feat.error")); return; }
    setErr(null);
    void qc.invalidateQueries({ queryKey: ["round", round?.id] }); void qc.invalidateQueries({ queryKey: ["today"] }); void qc.invalidateQueries({ queryKey: ["me"] });
  };

  const header = <>
    <button onClick={onBack} className="flex h-12 w-fit items-center gap-2 type-button"><ArrowLeft strokeWidth={2.5} className="size-5" />{t("feat.play.back")}</button>
    <h1 className="mt-2 px-1 type-display text-[32px] leading-[1.15]">{t(`feat.play.games.${type}`, { partner })}</h1>
  </>;

  let body: ReactNode;
  if (!rounds.data) body = <div className="grid flex-1 place-items-center"><FlameMark size={40} /></div>;
  else if (!round) body = <Block tone={tone[type]} className="mt-6">
    <p className="type-body">{t(`feat.play.gameNotes.${type}`, { partner })}</p>
    {used >= limit ? <p className="mt-4 type-title">{t("feat.play.limitReached", { limit })}</p>
      : <PrimaryButton className="mt-5 bg-ink text-cream" disabled={busy} onClick={() => void start()}>{t("feat.play.start")}</PrimaryButton>}
  </Block>;
  else if (!data) body = <div className="grid flex-1 place-items-center"><FlameMark size={40} /></div>;
  else if (!data.sessions.length) body = <p className="mt-6 type-body">{t("feat.play.empty")}</p>;
  else {
    const pick = (sid: string, uid: string | undefined) => data.resps.find((r) => r.session_id === sid && r.user_id === uid)?.response;
    const todo = data.sessions.filter((s) => !pick(s.id, me.userId));
    const doneBy = (uid: string | undefined) => data.status?.members.find((m) => m.user_id === uid)?.done ?? 0;
    if (data.status?.completed) body = <Results me={me} type={type} round={round} sessions={data.sessions} pick={pick} partnerId={partnerId} partner={partner}
      canStart={used < limit} onNew={() => void start()} busy={busy} limit={limit} />;
    else if (!todo.length) body = <Block tone={tone[type]} className="mt-6"><FlameMark size={36} /><p className="mt-4 type-title">{t("feat.play.waitingTitle")}</p><p className="mt-2 type-body">{t("feat.play.waiting", { partner })}</p></Block>;
    else if (type === "guess") {
      const answerer = round.answerer === me.userId;
      const answererDone = doneBy(round.answerer ?? undefined) >= data.sessions.length;
      body = !answerer && !answererDone
        ? <Block tone={tone[type]} className="mt-6"><FlameMark size={36} /><p className="mt-4 type-title">{t("feat.play.guess.waitAnswer", { partner })}</p></Block>
        : <ChoiceStep key={todo[0]!.id} s={todo[0]!} n={data.sessions.length - todo.length + 1} total={data.sessions.length} partner={partner}
          intro={t(answerer ? "feat.play.guess.youAnswer" : "feat.play.guess.youGuess", { partner })} self={answerer} onPick={(i) => void respond(todo[0]!, { pick: i })} />;
    } else if (type === "rapid_qa") {
      body = <RapidStep key={todo[0]!.id} s={todo[0]!} n={data.sessions.length - todo.length + 1} total={data.sessions.length} partner={partner} onSubmit={(text) => void respond(todo[0]!, { text })} />;
    } else {
      body = <>
        <p className="mt-2 px-1 type-caption text-muted-foreground">{t(`feat.play.gameNotes.${type}`, { partner })} · {t("feat.play.progress", { done: data.sessions.length - todo.length, total: data.sessions.length })}</p>
        <SwipeDeck className="mt-6" items={todo} getKey={(s) => s.id} cardClassName={tone[type]}
          onSwipe={(s, d) => void respond(s, { pick: type === "this_or_that" ? (d === "left" ? "a" : "b") : (d === "left" ? me.userId : partnerId ?? "partner") })}
          labels={type === "this_or_that" ? { skip: todo[0]?.content.a ?? "A", like: todo[0]?.content.b ?? "B" } : { skip: t("feat.play.me"), like: partner.toUpperCase() }}
          renderCard={(s) => <SwipeCard c={s.content} type={type} partner={partner} />} />
      </>;
    }
  }

  return <div className="flex flex-1 flex-col px-4 pt-4 pb-8">
    {header}
    {body}
    {err && <p role="alert" className="mt-4 type-button">{err}</p>}
  </div>;
}

const fill = (s: string | undefined, partner: string) => (s ?? "").split("{partner}").join(partner);

function SwipeCard({ c, type, partner }: { c: Content; type: GameType; partner: string }) {
  const { t } = useTranslation();
  if (type === "this_or_that") return <div className="relative z-[2] mt-auto">
    <p className="type-display text-[34px]">{c.a}</p>
    <p className="my-3 type-label">{t("feat.play.or")}</p>
    <p className="type-display text-[34px]">{c.b}</p>
  </div>;
  return <div className="relative z-[2] mt-auto">
    <p className="type-display text-[30px]">{fill(c.text_vi, partner)}</p>
    <p className="mt-4 type-label">← {t("feat.play.me")} · {partner.toUpperCase()} →</p>
  </div>;
}

function ChoiceStep({ s, n, total, partner, intro, self, onPick }: { s: Session; n: number; total: number; partner: string; intro: string; self: boolean; onPick: (i: number) => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  return <div className="mt-4 flex flex-1 flex-col">
    <p className="px-1 type-caption text-muted-foreground">{intro}</p>
    <div className={`grain ${tone.guess} mt-4 rounded-[28px] p-6`}>
      <p className="relative z-[2] type-label nums">{n}/{total}</p>
      <h2 className="relative z-[2] mt-3 type-display text-[28px] leading-[1.15] text-balance"><SlideUp>{fill(self ? s.content.question_self : s.content.question_other, partner)}</SlideUp></h2>
    </div>
    <div className="mt-4 space-y-3">
      {(s.content.options ?? []).map((o, i) => <Pressable key={o} haptics disabled={chosen !== null} onClick={() => { setChosen(i); onPick(i); }}
        className={`grain ${optionTones[i % 4]} flex min-h-16 w-full items-center rounded-[20px] px-5 text-left type-button text-[17px] disabled:opacity-60 ${chosen === i ? "ring-4 ring-foreground" : ""}`}>
        <span className="relative z-[2]">{o}</span></Pressable>)}
    </div>
  </div>;
}

const RAPID_SECONDS = 20;
function RapidStep({ s, n, total, partner, onSubmit }: { s: Session; n: number; total: number; partner: string; onSubmit: (text: string) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [left, setLeft] = useState(RAPID_SECONDS);
  const sent = useRef(false);
  const textRef = useRef(text); textRef.current = text;
  const submit = () => { if (sent.current) return; sent.current = true; haptic(12); onSubmit(textRef.current.trim()); };
  useEffect(() => {
    const id = window.setInterval(() => setLeft((l) => l - 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => { if (left <= 0) submit(); });
  const r = 34, C = 2 * Math.PI * r;
  return <div className="mt-4 flex flex-1 flex-col">
    <div className={`grain ${tone.rapid_qa} rounded-[28px] p-6`}>
      <div className="relative z-[2] flex items-start justify-between gap-4">
        <p className="type-label nums">{n}/{total}</p>
        <div className="relative grid size-20 shrink-0 place-items-center" role="timer" aria-label={t("feat.play.rapid.seconds", { s: Math.max(0, left) })}>
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="8" />
            <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={C}
              strokeDashoffset={C * (1 - Math.max(0, left) / RAPID_SECONDS)} style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <span className="font-display text-[24px] font-extrabold nums">{Math.max(0, left)}</span>
        </div>
      </div>
      <h2 className="relative z-[2] mt-4 type-display text-[28px] leading-[1.15] text-balance">{fill(s.content.text_vi, partner)}</h2>
    </div>
    <input autoFocus value={text} maxLength={120} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      placeholder={t("feat.play.rapid.placeholder")} aria-label={fill(s.content.text_vi, partner)}
      className="mt-4 h-16 w-full rounded-[20px] bg-surface px-5 type-body text-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50" />
    <PrimaryButton className="mt-4" onClick={submit}>{n === total ? t("feat.play.rapid.finish") : t("feat.play.rapid.next")}</PrimaryButton>
  </div>;
}

type PickFn = (sid: string, uid: string | undefined) => Resp["response"] | undefined;

export function verdictFor(type: GameType, ratio: number): string {
  const pool = i18n.t(`feat.play.verdicts.${type}`, { returnObjects: true }) as unknown as string[];
  return pool[Math.min(pool.length - 1, Math.floor(ratio * pool.length))] ?? "";
}

function Results({ me, type, round, sessions, pick, partnerId, partner, canStart, onNew, busy, limit }: {
  me: Me; type: GameType; round: Round; sessions: Session[]; pick: PickFn; partnerId: string | undefined; partner: string; canStart: boolean; onNew: () => void; busy: boolean; limit: number;
}) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const key = `nendoi.gameRevealed.${me.userId}.${round.id}`;
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [flood, setFlood] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (localStorage.getItem(key)) setOpen(true); }, [key]);
  const total = sessions.length;
  const other = partnerId;

  // Score for the card and header
  let count = 0, headline = "", shareScore = "";
  if (type === "guess") {
    const guesser = round.answerer === me.userId ? other : me.userId;
    count = sessions.filter((s) => pick(s.id, guesser)?.pick === pick(s.id, round.answerer ?? undefined)?.pick).length;
    headline = round.answerer === me.userId ? t("feat.play.guess.scoreAnswerer", { partner, count, total }) : t("feat.play.guess.scoreGuesser", { partner, count, total });
    shareScore = t("feat.play.shareScore", { count, total });
  } else if (type === "rapid_qa") {
    count = sessions.filter((s) => pick(s.id, me.userId)?.text && pick(s.id, other)?.text).length;
    headline = t(`feat.play.games.rapid_qa`);
    shareScore = t("feat.play.rapidScore", { count });
  } else {
    count = sessions.filter((s) => pick(s.id, me.userId)?.pick !== undefined && pick(s.id, me.userId)?.pick === pick(s.id, other)?.pick).length;
    headline = t("feat.play.score", { count, total });
    shareScore = `${Math.round((count / Math.max(1, total)) * 100)}%`;
  }
  const verdict = verdictFor(type, count / Math.max(1, total));

  if (!open) return <div ref={box} className="relative mt-6 flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[28px] bg-surface p-6">
    <ColourFlood at={at} active={flood} colourClass={floodFor("page")} onDone={() => { localStorage.setItem(key, "1"); setOpen(true); }} />
    <div className="relative z-[2]"><FlameMark size={40} /><p className="mt-4 type-title">{t("feat.play.readyTitle")}</p>
      <PrimaryButton className="mt-5" onClick={(e: MouseEvent<HTMLButtonElement>) => { setAt(pointFrom(e, box.current)); setFlood(true); haptic(20); }}>{t("feat.play.reveal")}</PrimaryButton></div>
  </div>;

  return <div className="mt-6 space-y-4">
    <div className={`grain ${tone[type]} rounded-[28px] p-6`}>
      <p className="relative z-[2] type-display text-[30px] leading-[1.15]">{headline}</p>
      <p className="relative z-[2] mt-3 type-body">{verdict}</p>
    </div>
    {type === "guess" ? <GuessMisses sessions={sessions} pick={pick} answerer={round.answerer ?? undefined} guesser={round.answerer === me.userId ? other : me.userId} partner={partner} />
      : type === "rapid_qa" ? <RapidReveal sessions={sessions} pick={pick} me={me} partnerId={other} partner={partner} />
      : <SwipeList type={type} sessions={sessions} pick={pick} me={me} partnerId={other} partner={partner} />}
    <ShareButton type={type} partner={partner} score={shareScore} verdict={verdict} />
    {canStart ? <PrimaryButton tone="surface" disabled={busy} onClick={onNew}>{t("feat.play.newRound")}</PrimaryButton>
      : <p className="px-1 type-button">{t("feat.play.limitReached", { limit })}</p>}
  </div>;
}

function SwipeList({ type, sessions, pick, me, partnerId, partner }: { type: GameType; sessions: Session[]; pick: PickFn; me: Me; partnerId: string | undefined; partner: string }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const label = (c: Content, p: unknown) => p === undefined ? "…" : type === "this_or_that" ? (p === "a" ? c.a : c.b) : p === me.userId ? t("feat.play.you") : partner;
  return <ul className="space-y-3">
    {sessions.map((s, i) => { const a = pick(s.id, me.userId)?.pick, b = pick(s.id, partnerId)?.pick;
      return <motion.li key={s.id} initial={reduce ? { opacity: 0 } : { opacity: 0, x: i % 2 ? 40 : -40, rotate: i % 2 ? 4 : -4 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ ...spring, delay: i * 0.05 }}
        className="rounded-[20px] bg-surface p-4">
        <p className="type-caption">{type === "this_or_that" ? `${s.content.a} / ${s.content.b}` : fill(s.content.text_vi, partner)}</p>
        <div className="mt-2 flex items-center justify-between gap-3 type-button">
          <span>{t("feat.play.you")}: {label(s.content, a)}</span><span>{partner}: {label(s.content, b)}</span>
          {a !== undefined && a === b && <Check strokeWidth={3} className="size-5 shrink-0" aria-hidden="true" />}
        </div>
      </motion.li>; })}
  </ul>;
}

function GuessMisses({ sessions, pick, answerer, guesser, partner }: { sessions: Session[]; pick: PickFn; answerer: string | undefined; guesser: string | undefined; partner: string }) {
  const { t } = useTranslation();
  const misses = sessions.filter((s) => pick(s.id, guesser)?.pick !== pick(s.id, answerer)?.pick);
  const [shown, setShown] = useState(misses.length ? 1 : 0);
  if (!misses.length) return <p className="px-1 type-title">{t("feat.play.guess.noMiss")}</p>;
  return <div className="space-y-3">
    <AnimatePresence initial={false}>
      {misses.slice(0, shown).map((s, i) => { const opts = s.content.options ?? [];
        return <motion.div key={s.id} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring} className="rounded-[20px] bg-surface p-5">
          <p className="type-label text-muted-foreground">{t("feat.play.guess.missLabel", { n: i + 1, total: misses.length })}</p>
          <p className="mt-2 type-title">{fill(s.content.question_other, partner)}</p>
          <p className="mt-3 type-button">{t("feat.play.guess.truth")}: {opts[Number(pick(s.id, answerer)?.pick)] ?? "…"}</p>
          <p className="mt-1 type-body text-muted-foreground line-through decoration-2">{t("feat.play.guess.guessed")}: {opts[Number(pick(s.id, guesser)?.pick)] ?? "…"}</p>
        </motion.div>; })}
    </AnimatePresence>
    {shown < misses.length && <PrimaryButton tone="surface" arrow={false} onClick={() => setShown((n) => n + 1)}>{t("feat.play.guess.nextMiss")}</PrimaryButton>}
  </div>;
}

function RapidReveal({ sessions, pick, me, partnerId, partner }: { sessions: Session[]; pick: PickFn; me: Me; partnerId: string | undefined; partner: string }) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [flood, setFlood] = useState(false);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const advancing = useRef(false); // the flood's exit animation also reports "done"; advance once per tap
  const s = sessions[i]!;
  // Alternate the flood between two contrasting colours so every switch is visible on the ember card.
  const floodTone = i % 2 ? "block-ink" : "block-butter";
  return <div ref={box} className={`grain ${tone.rapid_qa} relative overflow-hidden rounded-[28px] p-5`}>
    <ColourFlood at={at} active={flood} colourClass={floodTone} onDone={() => { if (!advancing.current) return; advancing.current = false; setI((n) => n + 1); setFlood(false); }} />
    <div className="relative z-[2]">
      <p className="type-label nums">{i + 1}/{sessions.length}</p>
      <p className="mt-2 type-title">{fill(s.content.text_vi, partner)}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[{ n: t("feat.play.you"), v: pick(s.id, me.userId)?.text }, { n: partner, v: pick(s.id, partnerId)?.text }].map((x) =>
          <div key={x.n} className="min-h-[96px] rounded-[18px] bg-cream p-4 text-ink"><p className="type-label">{x.n}</p><p className="mt-2 type-button break-words">{x.v || t("feat.play.rapid.blank")}</p></div>)}
      </div>
      {i < sessions.length - 1 && <PrimaryButton className="mt-4 bg-ink text-cream" onClick={(e: MouseEvent<HTMLButtonElement>) => { if (flood) return; advancing.current = true; setAt(pointFrom(e, box.current)); setFlood(true); }}>{t("feat.play.rapid.nextPrompt")}</PrimaryButton>}
    </div>
  </div>;
}

function ShareButton({ type, partner, score, verdict }: { type: GameType; partner: string; score: string; verdict: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false), [err, setErr] = useState(false);
  // The card never carries names: the guess title is rendered without the partner's name.
  const label = type === "guess" ? t("feat.play.guessShareName") : t(`feat.play.games.${type}`);
  void partner;
  const go = async () => {
    setBusy(true); setErr(false);
    try { await shareResultCard({ tone: tone[type], label, score, verdict, fileName: `nendoi-${type}` }); } catch { setErr(true); }
    setBusy(false);
  };
  return <div>
    <PrimaryButton arrow={false} disabled={busy} onClick={() => void go()}><Share2 strokeWidth={2.5} className="size-5" aria-hidden="true" />{busy ? t("feat.play.sharing") : t("feat.play.share")}</PrimaryButton>
    {err && <p role="alert" className="mt-2 type-button">{t("feat.play.shareFail")}</p>}
  </div>;
}
