import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, Copy, Lock, RotateCcw, ShieldAlert } from "lucide-react";
import { FlameMark, PrimaryButton, SlideUp, spring } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { COACH_DIALECTS, COACH_EXAMPLES, COACH_MAX_INPUT, COACH_TONES, COACH_USE_CASES, type CoachDialect, type CoachResult, type CoachTone, type CoachUseCase } from "@/config/coach";
import { coachRemaining, coachSuggest } from "@/lib/coach.functions";
import { updateProfile, useMe } from "@/lib/couple";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [
    { title: i18n.t("feat.coach.metaTitle") }, { name: "description", content: i18n.t("feat.coach.metaDesc") },
    { property: "og:title", content: i18n.t("feat.coach.metaTitle") }, { property: "og:description", content: i18n.t("feat.coach.metaDesc") },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Coach,
});

const chip = (on: boolean) => cn("min-h-10 rounded-full px-4 py-2 text-left type-button text-[14px] leading-snug", on ? "bg-ink text-cream dark:bg-cream dark:text-ink" : "bg-surface");
const profileDialect = (d?: string | null): CoachDialect => (d === "north" || d === "bac" ? "north" : d === "south" || d === "nam" ? "south" : "neutral");

function Coach() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const suggest = useServerFn(coachSuggest);
  const remainingFn = useServerFn(coachRemaining);
  const remaining = useQuery({ queryKey: ["coach-remaining"], queryFn: () => remainingFn() });
  const [text, setText] = useState("");
  const [useCase, setUseCase] = useState<CoachUseCase>("rewrite");
  const [tone, setTone] = useState<CoachTone>("gentle");
  const [dialect, setDialect] = useState<CoachDialect | null>(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<CoachResult | null>(null);
  const [err, setErr] = useState(false);
  const dl = dialect ?? profileDialect(me?.profile?.dialect);
  const partner = me?.profile?.partner_call_name || me?.partner?.display_name || "";

  const run = async (over?: { text: string; useCase: CoachUseCase; tone: CoachTone }) => {
    const body = { text: over?.text ?? text, useCase: over?.useCase ?? useCase, tone: over?.tone ?? tone, dialect: dl, partner };
    if (!body.text.trim()) return;
    setBusy(true); setErr(false);
    try { setRes(await suggest({ data: body })); } catch { setErr(true); }
    setBusy(false); void qc.invalidateQueries({ queryKey: ["coach-remaining"] });
  };
  const example = (i: number) => { const e = COACH_EXAMPLES[i]!; setText(e.text); setUseCase(e.useCase); setTone(e.tone); void run(e); };
  const toggleHistory = async () => { if (!me) return; await updateProfile(me.userId, { save_coach_history: !me.profile?.save_coach_history }); void qc.invalidateQueries({ queryKey: ["me"] }); };
  const left = remaining.data?.remaining;

  if (res?.kind === "safety") return <Shell><div className="flex flex-1 flex-col px-5 pb-10 pt-3">
    <button onClick={() => setRes(null)} className="flex h-12 w-fit items-center gap-2 type-button"><ArrowLeft strokeWidth={2.5} className="size-5" aria-hidden="true" />{t("feat.coach.safetyBack")}</button>
    <div role="alert" data-testid="safety-card" className="grain block-plum mt-6 rounded-[28px] p-6">
      <ShieldAlert strokeWidth={2} className="relative z-[2] size-8" aria-hidden="true" />
      <h1 className="relative z-[2] mt-5 type-display text-[30px] leading-[1.15]">{t("feat.coach.safetyTitle")}</h1>
      <p className="relative z-[2] mt-4 type-body">{t("feat.coach.safetyBody")}</p>
      <p className="relative z-[2] mt-5 rounded-[18px] bg-cream p-4 type-button text-ink">{t("feat.coach.safetyResources")}</p>
    </div>
    <p className="mt-6 px-1 type-caption text-muted-foreground">{t("feat.coach.disclaimer")}</p>
  </div></Shell>;

  return <Shell><div className="flex flex-1 flex-col px-4 pb-12 pt-3">
    <button onClick={() => void navigate({ to: "/app" })} className="flex h-12 w-fit items-center gap-2 type-button"><ArrowLeft strokeWidth={2.5} className="size-5" aria-hidden="true" />{t("feat.coach.back")}</button>
    <p className="mt-2 px-1 type-label text-muted-foreground">{t("feat.coach.label")}</p>
    <h1 className="mt-2 px-1 type-display text-[36px] leading-[1.15]"><SlideUp>{t("feat.coach.title")}</SlideUp></h1>
    <p className="mt-3 rounded-[18px] block-butter p-4 type-button text-[14px] leading-snug" data-testid="disclaimer">{t("feat.coach.disclaimer")}</p>

    <label className="mt-5 block px-1 type-title text-[18px]" htmlFor="coach-text">{t("feat.coach.inputLabel")}</label>
    <textarea id="coach-text" value={text} onChange={(e) => setText(e.target.value.slice(0, COACH_MAX_INPUT))} rows={5} placeholder={t("feat.coach.inputPh")}
      className="mt-2 w-full rounded-[18px] bg-surface p-4 type-body focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50" />
    <p className="mt-2 flex gap-2 px-1 type-caption text-muted-foreground"><Lock strokeWidth={2.5} className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t("feat.coach.privacy")}</p>

    <div className="mt-3 flex flex-wrap gap-2">
      <span className="self-center px-1 type-label text-muted-foreground">{t("feat.coach.examples")}</span>
      {COACH_EXAMPLES.map((_, i) => <button key={i} onClick={() => example(i)} className="h-9 rounded-full border-2 border-current px-3 text-[13px] font-bold">{t("feat.coach.example", { n: i + 1 })}</button>)}
    </div>

    <Group title={t("feat.coach.useCase")}>{COACH_USE_CASES.map((k) => <button key={k} aria-pressed={useCase === k} onClick={() => setUseCase(k)} className={chip(useCase === k)}>{t(`feat.coach.useCases.${k}`)}</button>)}</Group>
    <Group title={t("feat.coach.tone")}>{COACH_TONES.map((k) => <button key={k} aria-pressed={tone === k} onClick={() => setTone(k)} className={chip(tone === k)}>{t(`feat.coach.tones.${k}`)}</button>)}</Group>
    <Group title={t("feat.coach.dialect")}>{COACH_DIALECTS.map((k) => <button key={k} aria-pressed={dl === k} onClick={() => setDialect(k)} className={chip(dl === k)}>{t(`feat.coach.dialects.${k}`)}</button>)}</Group>

    <PrimaryButton className="mt-6" disabled={busy || !text.trim()} onClick={() => void run()}>{busy ? t("feat.coach.thinking") : t("feat.coach.submit")}</PrimaryButton>
    {left !== undefined && <p className="mt-2 px-1 type-caption text-muted-foreground" data-testid="coach-remaining">{left < 0 ? t("feat.coach.unlimited") : t("feat.coach.remaining", { count: left })}</p>}
    {err && <p role="alert" className="mt-4 type-button">{t("feat.error")}</p>}
    {busy && <div className="mt-6 grid place-items-center"><FlameMark size={32} /></div>}
    {res?.kind === "limit" && <p role="alert" className="mt-5 rounded-[18px] block-ember p-4 type-button">{t("feat.coach.limit")}</p>}
    {res?.kind === "refuse" && <p role="alert" data-testid="refuse" className="mt-5 rounded-[18px] block-deep p-4 type-button">{t("feat.coach.refuse")}</p>}
    {res?.kind === "ok" && !busy && <Results versions={res.versions} onAgain={() => void run()} />}

    <div className="mt-10 flex items-center justify-between gap-4 rounded-[20px] bg-surface p-4">
      <div><p className="type-button">{t("feat.coach.history")}</p><p className="mt-1 type-caption text-muted-foreground">{t("feat.coach.historyNote")}</p></div>
      <button role="switch" aria-checked={!!me?.profile?.save_coach_history} aria-label={t("feat.coach.history")} onClick={() => void toggleHistory()}
        className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", me?.profile?.save_coach_history ? "bg-ember" : "bg-foreground/25")}>
        <span className={cn("absolute top-1 size-6 rounded-full bg-cream transition-all", me?.profile?.save_coach_history ? "left-7" : "left-1")} />
      </button>
    </div>
  </div></Shell>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-5"><p className="px-1 type-label text-muted-foreground">{title}</p><div className="mt-2 flex flex-wrap gap-2">{children}</div></div>;
}

function Results({ versions, onAgain }: { versions: { short: string; medium: string; long: string }; onAgain: () => void }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (k: string, s: string) => { try { await navigator.clipboard.writeText(s); setCopied(k); setTimeout(() => setCopied(null), 1500); } catch { /* ignore */ } };
  return <div className="mt-6 space-y-3" data-testid="coach-results">
    {(["short", "medium", "long"] as const).map((k, i) => <motion.div key={k} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.06 }}
      className={cn("grain rounded-[24px] p-5", ["block-blush", "block-butter", "block-plum"][i])}>
      <div className="relative z-[2] flex items-center justify-between gap-3">
        <p className="type-label">{t(`feat.coach.versions.${k}`)}</p>
        <button onClick={() => void copy(k, versions[k])} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3 text-[13px] font-bold text-cream">
          {copied === k ? <Check strokeWidth={2.5} className="size-4" aria-hidden="true" /> : <Copy strokeWidth={2.5} className="size-4" aria-hidden="true" />}{copied === k ? t("feat.coach.copied") : t("feat.coach.copy")}
        </button>
      </div>
      <p className="relative z-[2] mt-3 whitespace-pre-line break-words type-body" data-testid={`v-${k}`}>{versions[k]}</p>
    </motion.div>)}
    <button onClick={onAgain} className="inline-flex h-12 items-center gap-2 type-button underline decoration-2 underline-offset-4"><RotateCcw strokeWidth={2.5} className="size-4" aria-hidden="true" />{t("feat.coach.again")}</button>
  </div>;
}
