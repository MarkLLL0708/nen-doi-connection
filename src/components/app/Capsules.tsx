import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ImagePlus, Lock, MailOpen, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomSheet, PrimaryButton, SecondaryButton, spring } from "@/components/visual";
import type { Me } from "@/lib/couple";
import { dateKey } from "@/lib/daily";
import { todayIn } from "@/lib/occasions";
import { VoicePlayer, VoiceRecorder, voiceExt } from "@/components/app/Voice";
import { cn } from "@/lib/utils";

export type Capsule = { id: string; type: CapType; status: "draft" | "sealed" | "opened"; unlock_on: string | null; mine: boolean; created_at: string; opened_at: string | null;
  readable: boolean; body: string | null; photo_path: string | null; voice_path: string | null; voice_seconds: number | null };
type CapType = "miss" | "sad" | "birthday" | "anniversary" | "fight";
const TYPES: CapType[] = ["miss", "sad", "birthday", "anniversary", "fight"];
const DATED: CapType[] = ["birthday", "anniversary"];
const tone: Record<CapType, string> = { miss: "block-blush", sad: "block-plum", birthday: "block-butter", anniversary: "block-ember", fight: "block-deep" };

export function useCapsules() {
  return useQuery({ queryKey: ["capsules"], refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await supabase.rpc("list_capsules");
    if (error) throw error;
    return (data ?? []) as unknown as Capsule[];
  } });
}

function nextOccurrence(md: string | null | undefined, today: Date) {
  if (!md) return "";
  const [, m, d] = md.split("-").map(Number);
  const x = new Date(today.getFullYear(), m! - 1, d!);
  if (x <= today) x.setFullYear(x.getFullYear() + 1);
  return dateKey(x);
}
const fmt = (d: string, language: string) => new Date(`${d}T00:00:00`).toLocaleDateString(language === "en" ? "en-US" : "vi-VN");

export function Capsules({ me }: { me: Me }) {
  const { t, i18n } = useTranslation();
  const { data } = useCapsules();
  const [composing, setComposing] = useState(false);
  const partner = me.profile?.partner_call_name || me.partner?.display_name || t("app.setup.call.ban");
  const drafts = (data ?? []).filter((c) => c.mine && c.status === "draft");
  const sent = (data ?? []).filter((c) => c.mine && c.status !== "draft");
  const got = (data ?? []).filter((c) => !c.mine);
  return <div className="mt-5">
    <p className="flex items-center gap-2 px-1 type-button text-[14px]"><Lock strokeWidth={2.5} className="size-4" aria-hidden="true" />{t("feat.timeline.privacy")}</p>
    <p className="mt-3 px-1 type-body text-muted-foreground">{t("feat.capsule.body")}</p>
    <div className="mt-4">{!me.partner ? <p className="px-1 type-body">{t("feat.capsule.noPartner")}</p>
      : composing ? <Compose me={me} partner={partner} onDone={() => setComposing(false)} />
      : <PrimaryButton onClick={() => setComposing(true)}>{t("feat.capsule.new")}</PrimaryButton>}</div>
    {data && !data.length && !composing && <p className="mt-6 px-1 type-body text-muted-foreground">{t("feat.capsule.empty")}</p>}
    {!!got.length && <Section title={t("feat.capsule.received")}>{got.map((c) => <Received key={c.id} c={c} me={me} partner={partner} />)}</Section>}
    {!!drafts.length && <Section title={t("feat.capsule.drafts")}>{drafts.map((c) => <Draft key={c.id} c={c} />)}</Section>}
    {!!sent.length && <Section title={t("feat.capsule.sent")}>{sent.map((c) => <div key={c.id} data-testid="sent-capsule" className={cn("grain rounded-[24px] p-5", tone[c.type])}>
      <div className="relative z-[2] flex items-center justify-between gap-3">
        <p className="type-title text-[19px] leading-[1.2]">{t(`feat.capsule.types.${c.type}`)}</p>
        <span className="shrink-0 rounded-full bg-cream px-3 py-1 type-button text-[13px] text-ink">{c.status === "opened" ? t("feat.capsule.stOpened") : t("feat.capsule.stSent")}</span>
      </div>
      {c.unlock_on && <p className="relative z-[2] mt-2 type-caption">{t("feat.capsule.sealedUntil", { date: fmt(c.unlock_on, i18n.language) })}</p>}
    </div>)}</Section>}
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-7"><h2 className="px-1 type-label text-muted-foreground">{title}</h2><div className="mt-3 space-y-3">{children}</div></section>;
}

function Received({ c, me, partner }: { c: Capsule; me: Me; partner: string }) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const reduce = useReducedMotion();
  const [ask, setAsk] = useState(false);
  const [err, setErr] = useState(false);
  const today = todayIn(me.couple!.timezone);
  const dated = DATED.includes(c.type);
  const left = c.unlock_on ? Math.round((new Date(`${c.unlock_on}T00:00:00`).getTime() - today.getTime()) / 86400000) : 0;
  const open = async () => {
    setAsk(false);
    const { error } = await supabase.rpc("open_capsule", { _id: c.id });
    setErr(!!error);
    void qc.invalidateQueries({ queryKey: ["capsules"] }); void qc.invalidateQueries({ queryKey: ["timeline"] });
  };
  const isOpen = c.status === "opened" && c.readable;
  return <div data-testid="received-capsule" className={cn("grain overflow-hidden rounded-[24px] p-5", tone[c.type])}>
    <div className="relative z-[2]">
      <p className="type-label">{t("feat.capsule.from", { name: partner })}</p>
      <p className="mt-2 type-title leading-[1.2]">{t(`feat.capsule.types.${c.type}`)}</p>
      <AnimatePresence initial={false}>{isOpen ? <motion.div key="open" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring} className="mt-4 rounded-[18px] bg-cream p-4 text-ink">
        {c.photo_path && <CapsuleImg path={c.photo_path} />}
        {c.body && <p className="whitespace-pre-line break-words type-body" data-testid="capsule-body">{c.body}</p>}
        {c.voice_path && <div className="mt-3"><VoicePlayer path={c.voice_path} seconds={c.voice_seconds} /></div>}
      </motion.div> : <motion.div key="sealed" exit={{ opacity: 0 }} className="mt-4">
        {dated && !c.readable ? <p className="flex items-center gap-2 type-button"><Lock strokeWidth={2.5} className="size-4" aria-hidden="true" />{t("feat.capsule.sealedUntil", { date: fmt(c.unlock_on!, i18n.language) })} · {t("feat.capsule.daysLeft", { count: left })}</p>
          : <>
            {!dated && <p className="type-caption">{t("feat.capsule.openWhen")}</p>}
            <button onClick={() => (dated ? void open() : setAsk(true))} className="mt-3 inline-flex h-12 items-center gap-2 rounded-[16px] bg-ink px-5 type-button text-cream"><MailOpen strokeWidth={2.5} className="size-4" aria-hidden="true" />{t("feat.capsule.open")}</button>
          </>}
      </motion.div>}</AnimatePresence>
      {err && <p role="alert" className="mt-3 type-button">{t("feat.error")}</p>}
    </div>
    <BottomSheet open={ask} onOpenChange={setAsk}>
      <p className="type-display text-[30px] leading-[1.15]">{t("feat.capsule.confirm")}</p>
      <p className="mt-3 type-body text-muted-foreground">{t("feat.capsule.confirmBody")}</p>
      <div className="mt-6 flex gap-3"><SecondaryButton onClick={() => setAsk(false)}>{t("feat.capsule.notYet")}</SecondaryButton><PrimaryButton onClick={() => void open()}>{t("feat.capsule.yes")}</PrimaryButton></div>
    </BottomSheet>
  </div>;
}

function CapsuleImg({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { void supabase.storage.from("photos").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null)); }, [path]);
  return url ? <img src={url} alt="" className="mb-3 aspect-[4/3] w-full rounded-[14px] object-cover" /> : null;
}

function Draft({ c }: { c: Capsule }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["capsules"] });
  const send = async () => { const { error } = await supabase.rpc("seal_capsule", { _id: c.id }); setErr(error ? sealError(error.message, t) : null); refresh(); };
  const del = async () => { await supabase.from("capsules").delete().eq("id", c.id); refresh(); };
  return <div className="rounded-[24px] bg-surface p-5">
    <div className="flex items-center justify-between gap-3"><p className="type-title text-[19px] leading-[1.2]">{t(`feat.capsule.types.${c.type}`)}</p><span className="shrink-0 type-label text-muted-foreground">{t("feat.capsule.draft")}</span></div>
    {c.body && <p className="mt-2 line-clamp-3 break-words type-body text-muted-foreground">{c.body}</p>}
    {err && <p role="alert" className="mt-3 type-button">{err}</p>}
    <div className="mt-4 flex gap-2">
      <button onClick={() => void del()} aria-label={t("feat.capsule.delete")} className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-background"><Trash2 strokeWidth={2} className="size-4" /></button>
      <PrimaryButton className="h-12" onClick={() => void send()}>{t("feat.capsule.send")}</PrimaryButton>
    </div>
  </div>;
}

function sealError(msg: string, t: (k: string) => string) {
  return /limit/.test(msg) ? t("feat.capsule.errLimit") : /date/.test(msg) ? t("feat.capsule.errDate") : /empty/.test(msg) ? t("feat.capsule.errEmpty") : t("feat.error");
}

function Compose({ me, partner, onDone }: { me: Me; partner: string; onDone: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const today = todayIn(me.couple!.timezone);
  const [type, setType] = useState<CapType>("miss");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [voice, setVoice] = useState<{ blob: Blob; seconds: number } | null>(null);
  const [withVoice, setWithVoice] = useState(false);
  const [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const dated = DATED.includes(type);
  useEffect(() => {
    if (type === "birthday") setDate(nextOccurrence(me.partner?.birthday, today));
    else if (type === "anniversary") setDate(nextOccurrence(me.couple?.start_date, today));
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (seal: boolean) => {
    setBusy(true); setErr(null);
    const { data: row, error } = await supabase.from("capsules").insert({ couple_id: me.couple!.id, sender_id: me.userId, recipient_id: me.partner!.id, type, body: body.trim(), unlock_on: dated && date ? date : null }).select("id").single();
    if (error || !row) { setErr(t("feat.error")); setBusy(false); return; }
    const dir = `u-${me.userId}/capsules/${row.id}`;
    const patch: { photo_path?: string; voice_path?: string; voice_seconds?: number } = {};
    if (photo) { const p = `${dir}/photo.${photo.name.split(".").pop() || "jpg"}`; if (!(await supabase.storage.from("photos").upload(p, photo, { contentType: photo.type })).error) patch.photo_path = p; }
    if (voice) { const p = `${dir}/voice.${voiceExt(voice.blob.type)}`; if (!(await supabase.storage.from("photos").upload(p, voice.blob, { contentType: voice.blob.type })).error) { patch.voice_path = p; patch.voice_seconds = voice.seconds; } }
    if (Object.keys(patch).length) await supabase.from("capsules").update(patch).eq("id", row.id);
    if (seal) {
      const { error: e2 } = await supabase.rpc("seal_capsule", { _id: row.id });
      if (e2) { setErr(sealError(e2.message, t)); setBusy(false); void qc.invalidateQueries({ queryKey: ["capsules"] }); return; }
    }
    setBusy(false); void qc.invalidateQueries({ queryKey: ["capsules"] }); onDone();
  };

  return <div className="space-y-4 rounded-[24px] bg-surface/60 p-4">
    <div><p className="type-label text-muted-foreground">{t("feat.capsule.pickType")}</p>
      <div className="mt-2 flex flex-wrap gap-2">{TYPES.map((k) => <button key={k} onClick={() => setType(k)} aria-pressed={type === k}
        className={cn("min-h-10 rounded-full px-4 py-2 text-left type-button text-[14px]", type === k ? tone[k] : "bg-surface")}>{t(`feat.capsule.types.${k}`)}</button>)}</div></div>
    {dated && <label className="block"><span className="type-label text-muted-foreground">{t("feat.capsule.date")}</span>
      <input type="date" min={dateKey(new Date(today.getTime() + 86400000))} value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 h-14 w-full rounded-[18px] bg-surface px-4 type-body" /></label>}
    <div>
      <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 1000))} maxLength={1000} rows={6} placeholder={t("feat.capsule.textPh", { partner })} aria-label={t("feat.capsule.textPh", { partner })}
        className="w-full rounded-[18px] bg-surface p-4 type-body focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50" />
      <p className="mt-1 text-right type-caption text-muted-foreground tabular-nums">{t("feat.capsule.count", { count: body.length })}</p>
    </div>
    <label className="flex h-12 cursor-pointer items-center gap-2 rounded-[16px] bg-surface px-4 type-button">
      <ImagePlus strokeWidth={2} className="size-5 shrink-0" aria-hidden="true" /><span className="truncate">{photo ? photo.name : t("feat.capsule.photo")}</span>
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
    </label>
    {withVoice ? <VoiceRecorder value={voice} onChange={setVoice} /> : <SecondaryButton className="h-12" onClick={() => setWithVoice(true)}>{t("feat.capsule.voice")}</SecondaryButton>}
    {err && <p role="alert" className="rounded-[16px] block-ember px-4 py-3 type-button">{err}</p>}
    <div className="grid grid-cols-2 gap-3">
      <SecondaryButton disabled={busy} onClick={() => void save(false)}>{t("feat.capsule.saveDraft")}</SecondaryButton>
      <PrimaryButton disabled={busy || (dated && !date)} arrow={false} onClick={() => void save(true)}><Send strokeWidth={2.5} className="size-4" aria-hidden="true" />{busy ? t("feat.capsule.sending") : t("feat.capsule.send")}</PrimaryButton>
    </div>
    <button onClick={onDone} className="h-10 type-button underline decoration-2 underline-offset-4">{t("feat.timeline.cancel")}</button>
  </div>;
}
