import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Pause, Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Pressable } from "@/components/visual";
import { cn } from "@/lib/utils";

export const VOICE_MAX_SECONDS = 60;

function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}
export function voiceExt(type: string) { return type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm"; }

/** Records up to `max` seconds from the microphone; stops by itself at the limit. */
export function VoiceRecorder({ value, onChange, max = VOICE_MAX_SECONDS }: { value: { blob: Blob; seconds: number } | null; onChange: (v: { blob: Blob; seconds: number } | null) => void; max?: number }) {
  const { t } = useTranslation();
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const mr = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(0);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); mr.current?.stream.getTracks().forEach((x) => x.stop()); }, []);

  const stop = () => { if (mr.current && mr.current.state !== "inactive") mr.current.stop(); };
  const start = async () => {
    setErr(null);
    const mime = pickMime();
    if (mime === null || !navigator.mediaDevices?.getUserMedia) { setErr(t("feat.timeline.recUnsupported")); return; }
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { setErr(t("feat.timeline.recDenied")); return; }
    const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    r.onstop = () => {
      if (timer.current) clearInterval(timer.current);
      stream.getTracks().forEach((x) => x.stop());
      const seconds = Math.min(max, Math.max(1, Math.round((Date.now() - started.current) / 1000)));
      setRec(false);
      onChange({ blob: new Blob(chunks, { type: r.mimeType || "audio/webm" }), seconds });
    };
    mr.current = r; started.current = Date.now(); setSecs(0); setRec(true); onChange(null);
    r.start(250);
    timer.current = setInterval(() => {
      const s = Math.floor((Date.now() - started.current) / 1000);
      setSecs(s);
      if (s >= max) stop();
    }, 200);
  };

  return <div className="space-y-2">
    <div className="flex items-center gap-3">
      <Pressable haptics onClick={() => (rec ? stop() : void start())} aria-label={rec ? t("feat.timeline.recStop") : value ? t("feat.timeline.recAgain") : t("feat.timeline.recStart")}
        className={cn("grid size-14 shrink-0 place-items-center rounded-full", rec ? "block-ember" : "bg-ink text-cream")}>
        {rec ? <Square strokeWidth={2.5} className="size-5" /> : <Mic strokeWidth={2.5} className="size-5" />}
      </Pressable>
      <div className="min-w-0 flex-1">
        {rec ? <>
          <p className="type-button tabular-nums">{secs}s / {max}s</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full bg-ember transition-[width]" style={{ width: `${Math.min(100, (secs / max) * 100)}%` }} /></div>
        </> : value ? <LocalPlayer blob={value.blob} seconds={value.seconds} /> : <p className="type-caption text-muted-foreground">{t("feat.timeline.recLimit", { count: max })}</p>}
      </div>
    </div>
    {err && <p role="alert" className="type-caption">{err}</p>}
  </div>;
}

function LocalPlayer({ blob, seconds }: { blob: Blob; seconds: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { const u = URL.createObjectURL(blob); setUrl(u); return () => URL.revokeObjectURL(u); }, [blob]);
  return url ? <AudioButton src={url} seconds={seconds} /> : null;
}

/** Plays a private voice note through a short-lived signed link. */
export function VoicePlayer({ path, seconds }: { path: string; seconds?: number | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { void supabase.storage.from("photos").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null)); }, [path]);
  return <AudioButton src={url} seconds={seconds ?? null} />;
}

function AudioButton({ src, seconds }: { src: string | null; seconds: number | null }) {
  const { t } = useTranslation();
  const a = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  const [p, setP] = useState(0);
  return <div className="flex items-center gap-3">
    <Pressable disabled={!src} onClick={() => { const el = a.current; if (!el) return; if (el.paused) void el.play(); else el.pause(); }}
      aria-label={on ? t("feat.timeline.pause") : t("feat.timeline.play")} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-cream disabled:opacity-40">
      {on ? <Pause strokeWidth={2.5} className="size-4" /> : <Play strokeWidth={2.5} className="size-4" />}
    </Pressable>
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-current/15"><div className="h-full bg-current" style={{ width: `${p * 100}%` }} /></div>
    {seconds != null && <span className="shrink-0 type-button tabular-nums">{t("feat.timeline.seconds", { count: seconds })}</span>}
    {src && <audio ref={a} src={src} preload="metadata" data-testid="voice-audio" onPlay={() => setOn(true)} onPause={() => setOn(false)} onEnded={() => { setOn(false); setP(0); }}
      onTimeUpdate={(e) => { const el = e.currentTarget; if (el.duration && isFinite(el.duration)) setP(el.currentTime / el.duration); }} />}
  </div>;
}
