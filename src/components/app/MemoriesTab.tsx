import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ImagePlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrimaryButton, SecondaryButton, SlideUp } from "@/components/visual";
import type { Me } from "@/lib/couple";
import { dateKey } from "@/lib/daily";
import { PhotoDiary } from "@/components/app/PhotoDiary";
import { todayIn } from "@/lib/occasions";

const tones = ["block-plum", "block-butter", "block-blush", "block-ember"];
const field = "h-14 w-full rounded-[18px] bg-surface px-4 type-body focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50";

export function MemoriesTab({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"list" | "diary">("list");
  const list = useQuery({ queryKey: ["memories"], queryFn: async () => {
    const { data, error } = await supabase.from("memories").select("*").order("happened_on", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
  const remove = async (id: string) => { await supabase.from("memories").delete().eq("id", id); void qc.invalidateQueries({ queryKey: ["memories"] }); };

  return <div className="px-4 pt-8">
    <p className="px-1 type-label text-muted-foreground">{t("feat.memories.label")}</p>
    <h1 className="mt-3 px-1 type-display"><SlideUp>{t("feat.memories.title")}</SlideUp></h1>
    <div className="mt-5 grid grid-cols-2 gap-2 rounded-[20px] bg-surface p-1" role="tablist">
      {(["list", "diary"] as const).map((k) => <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
        className={`h-12 rounded-[16px] type-button ${view === k ? "block-blush" : ""}`}>{t(`feat.memories.tabs.${k}`)}</button>)}
    </div>
    {view === "diary" ? <PhotoDiary me={me} /> : <>
    <div className="mt-6">{adding ? <AddMemory me={me} onDone={() => { setAdding(false); void qc.invalidateQueries({ queryKey: ["memories"] }); }} />
      : <PrimaryButton onClick={() => setAdding(true)}>{t("feat.memories.add")}</PrimaryButton>}</div>
    {list.data && !list.data.length && <p className="mt-6 px-1 type-body text-muted-foreground">{t("feat.memories.empty")}</p>}
    <div className="mt-6 space-y-3">{(list.data ?? []).map((m, i) => <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: Math.min(i, 8) * 0.04 }}>
      <article className={`grain ${tones[i % tones.length]} rounded-[24px] p-5`}>
        <div className="relative z-[2]">
          {m.storage_path && <MemoryPhoto path={m.storage_path} />}
          <div className="flex items-start justify-between gap-3">
            <p className="type-label">{m.happened_on ? new Date(m.happened_on).toLocaleDateString("vi-VN") : ""}</p>
            <button aria-label={t("feat.memories.delete")} onClick={() => void remove(m.id)} className="-m-2 grid size-10 place-items-center"><Trash2 strokeWidth={2} className="size-4" /></button>
          </div>
          <p className="mt-2 type-title">{m.title}</p>
          {m.note && <p className="mt-2 whitespace-pre-line type-body">{m.note}</p>}
        </div>
      </article>
    </motion.div>)}</div>
    </>}
  </div>;
}

function MemoryPhoto({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { void supabase.storage.from("photos").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null)); }, [path]);
  return url ? <img src={url} alt="" className="mb-4 aspect-[4/3] w-full rounded-[18px] object-cover" /> : <div className="mb-4 aspect-[4/3] w-full rounded-[18px] bg-ink/10" />;
}

function AddMemory({ me, onDone }: { me: Me; onDone: () => void }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(""), [date, setDate] = useState(dateKey(todayIn(me.couple!.timezone))), [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [err, setErr] = useState(false);
  const save = async () => {
    setBusy(true); setErr(false);
    let storage_path: string | null = null;
    if (file) {
      storage_path = `${me.couple!.id}/memories/${crypto.randomUUID()}.${file.name.split(".").pop() || "jpg"}`;
      const up = await supabase.storage.from("photos").upload(storage_path, file, { contentType: file.type });
      if (up.error) { setErr(true); setBusy(false); return; }
    }
    const { error } = await supabase.from("memories").insert({ couple_id: me.couple!.id, title: title.trim(), happened_on: date, note: note.trim() || null, storage_path });
    setBusy(false);
    if (error) setErr(true); else onDone();
  };
  return <div className="space-y-3 rounded-[24px] bg-surface/60 p-4">
    <input className={field} placeholder={t("feat.memories.fTitle")} value={title} onChange={(e) => setTitle(e.target.value)} aria-label={t("feat.memories.fTitle")} />
    <input className={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t("feat.memories.fDate")} />
    <textarea className={`${field} h-28 py-3`} placeholder={t("feat.memories.fNote")} value={note} onChange={(e) => setNote(e.target.value)} aria-label={t("feat.memories.fNote")} />
    <label className="flex h-14 cursor-pointer items-center gap-2 rounded-[18px] bg-surface px-4 type-button">
      <ImagePlus strokeWidth={2} className="size-5" />{file ? file.name : t("feat.memories.fPhoto")}
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
    </label>
    {err && <p role="alert" className="type-button">{t("feat.error")}</p>}
    <div className="flex gap-3">
      <SecondaryButton onClick={onDone}>{t("feat.memories.cancel")}</SecondaryButton>
      <PrimaryButton disabled={!title.trim() || busy} onClick={() => void save()}>{busy ? t("feat.memories.saving") : t("feat.memories.save")}</PrimaryButton>
    </div>
  </div>;
}
