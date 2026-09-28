import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ColourFlood, FlameMark, PrimaryButton, SlideUp, pointFrom, spring } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { useMe, type Me } from "@/lib/couple";
import { dailySlice, dateKey } from "@/lib/daily";
import { todayIn } from "@/lib/occasions";
import i18n from "@/i18n";
import { SAMPLE_PHOTOS_KEY, testFlag } from "@/lib/testmode";
import s1 from "@/assets/sample-1.jpg";
import s2 from "@/assets/sample-2.jpg";
import s3 from "@/assets/sample-3.jpg";
import s4 from "@/assets/sample-4.jpg";
import s5 from "@/assets/sample-5.jpg";
import s6 from "@/assets/sample-6.jpg";

const SAMPLES = [s1, s2, s3, s4, s5, s6];

export const Route = createFileRoute("/_authenticated/photo")({
  head: () => ({ meta: [
    { title: i18n.t("feat.photo.metaTitle") },
    { name: "description", content: i18n.t("feat.photo.metaDesc") },
    { property: "og:title", content: i18n.t("feat.photo.metaTitle") },
    { property: "og:description", content: i18n.t("feat.photo.metaDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PhotoScreen,
});

type Post = { id: string; user_id: string; storage_path: string; caption: string | null };

function PhotoScreen() {
  const { data: me, isLoading } = useMe();
  const go = useNavigate();
  useEffect(() => { if (!isLoading && (!me?.couple || !me.profile?.onboarded)) void go({ to: "/onboarding", replace: true }); }, [isLoading, me, go]);
  if (!me?.couple) return <Shell><div className="grid flex-1 place-items-center"><FlameMark size={40} /></div></Shell>;
  return <PhotoFlow me={me} />;
}

function useSigned(path: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { if (!path) return; void supabase.storage.from("photos").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null)); }, [path]);
  return url;
}

function PhotoFlow({ me }: { me: Me }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reduce = useReducedMotion();
  const day = dateKey(todayIn(me.couple!.timezone));
  const partner = me.profile?.partner_call_name || me.partner?.display_name || t("app.setup.call.ban");

  const prompt = useQuery({ queryKey: ["photoPrompt", day], queryFn: async () => {
    const { data } = await supabase.from("photo_prompts").select("id,text_vi,sort_order").order("sort_order");
    return dailySlice(data ?? [], day, 1)[0] ?? null;
  } });
  const posts = useQuery({ queryKey: ["photoPosts", day], refetchInterval: 5000, queryFn: async () => {
    const { data } = await supabase.from("photo_posts").select("id,user_id,storage_path,caption").eq("post_date", day);
    return (data ?? []) as Post[];
  } });
  const mine = posts.data?.find((p) => p.user_id === me.userId);
  const theirs = posts.data?.find((p) => p.user_id !== me.userId);

  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null), [flood, setFlood] = useState(false), [open, setOpen] = useState(false);

  const pick = (f: File | null) => {
    if (f && f.size > 10 * 1024 * 1024) { setErr(t("feat.photo.tooBig")); return; }
    setErr(null); setFile(f); setPreview(f ? URL.createObjectURL(f) : null);
  };
  const [useSamples, setUseSamples] = useState(false);
  useEffect(() => { setUseSamples(testFlag(SAMPLE_PHOTOS_KEY) === "1"); }, []);
  const pickSample = async (src: string, i: number) => {
    const blob = await (await fetch(src)).blob();
    pick(new File([blob], `sample-${i + 1}.jpg`, { type: "image/jpeg" }));
  };
  const send = async () => {
    if (!file) return;
    setBusy(true); setErr(null);
    const path = `${me.couple!.id}/daily/${day}-${me.userId}-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
    const up = await supabase.storage.from("photos").upload(path, file, { contentType: file.type });
    const ins = up.error ? up : await supabase.from("photo_posts").insert({ couple_id: me.couple!.id, user_id: me.userId, post_date: day, prompt_id: prompt.data?.id ?? null, storage_path: path, caption: caption.trim() || null });
    setBusy(false);
    if (ins.error) { setErr(t("feat.error")); return; }
    void qc.invalidateQueries({ queryKey: ["photoPosts"] }); void qc.invalidateQueries({ queryKey: ["today"] }); void qc.invalidateQueries({ queryKey: ["me"] });
  };

  return <Shell>
    <div ref={box} className="relative flex flex-1 flex-col overflow-hidden px-5 pb-10 pt-4">
      <ColourFlood at={at} active={flood} colourClass="flood-auto" onDone={() => setOpen(true)} />
      <div className={`relative z-[2] flex flex-1 flex-col ${flood ? "flood-auto-text" : ""}`}>
        <button onClick={() => void navigate({ to: "/app" })} className="flex h-12 w-fit items-center gap-2 type-button"><ArrowLeft strokeWidth={2.5} className="size-5" />{t("feat.photo.back")}</button>
        <p className="mt-4 type-label">{t("feat.photo.label")}</p>
        <h1 className="mt-3 type-display text-[34px]"><SlideUp>{prompt.data?.text_vi ?? "…"}</SlideUp></h1>

        {!posts.data ? null : !mine ? <div className="mt-6 space-y-3">
          {useSamples ? <>
            {preview && <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]"><img src={preview} alt="" className="absolute inset-0 size-full object-cover" /></div>}
            <p className="type-label">{t("test.pickSample")}</p>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLES.map((src, i) => <button key={src} type="button" aria-label={`${t("test.pickSample")} ${i + 1}`} onClick={() => void pickSample(src, i)} className="overflow-hidden rounded-[12px]">
                <img src={src} alt="" width={768} height={960} loading="lazy" className="aspect-[4/5] w-full object-cover" /></button>)}
            </div>
          </> : <label className="grain block-butter relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-[28px]">
            {preview ? <img src={preview} alt="" className="absolute inset-0 size-full object-cover" /> : <span className="relative z-[2] flex flex-col items-center gap-3 type-button"><Camera strokeWidth={2} className="size-10" />{t("feat.photo.pick")}</span>}
            <input type="file" accept="image/*" className="sr-only" aria-label={t("feat.photo.pick")} onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>}
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={t("feat.photo.caption")} aria-label={t("feat.photo.caption")}
            className="h-14 w-full rounded-[18px] bg-surface px-4 type-body focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50" />
          {err && <p role="alert" className="type-button">{err}</p>}
          <PrimaryButton disabled={!file || busy} onClick={() => void send()}>{busy ? t("feat.photo.sending") : t("feat.photo.send")}</PrimaryButton>
        </div>
        : !theirs ? <div className="mt-6"><Pic post={mine} label={t("feat.photo.you")} i={0} reduce={!!reduce} />
          <p className="mt-5 flex items-center gap-3 type-title"><FlameMark size={28} />{t("feat.photo.waiting", { partner })}</p></div>
        : !open ? <div className="mt-auto pt-8"><PrimaryButton onClick={(e: MouseEvent<HTMLButtonElement>) => { setAt(pointFrom(e, box.current)); setFlood(true); }}>{t("feat.photo.reveal")}</PrimaryButton></div>
        : <div className="mt-6 space-y-4"><Pic post={mine} label={t("feat.photo.you")} i={0} reduce={!!reduce} /><Pic post={theirs} label={partner} i={1} reduce={!!reduce} /></div>}
      </div>
    </div>
  </Shell>;
}

function Pic({ post, label, i, reduce }: { post: Post; label: string; i: number; reduce: boolean }) {
  const url = useSigned(post.storage_path);
  return <motion.figure initial={reduce ? { opacity: 0 } : { opacity: 0, x: i ? 60 : -60, rotate: i ? 5 : -5 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ ...spring, delay: i * 0.12 }}
    className="rounded-[28px] bg-cream p-3 text-ink">
    {url ? <img src={url} alt="" className="aspect-[4/5] w-full rounded-[20px] object-cover" /> : <div className="aspect-[4/5] w-full rounded-[20px] bg-ink/10" />}
    <figcaption className="px-2 pb-1 pt-3"><span className="type-label">{label}</span>{post.caption && <p className="mt-1 type-body">{post.caption}</p>}</figcaption>
  </motion.figure>;
}
