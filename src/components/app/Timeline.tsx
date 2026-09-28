import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Lock, Mic, PenLine, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrimaryButton, SecondaryButton } from "@/components/visual";
import type { Me } from "@/lib/couple";
import { dateKey } from "@/lib/daily";
import { todayIn } from "@/lib/occasions";
import { VoicePlayer, VoiceRecorder, voiceExt } from "@/components/app/Voice";
import { cn } from "@/lib/utils";

type Filter = "all" | "photo" | "voice" | "date" | "question" | "milestone";
type Entry = { id: string; group: Exclude<Filter, "all"> | "note"; kind: string; date: string; title?: string; note?: string | null; paths?: string[]; voice?: { path: string; seconds: number | null };
  answers?: { name: string; body: string }[]; own?: boolean; memoryId?: string };

const toneFor: Record<string, string> = { note: "block-butter", voice: "block-plum", photo: "block-blush", dailyPhoto: "block-blush", date: "block-ember", question: "block-deep", milestone: "block-butter", capsule: "block-plum" };
const field = "w-full rounded-[18px] bg-surface px-4 py-3 type-body focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50";

function useTimeline(me: Me) {
  const { t } = useTranslation();
  const couple = me.couple!;
  return useQuery({ queryKey: ["timeline", couple.id], queryFn: async () => {
    const [mem, photos, dates, answers, capsules] = await Promise.all([
      supabase.from("memories").select("*"),
      supabase.from("photo_posts").select("post_date,storage_path,user_id"),
      supabase.from("shared_date_list").select("id,created_at,done,date_ideas(title_vi)").eq("done", true),
      supabase.from("question_answers").select("answer_date,user_id,body,daily_questions(text_vi)"),
      supabase.rpc("list_capsules"),
    ]);
    const out: Entry[] = [];
    for (const m of mem.data ?? []) {
      const date = m.happened_on ?? m.created_at.slice(0, 10);
      if (m.kind === "voice" && m.storage_path) out.push({ id: `m-${m.id}`, memoryId: m.id, group: "voice", kind: "voice", date, title: m.title, note: m.note, voice: { path: m.storage_path, seconds: m.voice_seconds }, own: m.created_by === me.userId });
      else if (m.storage_path) out.push({ id: `m-${m.id}`, memoryId: m.id, group: "photo", kind: "photo", date, title: m.title, note: m.note, paths: [m.storage_path], own: m.created_by === me.userId });
      else out.push({ id: `m-${m.id}`, memoryId: m.id, group: "note", kind: "note", date, title: m.title, note: m.note, own: m.created_by === me.userId });
    }
    // Daily photos appear only once both posted (the database already hides the partner's until you post).
    const byDay = new Map<string, string[]>();
    for (const p of photos.data ?? []) byDay.set(p.post_date, [...(byDay.get(p.post_date) ?? []), p.storage_path]);
    for (const [d, ps] of byDay) if (ps.length >= 2) out.push({ id: `p-${d}`, group: "photo", kind: "dailyPhoto", date: d, paths: ps });
    for (const d of dates.data ?? []) out.push({ id: `d-${d.id}`, group: "date", kind: "date", date: d.created_at.slice(0, 10), title: (d.date_ideas as { title_vi: string } | null)?.title_vi ?? "" });
    // Question results only when both answered.
    const qDay = new Map<string, { q: string; a: { user_id: string; body: string }[] }>();
    for (const a of answers.data ?? []) {
      const e = qDay.get(a.answer_date) ?? { q: (a.daily_questions as { text_vi: string } | null)?.text_vi ?? "", a: [] };
      e.a.push({ user_id: a.user_id, body: a.body }); qDay.set(a.answer_date, e);
    }
    const partnerName = me.profile?.partner_call_name || me.partner?.display_name || "";
    for (const [d, e] of qDay) if (e.a.length >= 2) out.push({ id: `q-${d}`, group: "question", kind: "question", date: d, title: e.q.split("{partner}").join(partnerName),
      answers: e.a.map((x) => ({ name: x.user_id === me.userId ? t("feat.play.you") : partnerName, body: x.body })) });
    for (const c of (capsules.data ?? []) as { id: string; type: string; status: string; opened_at: string | null }[])
      if (c.status === "opened" && c.opened_at) out.push({ id: `c-${c.id}`, group: "milestone", kind: "capsule", date: c.opened_at.slice(0, 10), title: t("feat.timeline.capsuleOpened", { type: t(`feat.capsule.types.${c.type}`) }) });
    // Milestones computed from the start date.
    if (couple.start_date) {
      const start = new Date(`${couple.start_date}T00:00:00`), today = todayIn(couple.timezone);
      for (const n of [100, 200, 300, 500, 1000, 1500, 2000]) { const d = new Date(start.getTime() + n * 86400000); if (d <= today) out.push({ id: `ms-d${n}`, group: "milestone", kind: "milestone", date: dateKey(d), title: t("feat.timeline.ms.days", { count: n }) }); }
      for (let y = 1; y < 60; y++) { const d = new Date(start); d.setFullYear(start.getFullYear() + y); if (d > today) break; out.push({ id: `ms-y${y}`, group: "milestone", kind: "milestone", date: dateKey(d), title: t("feat.timeline.ms.years", { count: y }) }); }
    }
    return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } });
}

export function Timeline({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useTimeline(me);
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState<"note" | "voice" | null>(null);
  const today = todayIn(me.couple!.timezone);
  const shown = (data ?? []).filter((e) => filter === "all" || e.group === filter);

  const resurface = useMemo(() => {
    if (!data?.length) return null;
    const ly = new Date(today); ly.setFullYear(today.getFullYear() - 1);
    const lm = new Date(today); lm.setMonth(today.getMonth() - 1);
    const y = data.find((e) => e.date === dateKey(ly) && e.kind !== "milestone");
    if (y) return { label: t("feat.timeline.resurfaceYear"), e: y };
    const m = data.find((e) => e.date === dateKey(lm) && e.kind !== "milestone");
    return m ? { label: t("feat.timeline.resurfaceMonth"), e: m } : null;
  }, [data, today.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => { void qc.invalidateQueries({ queryKey: ["timeline"] }); };
  const remove = async (id: string) => { await supabase.from("memories").delete().eq("id", id); refresh(); };

  return <div className="mt-5">
    <p className="flex items-center gap-2 px-1 type-button text-[14px]"><Lock strokeWidth={2.5} className="size-4" aria-hidden="true" />{t("feat.timeline.privacy")}</p>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <SecondaryButton onClick={() => setAdding(adding === "note" ? null : "note")} className="h-12 whitespace-nowrap px-3 text-[15px]"><PenLine strokeWidth={2.5} className="size-4" aria-hidden="true" />{t("feat.timeline.addNote")}</SecondaryButton>
      <SecondaryButton onClick={() => setAdding(adding === "voice" ? null : "voice")} className="h-12 whitespace-nowrap px-3 text-[15px]"><Mic strokeWidth={2.5} className="size-4" aria-hidden="true" />{t("feat.timeline.addVoice")}</SecondaryButton>
    </div>
    {adding && <AddEntry me={me} kind={adding} onDone={() => { setAdding(null); refresh(); }} />}
    {resurface && <div className="grain block-ember mt-5 rounded-[24px] p-5"><p className="relative z-[2] type-label">{resurface.label}</p><div className="relative z-[2] mt-3"><EntryBody e={resurface.e} /></div></div>}
    <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label={t("feat.timeline.filters.all")}>
      {(["all", "photo", "voice", "date", "question", "milestone"] as const).map((f) => <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
        className={cn("h-10 shrink-0 whitespace-nowrap rounded-full px-4 type-button text-[14px]", filter === f ? "bg-ink text-cream dark:bg-cream dark:text-ink" : "bg-surface")}>{t(`feat.timeline.filters.${f}`)}</button>)}
    </div>
    {data && !data.length && <p className="mt-6 px-1 type-body text-muted-foreground">{t("feat.timeline.empty")}</p>}
    {data && !!data.length && !shown.length && <p className="mt-6 px-1 type-body text-muted-foreground">{t("feat.timeline.filterEmpty")}</p>}
    <ol className="mt-4 space-y-3">{shown.map((e, i) => <motion.li key={e.id} data-kind={e.kind} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
      className={cn("grain rounded-[24px] p-5", toneFor[e.kind])}>
      <div className="relative z-[2]">
        <div className="flex items-start justify-between gap-3">
          <p className="type-label">{t(`feat.timeline.kinds.${e.kind}`)} · {new Date(`${e.date}T00:00:00`).toLocaleDateString("vi-VN")}</p>
          {e.own && e.memoryId && <button aria-label={t("feat.timeline.delete")} onClick={() => void remove(e.memoryId!)} className="-m-2 grid size-10 shrink-0 place-items-center"><Trash2 strokeWidth={2} className="size-4" /></button>}
        </div>
        <div className="mt-2"><EntryBody e={e} /></div>
      </div>
    </motion.li>)}</ol>
  </div>;
}

function EntryBody({ e }: { e: Entry }) {
  return <>
    {e.paths && <div className={cn("mb-3 grid gap-2", e.paths.length > 1 && "grid-cols-2")}>{e.paths.map((p) => <SignedImg key={p} path={p} />)}</div>}
    {e.title && e.kind !== "note" && <p className="type-title leading-[1.2]">{e.title}</p>}
    {e.note && <p className="mt-1 whitespace-pre-line break-words type-body">{e.note}</p>}
    {e.voice && <div className="mt-3"><VoicePlayer path={e.voice.path} seconds={e.voice.seconds} /></div>}
    {e.answers && <div className="mt-3 grid grid-cols-2 gap-2">{e.answers.map((a, i) => <div key={i} className="rounded-[16px] bg-cream p-3 text-ink"><p className="type-label">{a.name}</p><p className="mt-1 break-words text-[14px] font-bold leading-snug">{a.body}</p></div>)}</div>}
  </>;
}

function SignedImg({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { void supabase.storage.from("photos").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null)); }, [path]);
  return url ? <img src={url} alt="" className="aspect-[4/3] w-full rounded-[16px] object-cover" /> : <div className="aspect-[4/3] w-full rounded-[16px] bg-current/10" />;
}

function AddEntry({ me, kind, onDone }: { me: Me; kind: "note" | "voice"; onDone: () => void }) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [voice, setVoice] = useState<{ blob: Blob; seconds: number } | null>(null);
  const [busy, setBusy] = useState(false), [err, setErr] = useState(false);
  const couple = me.couple!;
  const save = async () => {
    setBusy(true); setErr(false);
    const happened_on = dateKey(todayIn(couple.timezone));
    let error: unknown = null;
    if (kind === "note") {
      ({ error } = await supabase.from("memories").insert({ couple_id: couple.id, created_by: me.userId, kind: "note", title: note.trim().slice(0, 60), note: note.trim(), happened_on }));
    } else if (voice) {
      const path = `${couple.id}/memories/${crypto.randomUUID()}.${voiceExt(voice.blob.type)}`;
      const up = await supabase.storage.from("photos").upload(path, voice.blob, { contentType: voice.blob.type });
      error = up.error;
      if (!error) ({ error } = await supabase.from("memories").insert({ couple_id: couple.id, created_by: me.userId, kind: "voice", title: t("feat.timeline.voiceTitle"), note: note.trim() || null, storage_path: path, voice_seconds: voice.seconds, happened_on }));
    }
    setBusy(false);
    if (error) setErr(true); else onDone();
  };
  return <div className="mt-3 space-y-3 rounded-[24px] bg-surface/60 p-4">
    {kind === "voice" && <VoiceRecorder value={voice} onChange={setVoice} />}
    <textarea className={cn(field, "h-24")} maxLength={500} placeholder={t("feat.timeline.notePh")} value={note} onChange={(e) => setNote(e.target.value)} aria-label={t("feat.timeline.notePh")} />
    {err && <p role="alert" className="type-button">{t("feat.error")}</p>}
    <div className="flex gap-3">
      <SecondaryButton onClick={onDone}>{t("feat.timeline.cancel")}</SecondaryButton>
      <PrimaryButton disabled={busy || (kind === "note" ? !note.trim() : !voice)} onClick={() => void save()}>{busy ? t("feat.timeline.saving") : t("feat.timeline.save")}</PrimaryButton>
    </div>
  </div>;
}
