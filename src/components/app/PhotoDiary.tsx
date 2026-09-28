import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { MoreHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrimaryButton, SecondaryButton, spring } from "@/components/visual";
import type { Me } from "@/lib/couple";

type Post = { id: string; user_id: string; post_date: string; storage_path: string; caption: string | null };
type Pair = { date: string; mine: Post; theirs: Post };

/** Past days where both partners posted. The database only returns the partner's photo for days you posted too. */
export function PhotoDiary({ me }: { me: Me }) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState<Pair | null>(null);
  const { data } = useQuery({ queryKey: ["diary", me.couple!.id], queryFn: async () => {
    const { data, error } = await supabase.from("photo_posts").select("id,user_id,post_date,storage_path,caption").eq("couple_id", me.couple!.id).order("post_date", { ascending: false });
    if (error) throw error;
    const byDay = new Map<string, Post[]>();
    for (const p of (data ?? []) as Post[]) byDay.set(p.post_date, [...(byDay.get(p.post_date) ?? []), p]);
    const pairs: Pair[] = [];
    for (const [date, ps] of byDay) {
      const mine = ps.find((p) => p.user_id === me.userId), theirs = ps.find((p) => p.user_id !== me.userId);
      if (mine && theirs) pairs.push({ date, mine, theirs });
    }
    const paths = pairs.flatMap((p) => [p.mine.storage_path, p.theirs.storage_path]);
    const urls: Record<string, string> = {};
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("photos").createSignedUrls(paths, 3600);
      for (const s of signed ?? []) if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    }
    return { pairs, urls };
  } });

  if (!data) return null;
  if (!data.pairs.length) return <p className="mt-6 px-1 type-body text-muted-foreground">{t("feat.memories.diaryEmpty")}</p>;
  const loc = i18n.language === "en" ? "en-GB" : "vi-VN";
  const months = new Map<string, Pair[]>();
  for (const p of data.pairs) months.set(p.date.slice(0, 7), [...(months.get(p.date.slice(0, 7)) ?? []), p]);

  return <div className="mt-6 space-y-8">
    {[...months].map(([m, pairs]) => <section key={m}>
      <h2 className="px-1 type-title">{new Date(`${m}-01T00:00:00`).toLocaleDateString(loc, { month: "long", year: "numeric" })}</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {pairs.map((p) => <button key={p.date} onClick={() => setOpen(p)} aria-label={new Date(`${p.date}T00:00:00`).toLocaleDateString(loc)} className="relative grid aspect-square grid-cols-2 overflow-hidden rounded-[12px] bg-surface">
          {[p.mine, p.theirs].map((x) => <img key={x.id} src={data.urls[x.storage_path]} alt="" loading="lazy" className="size-full object-cover" />)}
          <span className="absolute bottom-1 left-1 rounded-full bg-ink px-2 py-0.5 type-label text-cream nums">{p.date.slice(8, 10)}</span>
        </button>)}
      </div>
    </section>)}
    <AnimatePresence>{open && <Viewer key={open.date} pair={open} urls={data.urls} loc={loc} partner={me.profile?.partner_call_name || me.partner?.display_name || ""}
      onClose={() => setOpen(null)} onDeleted={() => { setOpen(null); void qc.invalidateQueries({ queryKey: ["diary"] }); void qc.invalidateQueries({ queryKey: ["photoPosts"] }); }} />}</AnimatePresence>
  </div>;
}

function Viewer({ pair, urls, loc, partner, onClose, onDeleted }: { pair: Pair; urls: Record<string, string>; loc: string; partner: string; onClose: () => void; onDeleted: () => void }) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState(false), [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState(false);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const del = async () => {
    setBusy(true); setErr(false);
    const { error } = await supabase.from("photo_posts").delete().eq("id", pair.mine.id);
    if (!error) await supabase.storage.from("photos").remove([pair.mine.storage_path]);
    setBusy(false);
    if (error) setErr(true); else onDeleted();
  };
  return <motion.div role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-ink text-cream">
    <div className="mx-auto flex min-h-dvh max-w-[390px] flex-col px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={onClose} aria-label={t("feat.memories.close")} className="grid size-12 place-items-center rounded-full bg-cream/10"><X strokeWidth={2.5} className="size-5" /></button>
        <p className="type-label">{new Date(`${pair.date}T00:00:00`).toLocaleDateString(loc)}</p>
        <button onClick={() => setMenu((v) => !v)} aria-label={t("feat.memories.menu")} aria-expanded={menu} className="grid size-12 place-items-center rounded-full bg-cream/10"><MoreHorizontal strokeWidth={2.5} className="size-5" /></button>
      </div>
      {menu && !confirm && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mt-2 self-end">
        <SecondaryButton className="w-auto" onClick={() => setConfirm(true)}>{t("feat.memories.deleteMine")}</SecondaryButton></motion.div>}
      {confirm && <div className="mt-3 rounded-[20px] bg-cream p-4 text-ink">
        <p className="type-button">{t("feat.memories.deleteConfirm")}</p>
        <div className="mt-3 flex gap-3"><SecondaryButton onClick={() => { setConfirm(false); setMenu(false); }}>{t("feat.memories.cancel")}</SecondaryButton>
          <PrimaryButton arrow={false} tone="ember" disabled={busy} onClick={() => void del()}>{t("feat.memories.deleteYes")}</PrimaryButton></div>
        {err && <p role="alert" className="mt-2 type-button">{t("feat.error")}</p>}
      </div>}
      <div className="mt-4 space-y-4">
        {[{ p: pair.mine, n: t("feat.memories.you") }, { p: pair.theirs, n: partner }].map(({ p, n }) => <figure key={p.id}>
          <img src={urls[p.storage_path]} alt="" className="w-full rounded-[24px] object-cover" />
          <figcaption className="mt-2 type-button">{n}{p.caption ? ` · ${p.caption}` : ""}</figcaption>
        </figure>)}
      </div>
    </div>
  </motion.div>;
}
