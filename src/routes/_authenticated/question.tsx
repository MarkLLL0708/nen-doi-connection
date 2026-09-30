import { questionPackTone } from "@/lib/packs";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Flame, HandHeart, Heart, Laugh, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ColourFlood, FlameMark, PrimaryButton, Pressable, SlideUp, haptic, pointFrom, spring } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { useMe, type Me } from "@/lib/couple";
import i18n from "@/i18n";
import { floodFor, floodText } from "@/lib/flood";

export const Route = createFileRoute("/_authenticated/question")({
  head: () => ({ meta: [
    { title: i18n.t("question.metaTitle") },
    { name: "description", content: i18n.t("question.metaDesc") },
    { property: "og:title", content: i18n.t("question.metaTitle") },
    { property: "og:description", content: i18n.t("question.metaDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: QuestionScreen,
});


type Today = { date: string; id: string; pack: string; text_vi: string; text_vi_north: string | null; text_vi_south: string | null;
  sensitive_on: boolean; consent_mine: boolean | null; consent_partner: boolean | null; partner_answered: boolean };
type Answer = { id: string; user_id: string; body: string };
type Reaction = { id: string; answer_id: string; user_id: string; kind: string };
type Reply = { id: string; user_id: string; body: string; created_at: string };

const reactionIcons: { kind: "heart" | "laugh" | "fire" | "hug"; icon: LucideIcon }[] = [
  { kind: "heart", icon: Heart }, { kind: "laugh", icon: Laugh }, { kind: "fire", icon: Flame }, { kind: "hug", icon: HandHeart },
];

export function questionText(q: Pick<Today, "text_vi" | "text_vi_north" | "text_vi_south">, dialect: string | null | undefined, partner: string) {
  const base = (dialect === "bac" && q.text_vi_north) || (dialect === "nam" && q.text_vi_south) || q.text_vi;
  return base.split("{partner}").join(partner);
}

function sizeFor(text: string) {
  return text.length <= 60 ? "text-[34px]" : text.length <= 110 ? "text-[28px]" : "text-[24px]";
}

function QuestionScreen() {
  const { data: me, isLoading } = useMe();
  const go = useNavigate();
  useEffect(() => { if (!isLoading && (!me?.couple || !me.profile?.onboarded)) void go({ to: "/onboarding", replace: true }); }, [isLoading, me, go]);
  if (!me?.couple) return <Shell><div className="grid flex-1 place-items-center"><FlameMark size={40} /></div></Shell>;
  return <QuestionFlow me={me} />;
}

function QuestionFlow({ me }: { me: Me }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const partnerCall = me.profile?.partner_call_name || t("app.setup.call.ban");
  const partnerName = me.partner?.display_name || partnerCall;
  const solo = me.members.length < 2;
  // A question always shows, topic or not — the live listener refreshes it when the other person answers.
  const today = useQuery({ queryKey: ["todayQuestion", me.couple!.id], queryFn: async () => {
    const { data, error } = await supabase.rpc("today_question" as never); if (error) throw error; return data as unknown as Today | null;
  } });
  const q = today.data;

  const answers = useQuery({ enabled: !!q, queryKey: ["answers", q?.id, q?.date], queryFn: async () => {
    const { data, error } = await supabase.from("question_answers").select("id,user_id,body").eq("question_id", q!.id).eq("answer_date", q!.date);
    if (error) throw error; return data as Answer[];
  } });
  const mine = answers.data?.find((a) => a.user_id === me.userId);
  const theirs = answers.data?.find((a) => a.user_id !== me.userId);

  if (today.isLoading || !q || (answers.isLoading && !answers.data)) {
    return <Shell><div className="grid flex-1 place-items-center p-8 text-center">{today.isLoading || answers.isLoading ? <FlameMark size={40} /> : <p className="type-title">{t("question.empty")}</p>}</div></Shell>;
  }

  const tone = questionPackTone[q.pack] ?? "block-ember";
  const text = questionText(q, me.profile?.dialect, partnerCall);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["answers"] }); void qc.invalidateQueries({ queryKey: ["todayQuestion"] }); void qc.invalidateQueries({ queryKey: ["today"] }); void qc.invalidateQueries({ queryKey: ["me"] }); };
  const backHome = () => void navigate({ to: "/app" });

  if (!mine) return <AnswerStep tone={tone} q={q} text={text} me={me} partnerCall={partnerCall} solo={solo} onBack={backHome} onSent={refresh} />;
  if (!theirs) return <Waiting q={q} me={me} mine={mine} partnerCall={partnerCall} onBack={backHome} onConsent={refresh} />;
  return <Reveal tone={tone} q={q} text={text} me={me} mine={mine} theirs={theirs} partnerName={partnerName} onBack={backHome} />;
}

function TopBar({ label, onBack }: { label: string; onBack: () => void }) {
  const { t } = useTranslation();
  return <div className="relative z-[3] flex items-center gap-3 px-5 pt-5">
    <Pressable aria-label={t("question.back")} onClick={onBack} className="grid size-11 place-items-center rounded-full bg-current/10"><ArrowLeft strokeWidth={2.5} className="size-5" aria-hidden="true" /></Pressable>
    <p className="type-label">{label}</p>
  </div>;
}

function AnswerStep({ tone, q, text, me, partnerCall, solo, onBack, onSent }: { tone: string; q: Today; text: string; me: Me; partnerCall: string; solo: boolean; onBack: () => void; onSent: () => void }) {
  const { t } = useTranslation();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [passing, setPassing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    if (!body.trim()) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from("question_answers").insert({ couple_id: me.couple!.id, question_id: q.id, answer_date: q.date, body: body.trim() });
    setBusy(false);
    if (error && error.code !== "23505") { setErr(t("app.error")); return; }
    haptic(15); onSent();
  };
  // Silent: no reveal, no partner notification, no streak or limit effect. The database picks the next question.
  const pass = async (mode: "skip" | "na") => {
    setPassing(true); setErr(null);
    const { data, error } = await supabase.rpc("pass_question" as never, { _mode: mode } as never);
    setPassing(false);
    const res = data as { ok?: boolean; reason?: string } | null;
    if (error) { setErr(t("app.error")); return; }
    if (res && res.ok === false) { setErr(t(res.reason === "answered" ? "question.passAnswered" : "question.passEmpty")); return; }
    setBody(""); haptic(10); onSent();
  };
  return <Shell className={`grain ${tone}`}>
    <TopBar label={t(`question.packs.${q.pack}`)} onBack={onBack} />
    <div className="relative z-[2] flex flex-1 flex-col px-5 pb-8 pt-8">
      <p className="type-label opacity-80">{t("question.today")}</p>
      <h1 className={`mt-3 font-display font-extrabold leading-[1.15] tracking-[-0.01em] text-balance break-words ${sizeFor(text)}`}><SlideUp>{text}</SlideUp></h1>
      {solo && <p className="mt-4 type-body opacity-90">{t("question.solo", { partner: partnerCall })}</p>}
      <label className="sr-only" htmlFor="answer">{t("question.today")}</label>
      <textarea id="answer" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={6}
        placeholder={t("question.placeholder", { partner: partnerCall })}
        className="mt-8 w-full flex-1 resize-none rounded-[24px] bg-background p-5 type-body text-[18px] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 min-h-[180px]" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Pressable disabled={passing || busy} onClick={() => void pass("skip")}
          className="h-11 rounded-full px-4 type-button text-[13px] ring-2 ring-current/30 disabled:opacity-50">{passing ? t("question.passing") : t("question.skip")}</Pressable>
        <Pressable disabled={passing || busy} onClick={() => void pass("na")}
          className="h-11 rounded-full px-4 type-button text-[13px] ring-2 ring-current/30 disabled:opacity-50">{t("question.na")}</Pressable>
      </div>
      {err && <p role="alert" className="mt-3 type-button">{err}</p>}
      <PrimaryButton className="mt-5 h-16 bg-ink text-cream text-[18px]" disabled={busy || passing || !body.trim()} onClick={() => void send()}>{busy ? t("question.sending") : t("question.send")}</PrimaryButton>
    </div>
  </Shell>;
}

function ConsentCard({ q, me, partnerCall, onDone }: { q: Today; me: Me; partnerCall: string; onDone: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  if (me.members.length < 2) return null;
  if (q.sensitive_on) return <p className="rounded-[20px] bg-surface p-5 type-button">{t("question.consent.on")}</p>;
  if (q.consent_mine === true) return <p className="rounded-[20px] bg-surface p-5 type-button">{t("question.consent.mineYes", { partner: partnerCall })}</p>;
  if (q.consent_mine === false) return null;
  const decide = async (agreed: boolean) => {
    setBusy(true);
    await supabase.from("pack_consents" as never).upsert({ couple_id: me.couple!.id, user_id: me.userId, agreed } as never);
    setBusy(false); onDone();
  };
  return <div className="grain block-plum rounded-[28px] p-6">
    <div className="relative z-[2]">
      <p className="type-label">{t("question.consent.label")}</p>
      <p className="mt-3 type-title">{t("question.consent.title")}</p>
      {q.consent_partner && <p className="mt-2 type-caption">{t("question.consent.partnerYes", { partner: partnerCall })}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <PrimaryButton arrow={false} disabled={busy} className="bg-cream text-ink" onClick={() => void decide(true)}>{t("question.consent.yes")}</PrimaryButton>
        <PrimaryButton arrow={false} disabled={busy} className="bg-transparent text-current ring-2 ring-current" onClick={() => void decide(false)}>{t("question.consent.later")}</PrimaryButton>
      </div>
    </div>
  </div>;
}

function Waiting({ q, me, mine, partnerCall, onBack, onConsent }: { q: Today; me: Me; mine: Answer; partnerCall: string; onBack: () => void; onConsent: () => void }) {
  const { t } = useTranslation();
  return <Shell>
    <TopBar label={t("question.waitingLabel")} onBack={onBack} />
    <div className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-10">
      <FlameMark size={64} streak={me.streak?.current ?? 0} />
      <h1 className="type-display"><SlideUp>{t("question.waiting", { partner: partnerCall })}</SlideUp></h1>
      <p className="type-body text-muted-foreground">{t("question.waitingNote", { partner: partnerCall })}</p>
      <div className="rounded-[24px] bg-surface p-5"><p className="type-label text-muted-foreground">{t("question.yourAnswer")}</p><p className="mt-2 type-body text-[18px] whitespace-pre-wrap break-words">{mine.body}</p></div>
      <ConsentCard q={q} me={me} partnerCall={partnerCall} onDone={onConsent} />
    </div>
  </Shell>;
}

function Reveal({ tone, q, text, me, mine, theirs, partnerName, onBack }: { tone: string; q: Today; text: string; me: Me; mine: Answer; theirs: Answer; partnerName: string; onBack: () => void }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const key = `nendoi.revealed.${me.userId}.${q.id}.${q.date}`;
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [flood, setFlood] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (localStorage.getItem(key)) { setFlood(true); setOpen(true); } }, [key]);
  const reveal = (e: MouseEvent<HTMLButtonElement>) => { setAt(pointFrom(e, ref.current)); setFlood(true); haptic(20); localStorage.setItem(key, "1"); };

  const fl = floodFor(tone);
  return <Shell className={`grain ${tone}`}>
    <div ref={ref} className="relative flex flex-1 flex-col">
      <ColourFlood at={at} active={flood} colourClass={fl} onDone={() => setOpen(true)} />
      <div className="relative z-[2] flex flex-1 flex-col transition-colors duration-300" style={flood ? { color: floodText(fl) } : undefined}>
        <TopBar label={t(`question.packs.${q.pack}`)} onBack={onBack} />
        {!open ? <div className="flex flex-1 flex-col justify-end gap-5 px-5 pb-10">
          <p className="type-label">{t("question.bothLabel")}</p>
          <h1 className="type-display"><SlideUp>{t("question.bothTitle")}</SlideUp></h1>
          <PrimaryButton className={`h-16 text-[18px] ${fl}`} onClick={reveal}>{t("question.reveal")}</PrimaryButton>
        </div> : <div className="flex flex-1 flex-col gap-4 px-4 pb-10 pt-6">
          <h1 className={`px-1 font-display font-extrabold leading-[1.15] tracking-[-0.01em] text-balance break-words ${sizeFor(text) === "text-[34px]" ? "text-[26px]" : "text-[22px]"}`}>{text}</h1>
          {[{ a: mine, name: t("question.you"), from: -1 }, { a: theirs, name: partnerName, from: 1 }].map(({ a, name, from }, i) =>
            <motion.div key={a.id} initial={reduce ? { opacity: 0 } : { x: `${from * 110}%`, rotate: from * 8, opacity: 0 }} animate={{ x: 0, rotate: 0, opacity: 1 }}
              transition={reduce ? { duration: 0.2 } : { ...spring, damping: 20, delay: 0.1 + i * 0.12 }}>
              <AnswerCard answer={a} name={name} me={me} />
            </motion.div>)}
          <Replies q={q} me={me} partnerName={partnerName} />
          <SaveMemory q={q} text={text} mine={mine} theirs={theirs} me={me} partnerName={partnerName} />
        </div>}
      </div>
    </div>
  </Shell>;
}

function AnswerCard({ answer, name, me }: { answer: Answer; name: string; me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: reactions = [] } = useQuery({ queryKey: ["reactions", answer.id], queryFn: async () => {
    const { data } = await supabase.from("answer_reactions" as never).select("id,answer_id,user_id,kind").eq("answer_id", answer.id); return (data ?? []) as unknown as Reaction[];
  } });
  const toggle = async (kind: string) => {
    haptic(10);
    const own = reactions.find((r) => r.kind === kind && r.user_id === me.userId);
    if (own) await supabase.from("answer_reactions" as never).delete().eq("id", own.id);
    else await supabase.from("answer_reactions" as never).insert({ answer_id: answer.id, couple_id: me.couple!.id, kind } as never);
    void qc.invalidateQueries({ queryKey: ["reactions", answer.id] });
  };
  return <div className="rounded-[24px] bg-background p-5 text-foreground">
    <p className="type-label">{name}</p>
    <p className="mt-2 type-body text-[19px] leading-[1.5] whitespace-pre-wrap break-words">{answer.body}</p>
    <div className="mt-4 flex gap-2">
      {reactionIcons.map(({ kind, icon: Icon }) => {
        const mineOn = reactions.some((r) => r.kind === kind && r.user_id === me.userId);
        const count = reactions.filter((r) => r.kind === kind).length;
        return <Pressable key={kind} aria-label={t(`question.reactions.${kind}`)} aria-pressed={mineOn} onClick={() => void toggle(kind)}
          className={`inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 type-button ${mineOn ? "block-ember" : "bg-surface"}`}>
          <Icon strokeWidth={2.5} className="size-5" aria-hidden="true" />{count > 0 && <span className="nums">{count}</span>}
        </Pressable>;
      })}
    </div>
  </div>;
}

function Replies({ q, me, partnerName }: { q: Today; me: Me; partnerName: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const { data: replies = [] } = useQuery({ queryKey: ["replies", q.id, q.date], refetchInterval: 10_000, queryFn: async () => {
    const { data } = await supabase.from("answer_replies" as never).select("id,user_id,body,created_at").eq("question_id", q.id).eq("answer_date", q.date).order("created_at");
    return (data ?? []) as unknown as Reply[];
  } });
  const send = async () => {
    if (!body.trim()) return;
    await supabase.from("answer_replies" as never).insert({ couple_id: me.couple!.id, question_id: q.id, answer_date: q.date, body: body.trim() } as never);
    setBody(""); void qc.invalidateQueries({ queryKey: ["replies", q.id, q.date] });
  };
  return <div className="rounded-[24px] bg-background p-5 text-foreground">
    <p className="type-label">{t("question.replies")}</p>
    {replies.length > 0 && <ul className="mt-3 space-y-2">{replies.map((r) => <li key={r.id} className="type-body break-words"><span className="font-bold">{r.user_id === me.userId ? t("question.you") : partnerName}:</span> {r.body}</li>)}</ul>}
    <div className="mt-3 flex gap-2">
      <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder={t("question.replyPh")} aria-label={t("question.replyPh")}
        onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
        className="h-12 min-w-0 flex-1 rounded-[16px] bg-surface px-4 type-body focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50" />
      <Pressable haptics onClick={() => void send()} disabled={!body.trim()} className="h-12 rounded-[16px] bg-ink px-5 type-button text-cream disabled:opacity-40">{t("question.reply")}</Pressable>
    </div>
  </div>;
}

function SaveMemory({ q, text, mine, theirs, me, partnerName }: { q: Today; text: string; mine: Answer; theirs: Answer; me: Me; partnerName: string }) {
  const { t } = useTranslation();
  const key = `nendoi.savedq.${q.id}.${q.date}`;
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(!!localStorage.getItem(key)); }, [key]);
  const save = async () => {
    const note = `${me.profile?.display_name ?? t("question.you")}: ${mine.body}\n\n${partnerName}: ${theirs.body}`;
    const { error } = await supabase.from("memories").insert({ couple_id: me.couple!.id, title: text, happened_on: q.date, note });
    if (!error) { localStorage.setItem(key, "1"); setSaved(true); haptic(15); }
  };
  return <PrimaryButton className="h-16 bg-ink text-cream" disabled={saved} arrow={!saved} onClick={() => void save()}>{saved ? t("question.saved") : t("question.save")}</PrimaryButton>;
}
